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
// `Prisma` is imported as a value (not type-only): the detail read below uses
// `Prisma.sql` to compose a safe, parameterized raw query.
import { Prisma } from "@/lib/generated/prisma/client"
import type { Course as CourseRecord, PrismaClient } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository, type UpsertPlan } from "./base-repository"
import type { RepositoryLogSink } from "./logger"
import type { BulkRepositoryResult, RepositoryResult } from "./repository-result"

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
 * A course plus every tournament linked to it, for the detail page. Read-only
 * shape assembled by {@link CourseRepository.findDetailById}.
 */
export interface CourseDetailRow {
  course: CourseRecord
  tournaments: CourseTournamentRow[]
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
   * Load a course for the detail page: the course record plus every tournament
   * linked to it via `tournament_courses`, newest first. Returns `null` when
   * the id does not exist or the row is soft-deleted, so the caller can render a
   * proper 404. The id is bound, never interpolated (injection-safe). Read-only.
   */
  async findDetailById(id: string): Promise<CourseDetailRow | null> {
    const course = await this.findById(id)
    if (!course) return null

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

    return { course, tournaments }
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

/** Translate a validated `Course` into a Prisma upsert plan keyed by slug. */
function toUpsertPlan(course: Course): UpsertPlan<Prisma.CourseCreateInput, Prisma.CourseUpdateInput> {
  const common = {
    name: course.name,
    slug: course.slug,
    city: course.city,
    stateProvince: course.stateProvince,
    country: course.country,
    par: course.par,
    yardage: course.yardage,
  }
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
