import type { CourseAddress as CourseAddressRecord, PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type RepositoryResult } from "./repository-result"

export interface CourseAddressInput {
  courseId: string
  city?: string | null
  state?: string | null
  country?: string | null
  postalCode?: string | null
  website?: string | null
  phone?: string | null
}

export class CourseAddressRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "course-address", sink)
  }

  async findByCourseId(courseId: string): Promise<CourseAddressRecord | null> {
    return this.prisma.courseAddress.findUnique({
      where: { courseId },
    })
  }

  async upsert(input: CourseAddressInput): Promise<RepositoryResult<CourseAddressRecord>> {
    try {
      const result = await this.prisma.courseAddress.upsert({
        where: { courseId: input.courseId },
        update: {
          city: input.city,
          state: input.state,
          country: input.country,
          postalCode: input.postalCode,
          website: input.website,
          phone: input.phone,
        },
        create: {
          courseId: input.courseId,
          city: input.city,
          state: input.state,
          country: input.country,
          postalCode: input.postalCode,
          website: input.website,
          phone: input.phone,
        },
      })

      const isInsert = new Date(result.updatedAt).getTime() - new Date(result.createdAt).getTime() < 100
      if (isInsert) {
        this.logger.insert(input.courseId)
        return ok(result, "inserted")
      }

      this.logger.update(input.courseId)
      return ok(result, "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, {
        entity: "course-address",
        operation: "upsert",
        reference: input.courseId,
      })
      return fail<CourseAddressRecord>(repoError)
    }
  }
}

let _courseAddressRepository: CourseAddressRepository | undefined
export function getCourseAddressRepository(
  prisma: PrismaClient = prismaClient,
  sink?: RepositoryLogSink,
): CourseAddressRepository {
  return (_courseAddressRepository ??= new CourseAddressRepository(prisma, sink))
}
