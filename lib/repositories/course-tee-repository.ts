/**
 * CourseTeeRepository.
 *
 * Persistence layer for course tees. Supports create, update, upsert,
 * and bulk operations with proper cascade handling.
 */

import type { CourseTee as CourseTeeRecord, PrismaClient } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

export interface CourseTeeInput {
  courseId: string
  teeName: string
  teeColor?: string | null
  gender?: string | null
  yardage?: number | null
  rating?: number | null
  slope?: number | null
}

export class CourseTeeRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "course-tee", sink)
  }

  /**
   * Find a tee by course ID and tee name.
   */
  async findByTeeName(courseId: string, teeName: string): Promise<CourseTeeRecord | null> {
    return this.prisma.courseTee.findUnique({
      where: { courseId_teeName: { courseId, teeName } },
    })
  }

  /**
   * Find all tees for a course.
   */
  async findByCourseId(courseId: string): Promise<CourseTeeRecord[]> {
    return this.prisma.courseTee.findMany({
      where: { courseId },
      orderBy: { teeName: "asc" },
    })
  }

  /**
   * Upsert a single tee by course ID and tee name.
   */
  async upsert(input: CourseTeeInput): Promise<RepositoryResult<CourseTeeRecord>> {
    try {
      const reference = `${input.courseId}:tee-${input.teeName}`

      const result = await this.prisma.courseTee.upsert({
        where: { courseId_teeName: { courseId: input.courseId, teeName: input.teeName } },
        update: {
          teeColor: input.teeColor,
          gender: input.gender,
          yardage: input.yardage,
          rating: input.rating,
          slope: input.slope,
        },
        create: {
          courseId: input.courseId,
          teeName: input.teeName,
          teeColor: input.teeColor,
          gender: input.gender,
          yardage: input.yardage,
          rating: input.rating,
          slope: input.slope,
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
        entity: "course-tee",
        operation: "upsert",
        reference: `${input.courseId}:tee-${input.teeName}`,
      })
      this.logger.failure(
        `${input.courseId}:tee-${input.teeName}`,
        repoError.message,
        { code: repoError.code },
      )
      return fail<CourseTeeRecord>(repoError)
    }
  }

  /**
   * Bulk upsert tees. Never throws per item.
   */
  async bulkUpsert(tees: readonly CourseTeeInput[]): Promise<BulkRepositoryResult<CourseTeeRecord>> {
    return this.runBulk(
      tees,
      (t) => `${t.courseId}:tee-${t.teeName}`,
      (t) => this.upsert(t),
    )
  }

  /**
   * Delete all tees for a course (used during course updates).
   */
  async deleteForCourse(courseId: string): Promise<number> {
    const result = await this.prisma.courseTee.deleteMany({
      where: { courseId },
    })
    return result.count
  }
}

/**
 * Shared default instance. Lazily constructed so importing this module never
 * forces a database connection.
 */
let _courseTeeRepository: CourseTeeRepository | undefined
export function getCourseTeeRepository(): CourseTeeRepository {
  return (_courseTeeRepository ??= new CourseTeeRepository())
}
