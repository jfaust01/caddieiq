/**
 * Round repository.
 *
 * Persists Round records created from historical leaderboard imports. Each
 * tournament gets one Round record representing the complete event (since
 * SportsDataIO's golf tier provides no round-by-round breakdown).
 */

import type { Round as RoundRecord, PrismaClient } from "@/lib/generated/prisma/client"
import { Prisma } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import type { Round } from "@/lib/domain/round/types"
import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

export interface RoundPersistInput {
  tournamentId: string
  roundNumber: number
  scheduledDate: Date | null
}

export class RoundRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "round", sink)
  }

  /**
   * Upsert a single round by (tournamentId, roundNumber).
   */
  async upsert(input: RoundPersistInput): Promise<RepositoryResult<RoundRecord>> {
    try {
      const record = await this.prisma.round.upsert({
        where: { tournamentId_roundNumber: { tournamentId: input.tournamentId, roundNumber: input.roundNumber } },
        update: { scheduledDate: input.scheduledDate },
        create: {
          tournamentId: input.tournamentId,
          roundNumber: input.roundNumber,
          scheduledDate: input.scheduledDate,
          status: "COMPLETED",
          completed: true,
        },
      })
      return ok(record)
    } catch (error) {
      this.log({
        level: "error",
        stage: "persist",
        message: `Failed to upsert round for tournament ${input.tournamentId}`,
        error: toRepositoryError(error),
      })
      return fail(toRepositoryError(error))
    }
  }

  /**
   * Bulk upsert rounds by (tournamentId, roundNumber).
   */
  async bulkUpsert(inputs: RoundPersistInput[]): Promise<BulkRepositoryResult<RoundRecord>> {
    const result: BulkRepositoryResult<RoundRecord> = {
      created: 0,
      updated: 0,
      failed: 0,
      records: [],
      errors: [],
    }

    for (const input of inputs) {
      const res = await this.upsert(input)
      if (res.ok) {
        // Check if it was created or updated by a second query
        const existing = await this.prisma.round.findUnique({
          where: { tournamentId_roundNumber: { tournamentId: input.tournamentId, roundNumber: input.roundNumber } },
        })
        result.records.push(existing!)
        result.updated++
      } else {
        result.failed++
        result.errors.push(res.error)
      }
    }

    return result
  }

  /**
   * Get all rounds for a tournament.
   */
  async getByTournament(tournamentId: string): Promise<RoundRecord[]> {
    return this.prisma.round.findMany({
      where: { tournamentId },
      orderBy: { roundNumber: "asc" },
    })
  }
}

export function getRoundRepository(
  prisma: PrismaClient = prismaClient,
  sink?: RepositoryLogSink,
): RoundRepository {
  return new RoundRepository(prisma, sink)
}
