/**
 * PlayerRound repository.
 *
 * Persists PlayerRound records (player scores per round) created from
 * historical leaderboard imports. Reconciliation is keyed by (roundId, tournamentFieldId),
 * so re-importing is idempotent.
 */

import type { PlayerRound as PlayerRoundRecord, PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import type { PlayerRound } from "@/lib/domain/round/types"
import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

export interface ResolvedPlayerRound {
  roundId: string
  tournamentFieldId: string
  playerRound: PlayerRound
}

export class PlayerRoundRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "playerRound", sink)
  }

  /**
   * Upsert a single player round by (roundId, tournamentFieldId).
   */
  async upsert(input: ResolvedPlayerRound): Promise<RepositoryResult<PlayerRoundRecord>> {
    try {
      const record = await this.prisma.playerRound.upsert({
        where: { roundId_tournamentFieldId: { roundId: input.roundId, tournamentFieldId: input.tournamentFieldId } },
        update: {
          score: input.playerRound.score,
          toPar: input.playerRound.toPar,
          position: input.playerRound.position,
          madeCut: input.playerRound.madeCut,
          withdrawn: input.playerRound.withdrawn,
          disqualified: input.playerRound.disqualified,
          teeTime: input.playerRound.teeTime,
          startedAt: input.playerRound.startedAt,
          finishedAt: input.playerRound.finishedAt,
        },
        create: {
          roundId: input.roundId,
          tournamentFieldId: input.tournamentFieldId,
          score: input.playerRound.score,
          toPar: input.playerRound.toPar,
          position: input.playerRound.position,
          madeCut: input.playerRound.madeCut,
          withdrawn: input.playerRound.withdrawn,
          disqualified: input.playerRound.disqualified,
          teeTime: input.playerRound.teeTime,
          startedAt: input.playerRound.startedAt,
          finishedAt: input.playerRound.finishedAt,
        },
      })
      return ok(record)
    } catch (error) {
      this.log({
        level: "error",
        stage: "persist",
        message: `Failed to upsert player round for field ${input.tournamentFieldId}`,
        error: toRepositoryError(error),
      })
      return fail(toRepositoryError(error))
    }
  }

  /**
   * Bulk upsert player rounds by (roundId, tournamentFieldId).
   *
   * After each upsert, queries the database to verify the record persisted
   * and determine if it was created or updated. Counts are based on verified
   * database state, not intended writes.
   */
  async bulkUpsert(inputs: ResolvedPlayerRound[]): Promise<BulkRepositoryResult<PlayerRoundRecord>> {
    const result: BulkRepositoryResult<PlayerRoundRecord> = {
      created: 0,
      updated: 0,
      failed: 0,
      records: [],
      errors: [],
    }

    for (const input of inputs) {
      try {
        // Get the existing record BEFORE upsert to track created vs updated
        const beforeUpsert = await this.prisma.playerRound.findUnique({
          where: { roundId_tournamentFieldId: { roundId: input.roundId, tournamentFieldId: input.tournamentFieldId } },
        })

        // Perform the upsert
        const res = await this.upsert(input)
        if (!res.ok) {
          result.failed++
          result.errors.push(res.error)
          continue
        }

        // Verify the record persisted by querying it again
        const afterUpsert = await this.prisma.playerRound.findUnique({
          where: { roundId_tournamentFieldId: { roundId: input.roundId, tournamentFieldId: input.tournamentFieldId } },
        })

        if (!afterUpsert) {
          result.failed++
          result.errors.push("Record not found after upsert - persistence verification failed")
          continue
        }

        result.records.push(afterUpsert)

        // Determine if created or updated based on pre/post state
        if (beforeUpsert) {
          result.updated++
        } else {
          result.created++
        }
      } catch (error) {
        result.failed++
        result.errors.push(toRepositoryError(error))
      }
    }

    return result
  }

  /**
   * Get all player rounds for a specific round.
   */
  async getByRound(roundId: string): Promise<PlayerRoundRecord[]> {
    return this.prisma.playerRound.findMany({
      where: { roundId },
      include: { tournamentField: true },
    })
  }
}

export function getPlayerRoundRepository(
  prisma: PrismaClient = prismaClient,
  sink?: RepositoryLogSink,
): PlayerRoundRepository {
  return new PlayerRoundRepository(prisma, sink)
}
