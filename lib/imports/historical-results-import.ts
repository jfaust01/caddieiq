/**
 * Historical results import — Round + PlayerRound from leaderboards.
 *
 * Fetches leaderboard data for all completed tournaments and imports:
 *   - Round records (one aggregate round per tournament)
 *   - PlayerRound records (player scores and positions)
 *
 * Architecture:
 *   - Iterates completed tournaments
 *   - Fetches each tournament's leaderboard
 *   - Maps to Round + PlayerRound domain objects
 *   - Resolves field entries by (tournamentId, playerSlug)
 *   - Persists via batch upserts (idempotent)
 *   - Aggregates results for reporting
 */

import type { PrismaClient } from "@/lib/generated/prisma/client"
import prismaClient from "@/lib/prisma"
import { SportsDataProvider } from "@/lib/providers/sportsdataio/client"
import type { SdioLeaderboard } from "@/lib/providers/sportsdataio/types"
import { slugify } from "@/lib/domain/shared/utils"
import {
  mapSportsDataRound,
  mapSportsDataPlayerRound,
} from "@/lib/domain/round/mapper"
import { getRoundRepository, type RoundPersistInput } from "@/lib/repositories/round-repository"
import {
  getPlayerRoundRepository,
  type ResolvedPlayerRound,
} from "@/lib/repositories/player-round-repository"
import { createImportLogger } from "./import-logger"

/**
 * Summary of a historical results import run.
 */
export interface HistoricalResultsImportSummary {
  tournamentsConsidered: number
  tournamentsWithLeaderboard: number
  roundsCreated: number
  playerRoundsCreated: number
  playerRoundsUpdated: number
  playerRoundsFailed: number
  notes: string[]
}

/**
 * Execute a full historical results import.
 *
 * @param provider — SportsDataIO provider instance
 * @param prisma — Prisma client for queries
 * @returns Import summary with counts and notes
 */
export async function importHistoricalResults(
  provider?: SportsDataProvider,
  prisma: PrismaClient = prismaClient,
): Promise<HistoricalResultsImportSummary> {
  const prov = provider || SportsDataProvider.fromEnv()
  const logger = createImportLogger()
  const roundRepo = getRoundRepository(prisma, logger)
  const playerRoundRepo = getPlayerRoundRepository(prisma, logger)

  const summary: HistoricalResultsImportSummary = {
    tournamentsConsidered: 0,
    tournamentsWithLeaderboard: 0,
    roundsCreated: 0,
    playerRoundsCreated: 0,
    playerRoundsUpdated: 0,
    playerRoundsFailed: 0,
    notes: [],
  }

  // Fetch all completed tournaments from our DB
  const tournaments = await prisma.tournament.findMany({
    where: { status: "COMPLETED", deletedAt: null },
    include: { tournamentCourses: true },
    orderBy: { startDate: "desc" },
  })

  summary.tournamentsConsidered = tournaments.length

  for (const tournament of tournaments) {
    try {
      // Fetch the leaderboard from SportsDataIO using the provider's tournament ID
      const leaderboardResp = await prov.getLeaderboard(String(tournament.externalId))

      if (!leaderboardResp.data) {
        summary.notes.push(`No leaderboard found for ${tournament.name}`)
        continue
      }

      const leaderboard = leaderboardResp.data as SdioLeaderboard
      summary.tournamentsWithLeaderboard++

      // Create a Round for this tournament
      const round = mapSportsDataRound(tournament.id, leaderboard.Tournament)
      const roundRes = await roundRepo.upsert({
        tournamentId: tournament.id,
        roundNumber: 1,
        scheduledDate: round.scheduledDate,
      })

      if (!roundRes.ok) {
        summary.notes.push(`Failed to create round for ${tournament.name}: ${roundRes.error}`)
        continue
      }

      summary.roundsCreated++
      const roundId = roundRes.data.id

      // Map each player in the leaderboard to a PlayerRound
      const playerRoundInputs: ResolvedPlayerRound[] = []

      if (leaderboard.Players && Array.isArray(leaderboard.Players)) {
        for (const player of leaderboard.Players) {
          if (!player.Name) continue

          // Resolve the player to a tournament field entry by slug
          const playerSlug = slugify(player.Name)
          const fieldEntry = await prisma.tournamentField.findFirst({
            where: {
              tournamentId: tournament.id,
              player: { slug: playerSlug },
            },
          })

          if (!fieldEntry) {
            summary.notes.push(
              `Player ${player.Name} at ${tournament.name} not found in field`,
            )
            continue
          }

          // Map player to PlayerRound
          const playerRound = mapSportsDataPlayerRound(roundId, fieldEntry.id, player)
          playerRoundInputs.push({
            roundId,
            tournamentFieldId: fieldEntry.id,
            playerRound,
          })
        }
      }

      // Bulk upsert all player rounds for this tournament
      if (playerRoundInputs.length > 0) {
        const bulkRes = await playerRoundRepo.bulkUpsert(playerRoundInputs)
        summary.playerRoundsCreated += bulkRes.created
        summary.playerRoundsUpdated += bulkRes.updated
        summary.playerRoundsFailed += bulkRes.failed

        if (bulkRes.errors.length > 0) {
          summary.notes.push(
            `${bulkRes.errors.length} errors importing player rounds for ${tournament.name}`,
          )
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      summary.notes.push(`Exception importing ${tournament.name}: ${message}`)
    }
  }

  return summary
}
