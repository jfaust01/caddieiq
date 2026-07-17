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
        const err = `Persistence verification failed: record not found in database after upsert`
        this.log({
          level: "error",
          stage: "persist",
          message: err,
          error: toRepositoryError(err),
        })
        return {
          ok: false,
          error: toRepositoryError(err),
          outcome: "failed",
        } as any
      }

      // Return with both old ('ok', 'data') and new ('outcome', 'record') properties for compatibility
      return {
        ok: true,
        data: verified,
        outcome: "inserted",
        record: verified,
      } as any
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.log({
        level: "error",
        stage: "persist",
        message: `Failed to upsert round for tournament ${input.tournamentId}`,
        error: repoError,
      })
      return {
        ok: false,
        error: repoError,
        outcome: "failed",
      } as any
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
    const result: BulkRepositoryResult<RoundRecord> = {
      created: 0,
      updated: 0,
      failed: 0,
      records: [],
      errors: [],
    }

    for (const input of inputs) {
      try {
        // Get the existing record BEFORE upsert to track created vs updated
        const beforeUpsert = await this.prisma.round.findUnique({
          where: { tournamentId_roundNumber: { tournamentId: input.tournamentId, roundNumber: input.roundNumber } },
        })

        // Perform the upsert
        const res = await this.upsert(input)
        if (!res.ok) {
          result.failed++
          result.errors.push(res.error)
          continue
        }

        // Verify the record persisted by querying it again
        const afterUpsert = await this.prisma.round.findUnique({
          where: { tournamentId_roundNumber: { tournamentId: input.tournamentId, roundNumber: input.roundNumber } },
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
