/**
 * RoundStatistic repository.
 *
 * Persists RoundStatistic records (detailed round performance metrics) created from
 * historical leaderboard scorecard imports. Reconciliation is keyed by playerRoundId,
 * so re-importing is idempotent.
 */

import type { RoundStatistic as RoundStatisticRecord, PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import type { RoundStatistic } from "@/lib/domain/round-statistic/types"
import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { accumulate, emptyBulkResult, fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

export interface ResolvedRoundStatistic {
  playerRoundId: string
  roundStatistic: RoundStatistic
}

export class RoundStatisticRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "roundStatistic", sink)
  }

  /**
   * Upsert a single round statistic by playerRoundId (1:1 relationship).
   *
   * CRITICAL: Includes post-write verification to confirm the record actually
   * persisted in the database, not just returned from Prisma. If verification fails,
   * returns fail() instead of success, preventing silent persistence failures.
   */
  async upsert(input: ResolvedRoundStatistic): Promise<RepositoryResult<RoundStatisticRecord>> {
    try {
      const record = await this.prisma.roundStatistic.upsert({
        where: { playerRoundId: input.playerRoundId },
        update: {
          drivingDistance: input.roundStatistic.drivingDistance,
          drivingAccuracy: input.roundStatistic.drivingAccuracy,
          fairwaysHit: input.roundStatistic.fairwaysHit,
          fairwaysPossible: input.roundStatistic.fairwaysPossible,
          greensInRegulation: input.roundStatistic.greensInRegulation,
          greensPossible: input.roundStatistic.greensPossible,
          putts: input.roundStatistic.putts,
          birdies: input.roundStatistic.birdies,
          eagles: input.roundStatistic.eagles,
          pars: input.roundStatistic.pars,
          bogeys: input.roundStatistic.bogeys,
          doubleBogeys: input.roundStatistic.doubleBogeys,
          scramblingPercentage: input.roundStatistic.scramblingPercentage,
          sandSavePercentage: input.roundStatistic.sandSavePercentage,
          proximityToHole: input.roundStatistic.proximityToHole,
          sgOffTheTee: input.roundStatistic.sgOffTheTee,
          sgApproach: input.roundStatistic.sgApproach,
          sgAroundGreen: input.roundStatistic.sgAroundGreen,
          sgPutting: input.roundStatistic.sgPutting,
          sgTotal: input.roundStatistic.sgTotal,
        },
        create: {
          playerRoundId: input.playerRoundId,
          drivingDistance: input.roundStatistic.drivingDistance,
          drivingAccuracy: input.roundStatistic.drivingAccuracy,
          fairwaysHit: input.roundStatistic.fairwaysHit,
          fairwaysPossible: input.roundStatistic.fairwaysPossible,
          greensInRegulation: input.roundStatistic.greensInRegulation,
          greensPossible: input.roundStatistic.greensPossible,
          putts: input.roundStatistic.putts,
          birdies: input.roundStatistic.birdies,
          eagles: input.roundStatistic.eagles,
          pars: input.roundStatistic.pars,
          bogeys: input.roundStatistic.bogeys,
          doubleBogeys: input.roundStatistic.doubleBogeys,
          scramblingPercentage: input.roundStatistic.scramblingPercentage,
          sandSavePercentage: input.roundStatistic.sandSavePercentage,
          proximityToHole: input.roundStatistic.proximityToHole,
          sgOffTheTee: input.roundStatistic.sgOffTheTee,
          sgApproach: input.roundStatistic.sgApproach,
          sgAroundGreen: input.roundStatistic.sgAroundGreen,
          sgPutting: input.roundStatistic.sgPutting,
          sgTotal: input.roundStatistic.sgTotal,
        },
      })

      // VERIFICATION: Query database immediately to confirm persistence
      const verified = await this.prisma.roundStatistic.findUnique({
        where: { playerRoundId: input.playerRoundId },
      })

      if (!verified) {
        const err = toRepositoryError(`Persistence verification failed: record not found in database after upsert`)
        this.logger.failure(`playerRound-${input.playerRoundId}`, err.message, { code: err.code })
        return fail(err)
      }

      return ok(verified, "inserted")
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`playerRound-${input.playerRoundId}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Bulk upsert round statistics by playerRoundId.
   *
   * After each upsert, queries the database to verify the record persisted
   * and determine if it was created or updated. Counts are based on verified
   * database state, not intended writes.
   */
  async bulkUpsert(inputs: ResolvedRoundStatistic[]): Promise<BulkRepositoryResult<RoundStatisticRecord>> {
    const result = emptyBulkResult<RoundStatisticRecord>()

    for (let index = 0; index < inputs.length; index++) {
      const input = inputs[index]
      try {
        // Get the existing record BEFORE upsert to track created vs updated
        const beforeUpsert = await this.prisma.roundStatistic.findUnique({
          where: { playerRoundId: input.playerRoundId },
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
        const normalizedResult: RepositoryResult<RoundStatisticRecord> = {
          outcome,
          record: res.record,
          error: res.error,
        }
        accumulate(result, normalizedResult, index, input.playerRoundId)
      } catch (error) {
        const normalizedResult: RepositoryResult<RoundStatisticRecord> = {
          outcome: "failed",
          error: toRepositoryError(error),
        }
        accumulate(result, normalizedResult, index, input.playerRoundId)
      }
    }

    return result
  }

  /**
   * Get round statistics for a specific player round.
   */
  async getByPlayerRound(playerRoundId: string): Promise<RoundStatisticRecord | null> {
    return this.prisma.roundStatistic.findUnique({
      where: { playerRoundId },
    })
  }
}

export function getRoundStatisticRepository(
  prisma: PrismaClient = prismaClient,
  sink?: RepositoryLogSink,
): RoundStatisticRepository {
  return new RoundStatisticRepository(prisma, sink)
}
