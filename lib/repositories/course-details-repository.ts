/**
 * CourseDetailsRepository.
 *
 * Persistence layer for GolfCourse API course details. Handles create, update,
 * upsert, and retrieval operations following the repository pattern.
 */

import type {
  CourseDetails as CourseDetailsRecord,
  PrismaClient,
} from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"

import { BaseRepository, type UpsertPlan } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

export interface CourseDetailsInput {
  externalCourseId: string
  courseName: string
  clubName?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  website?: string | null
  phone?: string | null
  par?: number | null
  totalYardage?: number | null
  courseRating?: number | null
  slopeRating?: number | null
}

export class CourseDetailsRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "course-details", sink)
  }

  /**
   * Find a course by external GolfCourse API ID.
   */
  async findByExternalId(externalCourseId: string): Promise<CourseDetailsRecord | null> {
    return this.prisma.courseDetails.findUnique({
      where: { externalCourseId },
    })
  }

  /**
   * Find a course by internal ID.
   */
  async findById(id: string): Promise<CourseDetailsRecord | null> {
    return this.prisma.courseDetails.findUnique({
      where: { id },
    })
  }

  /**
   * List all courses with pagination and optional search.
   */
  async list(options: {
    search?: string
    skip?: number
    take?: number
  } = {}): Promise<{ courses: CourseDetailsRecord[]; total: number }> {
    const { search, skip = 0, take = 25 } = options

    const whereClause: Record<string, any> = {}

    if (search && search.trim()) {
      whereClause.OR = [
        { courseName: { contains: search, mode: "insensitive" } },
        { clubName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
      ]
    }

    const [courses, total] = await Promise.all([
      this.prisma.courseDetails.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { courseName: "asc" },
      }),
      this.prisma.courseDetails.count({ where: whereClause }),
    ])

    return { courses, total }
  }

  /**
   * Upsert a single course by external ID (create if missing, update if exists).
   */
  async upsert(input: CourseDetailsInput): Promise<RepositoryResult<CourseDetailsRecord>> {
    try {
      const existing = await this.findByExternalId(input.externalCourseId)

      if (existing) {
        const updated = await this.prisma.courseDetails.update({
          where: { id: existing.id },
          data: {
            courseName: input.courseName,
            clubName: input.clubName,
            city: input.city,
            state: input.state,
            country: input.country,
            latitude: input.latitude,
            longitude: input.longitude,
            website: input.website,
            phone: input.phone,
            par: input.par,
            totalYardage: input.totalYardage,
            courseRating: input.courseRating,
            slopeRating: input.slopeRating,
          },
        })
        this.logger.update(input.externalCourseId)
        return ok(updated, "updated")
      }

      const created = await this.prisma.courseDetails.create({
        data: {
          externalCourseId: input.externalCourseId,
          courseName: input.courseName,
          clubName: input.clubName,
          city: input.city,
          state: input.state,
          country: input.country,
          latitude: input.latitude,
          longitude: input.longitude,
          website: input.website,
          phone: input.phone,
          par: input.par,
          totalYardage: input.totalYardage,
          courseRating: input.courseRating,
          slopeRating: input.slopeRating,
        },
      })
      this.logger.insert(input.externalCourseId)
      return ok(created, "inserted")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "course-details",
        operation: "upsert",
        reference: input.externalCourseId,
      })
      this.logger.failure(input.externalCourseId, repoError.message, { code: repoError.code })
      return fail<CourseDetailsRecord>(repoError)
    }
  }

  /**
   * Bulk upsert courses. Never throws per item.
   */
  async bulkUpsert(courses: readonly CourseDetailsInput[]): Promise<BulkRepositoryResult<CourseDetailsRecord>> {
    return this.runBulk(
      courses,
      (c) => c.externalCourseId,
      (c) => this.upsert(c),
    )
  }
}

/**
 * Shared default instance. Lazily constructed so importing this module never
 * forces a database connection.
 */
let _courseDetailsRepository: CourseDetailsRepository | undefined
export function getCourseDetailsRepository(): CourseDetailsRepository {
  return (_courseDetailsRepository ??= new CourseDetailsRepository())
}
