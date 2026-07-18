import type { TeeHoleYardage as TeeHoleYardageRecord, PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

export interface TeeHoleYardageInput {
  teeId: string
  holeId: string
  courseId: string
  yardage?: number | null
  handicap?: number | null
}

export class TeeHoleYardageRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "tee-hole-yardage", sink)
  }

  async findByTeeAndHole(teeId: string, holeId: string): Promise<TeeHoleYardageRecord | null> {
    return this.prisma.teeHoleYardage.findUnique({ where: { teeId_holeId: { teeId, holeId } } })
  }

  async findByTee(teeId: string): Promise<TeeHoleYardageRecord[]> {
    return this.prisma.teeHoleYardage.findMany({ where: { teeId }, orderBy: { holeId: "asc" } })
  }

  async upsert(input: TeeHoleYardageInput): Promise<RepositoryResult<TeeHoleYardageRecord>> {
    try {
      const result = await this.prisma.teeHoleYardage.upsert({
        where: { teeId_holeId: { teeId: input.teeId, holeId: input.holeId } },
        update: { yardage: input.yardage, handicap: input.handicap },
        create: { teeId: input.teeId, holeId: input.holeId, courseId: input.courseId, yardage: input.yardage, handicap: input.handicap },
      })
      const isInsert = new Date(result.updatedAt).getTime() - new Date(result.createdAt).getTime() < 100
      if (isInsert) this.logger.insert(`${input.teeId}:${input.holeId}`)
      else this.logger.update(`${input.teeId}:${input.holeId}`)
      return ok(result, isInsert ? "inserted" : "updated")
    } catch (error) {
      const repoError = toRepositoryError(error, { entity: "tee-hole-yardage", operation: "upsert", reference: `${input.teeId}:${input.holeId}` })
      return fail<TeeHoleYardageRecord>(repoError)
    }
  }

  async bulkUpsert(yardages: readonly TeeHoleYardageInput[]): Promise<BulkRepositoryResult<TeeHoleYardageRecord>> {
    return this.runBulk(yardages, (y) => `${y.teeId}:${y.holeId}`, (y) => this.upsert(y))
  }
}

let _teeHoleYardageRepository: TeeHoleYardageRepository | undefined
export function getTeeHoleYardageRepository(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink): TeeHoleYardageRepository {
  return (_teeHoleYardageRepository ??= new TeeHoleYardageRepository(prisma, sink))
}
