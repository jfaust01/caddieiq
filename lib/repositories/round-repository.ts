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
import { accumulate, emptyBulkResult, fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

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
   * 
   * CRITICAL: Includes post-write verification to confirm the record actually
   * persisted in the database, not just returned from Prisma. If verification fails,
   * returns fail() instead of success, preventing silent persistence failures.
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

      // VERIFICATION: Query database immediately to confirm persistence
      const verified = await this.prisma.round.findUnique({
        where: { tournamentId_roundNumber: { tournamentId: input.tournamentId, roundNumber: input.roundNumber } },
      })

      if (!verified) {
        const err = toRepositoryError(`Persistence verification failed: record not found in database after upsert`)
        this.logger.failure(`tournament-${input.tournamentId}`, err.message, { code: err.code })
        return fail(err)
      }

      return ok(verified, "inserted")
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`tournament-${input.tournamentId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Bulk upsert rounds by (tournamentId, roundNumber).
   * 
   * After each upsert, queries the database to verify the record persisted
   * and determine if it was created or updated. Counts are based on verified
   * database state, not intended writes.
   */
  async bulkUpsert(inputs: RoundPersistInput[]): Promise<BulkRepositoryResult<RoundRecord>> {
    const result = emptyBulkResult<RoundRecord>()

    for (let index = 0; index < inputs.length; index++) {
      const input = inputs[index]
      try {
        // Get the existing record BEFORE upsert to track created vs updated
        const beforeUpsert = await this.prisma.round.findUnique({
          where: { tournamentId_roundNumber: { tournamentId: input.tournamentId, roundNumber: input.roundNumber } },
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
        const normalizedResult: RepositoryResult<RoundRecord> = {
          outcome,
          record: res.record,
          error: res.error,
        }
        accumulate(result, normalizedResult, index, input.tournamentId)
      } catch (error) {
        const normalizedResult: RepositoryResult<RoundRecord> = {
          outcome: "failed",
          error: toRepositoryError(error),
        }
        accumulate(result, normalizedResult, index, input.tournamentId)
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
