import type { PlayingConditions as PlayingConditionsRecord, PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type RepositoryResult } from "./repository-result"

export interface PlayingConditionsInput {
  courseId: string
  grassTypeFairway?: string | null
  grassTypeGreen?: string | null
  greenSize?: string | null
  greenSpeed?: string | null
}

export class PlayingConditionsRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "playing-conditions", sink)
  }

  async findByCourseId(courseId: string): Promise<PlayingConditionsRecord[]> {
    return this.prisma.playingConditions.findMany({ where: { courseId }, orderBy: { observedAt: "desc" } })
  }

  async create(input: PlayingConditionsInput): Promise<RepositoryResult<PlayingConditionsRecord>> {
    try {
      const result = await this.prisma.playingConditions.create({
        data: { courseId: input.courseId, grassTypeFairway: input.grassTypeFairway, grassTypeGreen: input.grassTypeGreen, greenSize: input.greenSize, greenSpeed: input.greenSpeed },
      })
      this.logger.insert(input.courseId)
      return ok(result, "inserted")
    } catch (error) {
      const repoError = toRepositoryError(error, { entity: "playing-conditions", operation: "create", reference: input.courseId })
      return fail<PlayingConditionsRecord>(repoError)
    }
  }
}

let _playingConditionsRepository: PlayingConditionsRepository | undefined
export function getPlayingConditionsRepository(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink): PlayingConditionsRepository {
  return (_playingConditionsRepository ??= new PlayingConditionsRepository(prisma, sink))
}
