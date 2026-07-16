/**
 * Course repository.
 *
 * The only layer permitted to persist courses. It accepts already-validated
 * `Course` domain objects and translates them into Prisma writes — no mapping,
 * validation, or external fetching.
 *
 * Idempotency: reconciliation is keyed by the unique, source-derived `slug`,
 * so repeated imports update the existing course rather than duplicating it.
 */

import type { Course } from "@/lib/domain/course/types"
import type { ExternalReference } from "@/lib/domain/shared/types"
// `Prisma` and `CoordinateConfidence` are imported as values (not type-only):
// the detail read below uses `Prisma.sql` to compose a safe, parameterized raw
// query, and the geolocation writer references the enum's members.
import { CoordinateConfidence, Prisma } from "@/lib/generated/prisma/client"
import type {
  Course as CourseRecord,
  CourseCharacteristic as CourseCharacteristicRecord,
  PrismaClient,
} from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository, type UpsertPlan } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

/**
 * A single tournament that has been played on a course, flattened for the
 * course detail page. Produced by {@link CourseRepository.findDetailById}.
 */
export interface CourseTournamentRow {
  id: string
  name: string
  status: string
  startDate: Date | null
  endDate: Date | null
  /** The year the event was hosted here (from the join row). */
  year: number
  /** Whether this course was the primary host for that edition. */
  hostCourse: boolean
  tourName: string | null
  tourCode: string | null
}

/**
 * The verified inputs the Course Intelligence Engine derives a profile from:
 * the course core record plus its optional analytics record. `characteristic`
 * is `null` when no analytics have been imported for the course, so the engine
 * degrades to an all-unknown profile rather than fabricating values.
 */
export interface CourseProfileInputsRow {
  course: CourseRecord
  characteristic: CourseCharacteristicRecord | null
}

/**
 * A course plus every tournament linked to it, for the detail page. Read-only
 * shape assembled by {@link CourseRepository.findDetailById}. Carries the
 * verified `characteristic` record (or `null`) so the detail page can render
 * Course Intelligence without a second round trip.
 */
export interface CourseDetailRow {
  course: CourseRecord
  characteristic: CourseCharacteristicRecord | null
  tournaments: CourseTournamentRow[]
}

/**
 * The minimal course facts the Course Geolocation Engine needs to build a
 * geocoding query. Returned by {@link CourseRepository.findCoursesNeedingCoordinates}
 * for courses whose coordinates are not yet VERIFIED.
 */
export interface CourseGeocodeTargetRow {
  id: string
  name: string
  city: string | null
  stateProvince: string | null
  country: string | null
}

/** A verified coordinate to persist, with the provider that vouched for it. */
export interface VerifiedCoordinatesInput {
  latitude: number
  longitude: number
  /** Provider identity, stored as `coordinateSource` (e.g. "osm-nominatim"). */
  source: string
  /** When the coordinate was verified. Defaults to now. */
  verifiedAt?: Date
}

export class CourseRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "course", sink)
  }

  /** Find a course by internal id. Excludes soft-deleted rows. */
  async findById(id: string): Promise<CourseRecord | null> {
    const record = await this.prisma.course.findUnique({ where: { id } })
    return record && record.deletedAt === null ? record : null
  }

  /**
   * Load the verified inputs the Course Intelligence Engine needs for a course:
   * the core record plus its optional `CourseCharacteristic` analytics row.
   * Returns `null` when the course does not exist or is soft-deleted. Read-only.
   * Reused by both the course detail page and the tournament host-course view.
   */
  async findProfileInputsById(id: string): Promise<CourseProfileInputsRow | null> {
    const course = await this.findById(id)
    if (!course) return null
    const characteristic = await this.prisma.courseCharacteristic.findUnique({
      where: { courseId: id },
    })
    return { course, characteristic }
  }

  /**
   * Load a course for the detail page: the course record plus every tournament
   * linked to it via `tournament_courses`, newest first. Returns `null` when
   * the id does not exist or the row is soft-deleted, so the caller can render a
   * proper 404. The id is bound, never interpolated (injection-safe). Read-only.
   */
  async findDetailById(id: string): Promise<CourseDetailRow | null> {
    const inputs = await this.findProfileInputsById(id)
    if (!inputs) return null
    const { course, characteristic } = inputs

    const tournaments = await this.prisma.$queryRaw<CourseTournamentRow[]>(Prisma.sql`
      SELECT
        t.id AS "id",
        t.name AS "name",
        t.status::text AS "status",
        t."startDate" AS "startDate",
        t."endDate" AS "endDate",
        tc.year AS "year",
        tc."hostCourse" AS "hostCourse",
        tr.name AS "tourName",
        tr.code AS "tourCode"
      FROM tournament_courses tc
      JOIN tournaments t ON t.id = tc."tournamentId" AND t."deletedAt" IS NULL
      JOIN tours tr ON tr.id = t."tourId"
      WHERE tc."courseId" = ${id}
      ORDER BY tc.year DESC, t."startDate" DESC NULLS LAST, t.name ASC
    `)

    return { course, characteristic, tournaments }
  }

  /**
   * Find a course by an external provider reference.
   *
   * The current `courses` schema has no external-id column, so external
   * identity is reconciled via the deterministic `slug` at upsert time. Returns
   * `null` and logs a skip until a provenance column is added to the schema.
   * TODO(schema): persist `ExternalReference` and query it here.
   */
  async findByExternalId(ref: ExternalReference): Promise<CourseRecord | null> {
    this.logger.skip(`${ref.source}:${ref.externalId}`, {
      reason: "external-id lookup not supported by current schema; reconcile by slug",
    })
    return null
  }

  /**
   * List courses the geolocation engine still has work to do on, newest first,
   * excluding soft-deleted rows. Read-only.
   *
   * Two tiers, controlled by `includeApproximate`:
   *   - Default (`false`): return only courses with NO usable coordinate yet —
   *     UNKNOWN or the reserved ESTIMATED. A VERIFIED or APPROXIMATE course is
   *     treated as resolved and never re-geocoded, so routine re-runs are cheap
   *     and idempotent.
   *   - Upgrade mode (`true`): also return APPROXIMATE courses, so a later run
   *     can retry the course-precise (OSM) provider and upgrade a city-level
   *     fallback to a VERIFIED match. Still never returns a VERIFIED course.
   *
   * @param limit - Optional cap on rows returned, to bound a single run.
   * @param options.includeApproximate - Include APPROXIMATE courses for upgrade.
   */
  async findCoursesNeedingCoordinates(
    limit?: number,
    options: { includeApproximate?: boolean } = {},
  ): Promise<CourseGeocodeTargetRow[]> {
    const excluded = options.includeApproximate
      ? [CoordinateConfidence.VERIFIED]
      : [CoordinateConfidence.VERIFIED, CoordinateConfidence.APPROXIMATE]

    const courses = await this.prisma.course.findMany({
      where: {
        deletedAt: null,
        coordinateConfidence: { notIn: excluded },
      },
      select: { id: true, name: true, city: true, stateProvince: true, country: true },
      orderBy: { createdAt: "desc" },
      ...(limit != null ? { take: limit } : {}),
    })
    return courses
  }

  /**
   * Persist a VERIFIED coordinate for a course — atomically and only when the
   * course is not already VERIFIED.
   *
   * The write is a conditional `updateMany` filtered on
   * `coordinateConfidence != VERIFIED`, so a course that a provider verified
   * earlier is never overwritten, even under a race. Returns `true` when this
   * call wrote the coordinate, `false` when it was a no-op (already verified or
   * course missing/soft-deleted). Never throws for the no-op case.
   */
  async setVerifiedCoordinates(
    courseId: string,
    coords: VerifiedCoordinatesInput,
  ): Promise<RepositoryResult<CourseRecord>> {
    try {
      const result = await this.prisma.course.updateMany({
        where: {
          id: courseId,
          deletedAt: null,
          // The guard that makes "never overwrite verified" atomic.
          coordinateConfidence: { not: CoordinateConfidence.VERIFIED },
        },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          coordinateConfidence: CoordinateConfidence.VERIFIED,
          coordinateSource: coords.source,
          coordinatesVerifiedAt: coords.verifiedAt ?? new Date(),
        },
      })

      if (result.count === 0) {
        // Already verified, or no such live course: a benign skip, not a failure.
        this.logger.skip(courseId, { reason: "already-verified-or-missing" })
        return { outcome: "skipped" }
      }

      const record = await this.prisma.course.findUnique({ where: { id: courseId } })
      this.logger.update(courseId)
      return record ? ok(record, "updated") : { outcome: "updated" }
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "course",
        operation: "setVerifiedCoordinates",
        reference: courseId,
      })
      this.logger.failure(courseId, repoError.message, { code: repoError.code })
      return fail<CourseRecord>(repoError)
    }
  }

  /**
   * Persist an APPROXIMATE (city-level) coordinate for a course — atomically and
   * only when doing so does not overwrite a better value.
   *
   * The write is a conditional `updateMany` filtered on
   * `coordinateConfidence NOT IN (VERIFIED, APPROXIMATE)`, which encodes two
   * guarantees at once:
   *   - Never downgrade: a VERIFIED (course-precise) coordinate is never
   *     replaced by a city centroid.
   *   - Idempotent: a course already APPROXIMATE is left untouched, so re-runs
   *     don't churn the row or waste writes.
   *
   * Returns `true`/`updated` when this call wrote the coordinate, `skipped`
   * when it was a benign no-op (already VERIFIED/APPROXIMATE, or missing).
   * Never throws for the no-op case.
   */
  async setApproximateCoordinates(
    courseId: string,
    coords: VerifiedCoordinatesInput,
  ): Promise<RepositoryResult<CourseRecord>> {
    try {
      const result = await this.prisma.course.updateMany({
        where: {
          id: courseId,
          deletedAt: null,
          // Only fill in courses with no usable coordinate; never downgrade a
          // verified one, and never re-write an existing approximate one.
          coordinateConfidence: {
            notIn: [CoordinateConfidence.VERIFIED, CoordinateConfidence.APPROXIMATE],
          },
        },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          coordinateConfidence: CoordinateConfidence.APPROXIMATE,
          coordinateSource: coords.source,
          coordinatesVerifiedAt: coords.verifiedAt ?? new Date(),
        },
      })

      if (result.count === 0) {
        this.logger.skip(courseId, { reason: "already-resolved-or-missing" })
        return { outcome: "skipped" }
      }

      const record = await this.prisma.course.findUnique({ where: { id: courseId } })
      this.logger.update(courseId)
      return record ? ok(record, "updated") : { outcome: "updated" }
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "course",
        operation: "setApproximateCoordinates",
        reference: courseId,
      })
      this.logger.failure(courseId, repoError.message, { code: repoError.code })
      return fail<CourseRecord>(repoError)
    }
  }

  /** Idempotently persist a single validated course domain object. */
  async upsert(course: Course): Promise<RepositoryResult<CourseRecord>> {
    return this.upsertBySlug(this.prisma.course, toUpsertPlan(course), "course")
  }

  /** Idempotently persist a batch of validated courses. Never throws per item. */
  async bulkUpsert(courses: readonly Course[]): Promise<BulkRepositoryResult<CourseRecord>> {
    return this.runBulk(
      courses,
      (c) => c.slug,
      (c) => this.upsert(c),
    )
  }
}

/** `coordinateSource` value stamped on coordinates that came from the feed. */
const PROVIDER_COORDINATE_SOURCE = "sportsdataio"

/**
 * Translate a validated `Course` into a Prisma upsert plan keyed by slug.
 *
 * Coordinate handling follows the source-priority order (see
 * docs/COURSE_GEOLOCATION.md):
 *
 *   - **Provider coordinates present** (both lat/lng non-null): the feed is the
 *     highest-priority source, so they are written as a `VERIFIED` coordinate
 *     (`coordinateSource="sportsdataio"`). This pre-empts geocoding — the
 *     Geolocation Engine's work queue skips any VERIFIED course. (SportsDataIO's
 *     golf tier supplies none today, so this branch is currently dormant but
 *     ready.)
 *   - **Provider coordinates absent** (the norm): NO coordinate columns are
 *     written. Coordinates are then owned exclusively by the Geolocation Engine
 *     ({@link CourseRepository.setVerifiedCoordinates} /
 *     {@link CourseRepository.setApproximateCoordinates}). Omitting the fields
 *     (rather than nulling them) leaves any engine-resolved value intact on
 *     re-import and defaults new rows to `UNKNOWN`.
 */
function toUpsertPlan(course: Course): UpsertPlan<Prisma.CourseCreateInput, Prisma.CourseUpdateInput> {
  const base = {
    name: course.name,
    slug: course.slug,
    city: course.city,
    stateProvince: course.stateProvince,
    country: course.country,
    par: course.par,
    yardage: course.yardage,
  }

  // The mapper only sets both coordinates together (all-or-nothing), so testing
  // one is sufficient; testing both keeps the type narrowing explicit.
  if (course.latitude === null || course.longitude === null) {
    return { slug: course.slug, create: base, update: base }
  }

  const coordinates = {
    latitude: course.latitude,
    longitude: course.longitude,
    coordinateConfidence: CoordinateConfidence.VERIFIED,
    coordinateSource: PROVIDER_COORDINATE_SOURCE,
    coordinatesVerifiedAt: new Date(),
  }
  const common = { ...base, ...coordinates }
  return { slug: course.slug, create: common, update: common }
}

/**
 * Shared default instance, wired to the Prisma singleton. Lazily constructed so
 * importing this module never forces a database connection.
 */
let _courseRepository: CourseRepository | undefined
export function getCourseRepository(): CourseRepository {
  return (_courseRepository ??= new CourseRepository())
}
