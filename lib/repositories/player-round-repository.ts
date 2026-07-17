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
import { accumulate, emptyBulkResult, fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

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
   * 
   * CRITICAL: Includes post-write verification to confirm the record actually
   * persisted in the database, not just returned from Prisma. If verification fails,
   * returns fail() instead of success, preventing silent persistence failures.
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

      // VERIFICATION: Query database immediately to confirm persistence
      const verified = await this.prisma.playerRound.findUnique({
        where: { roundId_tournamentFieldId: { roundId: input.roundId, tournamentFieldId: input.tournamentFieldId } },
      })

      if (!verified) {
        const err = toRepositoryError(`Persistence verification failed: record not found in database after upsert`)
        this.logger.failure(`field-${input.tournamentFieldId}`, err.message, { code: err.code })
        return fail(err)
      }

      return ok(verified, "inserted")
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`field-${input.tournamentFieldId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
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
    const result = emptyBulkResult<PlayerRoundRecord>()

    for (let index = 0; index < inputs.length; index++) {
      const input = inputs[index]
      try {
        // Get the existing record BEFORE upsert to track created vs updated
        const beforeUpsert = await this.prisma.playerRound.findUnique({
          where: { roundId_tournamentFieldId: { roundId: input.roundId, tournamentFieldId: input.tournamentFieldId } },
        })

        // Perform the upsert
        const res = await this.upsert(input)
        
        // Determine outcome based on pre/post state
        let outcome: "inserted" | "updated" | "failed"
        if (res.outcome === "failed") {
          outcome = "failed"
        } else if (beforeUpsert) {
          outcome = "updated"
        } else {
          outcome = "inserted"
        }

        // Create normalized result and accumulate
        const normalizedResult: RepositoryResult<PlayerRoundRecord> = {
          outcome,
          record: res.record,
          error: res.error,
        }
        accumulate(result, normalizedResult, index, input.tournamentFieldId)
      } catch (error) {
        const normalizedResult: RepositoryResult<PlayerRoundRecord> = {
          outcome: "failed",
          error: toRepositoryError(error),
        }
        accumulate(result, normalizedResult, index, input.tournamentFieldId)
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
