import type { CourseMetadata as CourseMetadataRecord, PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type RepositoryResult } from "./repository-result"

export interface CourseMetadataInput {
  courseId: string
  architect?: string | null
  yearBuilt?: number | null
  courseStyle?: string | null
  drivingRange?: boolean | null
  puttingGreen?: boolean | null
  shortGameArea?: boolean | null
}

export class CourseMetadataRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "course-metadata", sink)
  }

  async findByCourseId(courseId: string): Promise<CourseMetadataRecord | null> {
    return this.prisma.courseMetadata.findUnique({ where: { courseId } })
  }

  async upsert(input: CourseMetadataInput): Promise<RepositoryResult<CourseMetadataRecord>> {
    try {
      const result = await this.prisma.courseMetadata.upsert({
        where: { courseId: input.courseId },
        update: { architect: input.architect, yearBuilt: input.yearBuilt, courseStyle: input.courseStyle, drivingRange: input.drivingRange, puttingGreen: input.puttingGreen, shortGameArea: input.shortGameArea },
        create: { courseId: input.courseId, architect: input.architect, yearBuilt: input.yearBuilt, courseStyle: input.courseStyle, drivingRange: input.drivingRange, puttingGreen: input.puttingGreen, shortGameArea: input.shortGameArea },
      })
      const isInsert = new Date(result.updatedAt).getTime() - new Date(result.createdAt).getTime() < 100
      if (isInsert) this.logger.insert(input.courseId)
      else this.logger.update(input.courseId)
      return ok(result, isInsert ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, { entity: "course-metadata", operation: "upsert", reference: input.courseId })
      return fail<CourseMetadataRecord>(repoError)
    }
  }
}

let _courseMetadataRepository: CourseMetadataRepository | undefined
export function getCourseMetadataRepository(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink): CourseMetadataRepository {
  return (_courseMetadataRepository ??= new CourseMetadataRepository(prisma, sink))
}
