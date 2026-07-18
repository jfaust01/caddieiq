import type { CourseSpecifications as CourseSpecificationsRecord, PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type RepositoryResult } from "./repository-result"

export interface CourseSpecificationsInput {
  courseId: string
  par?: number | null
  totalYardage?: number | null
  courseRating?: number | null
  slopeRating?: number | null
}

export class CourseSpecificationsRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "course-specifications", sink)
  }

  async findByCourseId(courseId: string): Promise<CourseSpecificationsRecord | null> {
    return this.prisma.courseSpecifications.findUnique({ where: { courseId } })
  }

  async upsert(input: CourseSpecificationsInput): Promise<RepositoryResult<CourseSpecificationsRecord>> {
    try {
      const result = await this.prisma.courseSpecifications.upsert({
        where: { courseId: input.courseId },
        update: { par: input.par, totalYardage: input.totalYardage, courseRating: input.courseRating, slopeRating: input.slopeRating },
        create: { courseId: input.courseId, par: input.par, totalYardage: input.totalYardage, courseRating: input.courseRating, slopeRating: input.slopeRating },
      })
      const isInsert = new Date(result.updatedAt).getTime() - new Date(result.createdAt).getTime() < 100
      if (isInsert) this.logger.insert(input.courseId)
      else this.logger.update(input.courseId)
      return ok(result, isInsert ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, { entity: "course-specifications", operation: "upsert", reference: input.courseId })
      return fail<CourseSpecificationsRecord>(repoError)
    }
  }
}

let _courseSpecificationsRepository: CourseSpecificationsRepository | undefined
export function getCourseSpecificationsRepository(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink): CourseSpecificationsRepository {
  return (_courseSpecificationsRepository ??= new CourseSpecificationsRepository(prisma, sink))
}
