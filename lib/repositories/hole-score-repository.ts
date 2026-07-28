/**
 * HoleScore repository.
 *
 * Persists hole-by-hole scoring for player rounds from provider data.
 * Uses upsert with composite unique constraint (playerRoundId, holeNumber)
 * to ensure idempotent imports and prevent duplicate holes.
 *
 * All holes are sourced from providers; never generated or estimated.
 */

import type { HoleScore as HoleSc ore Record, PrismaClient } from "@/lib/generated/prisma/client"
import { Prisma } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { BaseRepository } from "./base-repository"
import { toRepositoryError } from "./errors"
import type { RepositoryLogSink } from "./logger"
import { accumulate, emptyBulkResult, fail, ok, type BulkRepositoryResult, type RepositoryResult } from "./repository-result"

export interface HoleScorePersistInput {
  playerRoundId: string
  holeNumber: number
  par: number
  score: number | null
  toPar: number | null
  dkPoints: number | null
  source: string
  externalId: string | null
  importedAt: Date
}

export class HoleScoreRepository extends BaseRepository {
  constructor(prisma: PrismaClient = prismaClient, sink?: RepositoryLogSink) {
    super(prisma, "hole_score", sink)
  }

  /**
   * Upsert a single hole score by (playerRoundId, holeNumber).
   * Uses the composite unique constraint to prevent duplicates.
   */
  async upsert(input: HoleScorePersistInput): Promise<RepositoryResult<HoleScoreRecord>> {
    try {
      const record = await this.prisma.holeScore.upsert({
        where: {
          playerRoundId_holeNumber: {
            playerRoundId: input.playerRoundId,
            holeNumber: input.holeNumber,
          },
        },
        update: {
          score: input.score,
          toPar: input.toPar,
          dkPoints: input.dkPoints,
          source: input.source,
          externalId: input.externalId,
          importedAt: input.importedAt,
        },
        create: {
          playerRoundId: input.playerRoundId,
          holeNumber: input.holeNumber,
          par: input.par,
          score: input.score,
          toPar: input.toPar,
          dkPoints: input.dkPoints,
          source: input.source,
          externalId: input.externalId,
          importedAt: input.importedAt,
        },
      })

      // VERIFICATION: Query database immediately to confirm persistence
      const verified = await this.prisma.holeScore.findUnique({
        where: {
          playerRoundId_holeNumber: {
            playerRoundId: input.playerRoundId,
            holeNumber: input.holeNumber,
          },
        },
      })

      if (!verified) {
        const err = toRepositoryError(`Persistence verification failed: hole score not found in database after upsert`)
        this.logger.failure(`${input.playerRoundId}-h${input.holeNumber}`, err.message, { code: err.code })
        return fail(err)
      }

      return ok(verified, "inserted")
    } catch (error) {
      const repoError = toRepositoryError(error)
      this.logger.failure(`${input.playerRoundId}-h${input.holeNumber}`, repoError.message, { code: repoError.code })
      return fail(repoError)
    }
  }

  /**
   * Bulk upsert hole scores.
   * After each upsert, queries the database to verify persistence.
   * Validates hole number (1-18) and required fields before persisting.
   */
  async bulkUpsert(inputs: HoleScorePersistInput[]): Promise<BulkRepositoryResult<HoleScoreRecord>> {
    const result = emptyBulkResult<HoleScoreRecord>()

    for (let index = 0; index < inputs.length; index++) {
      const input = inputs[index]

      // Pre-persist validation
      if (input.holeNumber < 1 || input.holeNumber > 18) {
        const err = toRepositoryError(
          `Invalid hole number: ${input.holeNumber} (must be 1-18)`,
        )
        this.logger.failure(`${input.playerRoundId}-h${input.holeNumber}`, err.message, {
          code: err.code,
        })
        result.errors.push(err)
        result.failed += 1
        continue
      }

      if (!input.par || input.par < 3 || input.par > 5) {
        const err = toRepositoryError(
          `Invalid par: ${input.par} (must be 3-5)`,
        )
        this.logger.failure(`${input.playerRoundId}-h${input.holeNumber}`, err.message, {
          code: err.code,
        })
        result.errors.push(err)
        result.failed += 1
        continue
      }

      if (!input.source) {
        const err = toRepositoryError(`Missing source (provider tag)`)
        this.logger.failure(`${input.playerRoundId}-h${input.holeNumber}`, err.message, {
          code: err.code,
        })
        result.errors.push(err)
        result.failed += 1
        continue
      }

      try {
        // Get the existing record BEFORE upsert to track created vs updated
        const beforeUpsert = await this.prisma.holeScore.findUnique({
          where: {
            playerRoundId_holeNumber: {
              playerRoundId: input.playerRoundId,
              holeNumber: input.holeNumber,
            },
          },
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

        // Accumulate result
        result.processed += 1
        if (res.outcome === "ok") {
          result.data.push(res.data)
          if (outcome === "inserted") {
            result.inserted += 1
          } else if (outcome === "updated") {
            result.updated += 1
          }
        } else {
          result.failed += 1
          result.errors.push(res.error)
        }
      } catch (error) {
        const repoError = toRepositoryError(error)
        this.logger.failure(`${input.playerRoundId}-h${input.holeNumber}`, repoError.message, {
          code: repoError.code,
        })
        result.processed += 1
        result.failed += 1
        result.errors.push(repoError)
      }
    }

    return result
  }
}
