/**
 * CourseHoleRepository.
 *
 * Persistence layer for course holes. Supports create, update, upsert,
 * and bulk operations with proper cascade handling.
 */

import type { CourseHole as CourseHoleRecord, PrismaClient } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

export interface CourseHoleInput {
  courseId: string
  holeNumber: number
  par?: number | null
  yardage?: number | null
  handicap?: number | null
}

export class CourseHoleRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "course-hole", sink)
  }

  /**
   * Find a hole by course ID and hole number.
   */
  async findByHoleNumber(courseId: string, holeNumber: number): Promise<CourseHoleRecord | null> {
    return this.prisma.courseHole.findUnique({
      where: { courseId_holeNumber: { courseId, holeNumber } },
    })
  }

  /**
   * Find all holes for a course.
   */
  async findByCourseId(courseId: string): Promise<CourseHoleRecord[]> {
    return this.prisma.courseHole.findMany({
      where: { courseId },
      orderBy: { holeNumber: "asc" },
    })
  }

  /**
   * Upsert a single hole by course ID and hole number.
   */
  async upsert(input: CourseHoleInput): Promise<RepositoryResult<CourseHoleRecord>> {
    try {
      const reference = `${input.courseId}:hole-${input.holeNumber}`

      const result = await this.prisma.courseHole.upsert({
        where: { courseId_holeNumber: { courseId: input.courseId, holeNumber: input.holeNumber } },
        update: {
          par: input.par,
          yardage: input.yardage,
          handicap: input.handicap,
        },
        create: {
          courseId: input.courseId,
          holeNumber: input.holeNumber,
          par: input.par,
          yardage: input.yardage,
          handicap: input.handicap,
        },
      })

      // Check if it was an insert or update by checking if createdAt === updatedAt (within a small time window)
      const isInsert = new Date(result.updatedAt).getTime() - new Date(result.createdAt).getTime() < 100
      if (isInsert) {
        this.logger.insert(reference)
        return ok(result, "inserted")
      }

      this.logger.update(reference)
      return ok(result, "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "course-hole",
        operation: "upsert",
        reference: `${input.courseId}:hole-${input.holeNumber}`,
      })
      this.logger.failure(
        `${input.courseId}:hole-${input.holeNumber}`,
        repoError.message,
        { code: repoError.code },
      )
      return fail<CourseHoleRecord>(repoError)
    }
  }

  /**
   * Bulk upsert holes. Never throws per item.
   */
  async bulkUpsert(holes: readonly CourseHoleInput[]): Promise<BulkRepositoryResult<CourseHoleRecord>> {
    return this.runBulk(
      holes,
      (h) => `${h.courseId}:hole-${h.holeNumber}`,
      (h) => this.upsert(h),
    )
  }

  /**
   * Delete all holes for a course (used during course updates).
   */
  async deleteForCourse(courseId: string): Promise<number> {
    const result = await this.prisma.courseHole.deleteMany({
      where: { courseId },
    })
    return result.count
  }
}

/**
 * Shared default instance. Lazily constructed so importing this module never
 * forces a database connection.
 */
let _courseHoleRepository: CourseHoleRepository | undefined
export function getCourseHoleRepository(): CourseHoleRepository {
  return (_courseHoleRepository ??= new CourseHoleRepository())
}
