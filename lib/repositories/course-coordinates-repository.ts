import type { CourseCoordinates as CourseCoordinatesRecord, PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type RepositoryResult } from "./repository-result"

export interface CourseCoordinatesInput {
  courseId: string
  latitude?: number | null
  longitude?: number | null
  elevation?: number | null
}

export class CourseCoordinatesRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "course-coordinates", sink)
  }

  async findByCourseId(courseId: string): Promise<CourseCoordinatesRecord | null> {
    return this.prisma.courseCoordinates.findUnique({ where: { courseId } })
  }

  async upsert(input: CourseCoordinatesInput): Promise<RepositoryResult<CourseCoordinatesRecord>> {
    try {
      const result = await this.prisma.courseCoordinates.upsert({
        where: { courseId: input.courseId },
        update: { latitude: input.latitude, longitude: input.longitude, elevation: input.elevation },
        create: { courseId: input.courseId, latitude: input.latitude, longitude: input.longitude, elevation: input.elevation },
      })
      const isInsert = new Date(result.updatedAt).getTime() - new Date(result.createdAt).getTime() < 100
      if (isInsert) this.logger.insert(input.courseId)
      else this.logger.update(input.courseId)
      return ok(result, isInsert ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, { entity: "course-coordinates", operation: "upsert", reference: input.courseId })
      return fail<CourseCoordinatesRecord>(repoError)
    }
  }
}

let _courseCoordinatesRepository: CourseCoordinatesRepository | undefined
export function getCourseCoordinatesRepository(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink): CourseCoordinatesRepository {
  return (_courseCoordinatesRepository ??= new CourseCoordinatesRepository(prisma, sink))
}
