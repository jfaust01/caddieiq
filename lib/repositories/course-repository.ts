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
import type { Course as CourseRecord, Prisma, PrismaClient } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository, type UpsertPlan } from "./base-repository"
import type { RepositoryLogSink } from "./logger"
import type { BulkRepositoryResult, RepositoryResult } from "./repository-result"

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
