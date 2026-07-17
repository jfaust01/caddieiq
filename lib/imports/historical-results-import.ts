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

  console.log("[v0] Starting Historical Results Import")

  // Fetch all completed tournaments from our DB
  const tournaments = await prisma.tournament.findMany({
    where: { status: "COMPLETED", deletedAt: null },
    include: { tournamentCourses: true },
    orderBy: { startDate: "desc" },
  })

  summary.tournamentsConsidered = tournaments.length
  console.log(
    `[v0] Found ${tournaments.length} completed tournaments to process`,
  )
  if (tournaments.length === 0) {
    console.log("[v0] No completed tournaments found, exiting")
    return summary
  }

  for (const tournament of tournaments) {
    try {
      console.log(
        `[v0] Processing tournament: ${tournament.name} (id: ${tournament.id}, externalId: ${tournament.externalId})`,
      )

      // Fetch the leaderboard from SportsDataIO using the provider's tournament ID
      console.log(
        `[v0] Fetching leaderboard from SportsDataIO for externalId: ${tournament.externalId}`,
      )
      const leaderboardResp = await prov.getLeaderboard(String(tournament.externalId))

      console.log(
        `[v0] SportsDataIO response received: meta.provider=${leaderboardResp.meta?.provider}, has data: ${!!leaderboardResp.data}`,
      )

      if (!leaderboardResp.data) {
        const logMsg = `No leaderboard found for ${tournament.name} - API returned null/undefined`
        summary.notes.push(logMsg)
        console.log(`[v0] ${logMsg}`)
        continue
      }

      const leaderboard = leaderboardResp.data as SdioLeaderboard
      console.log(
        `[v0] Leaderboard retrieved: Tournament=${leaderboard.Tournament?.Name}, Players=${Array.isArray(leaderboard.Players) ? leaderboard.Players.length : 0}`,
      )
      summary.tournamentsWithLeaderboard++

      // Create a Round for this tournament
      console.log(`[v0] Creating Round for tournament: ${tournament.name}`)
      const round = mapSportsDataRound(tournament.id, leaderboard.Tournament)
      const roundRes = await roundRepo.upsert({
        tournamentId: tournament.id,
        roundNumber: 1,
        scheduledDate: round.scheduledDate,
      })

      if (!roundRes.ok) {
        const errMsg = `Failed to create round for ${tournament.name}: ${roundRes.error}`
        summary.notes.push(errMsg)
        console.log(`[v0] ERROR: ${errMsg}`)
        continue
      }

      summary.roundsCreated++
      const roundId = roundRes.data.id
      console.log(
        `[v0] Round created successfully: roundId=${roundId}, status=${roundRes.data.status}`,
      )

      // Map each player in the leaderboard to a PlayerRound
      const playerRoundInputs: ResolvedPlayerRound[] = []

      if (leaderboard.Players && Array.isArray(leaderboard.Players)) {
        console.log(`[v0] Processing ${leaderboard.Players.length} players from leaderboard`)
        let playersMatched = 0
        let playersMissed = 0

        for (const player of leaderboard.Players) {
          if (!player.Name) {
            console.log(`[v0] Skipping player with no name`)
            playersMissed++
            continue
          }

          // Resolve the player to a tournament field entry by slug
          const playerSlug = slugify(player.Name)
          console.log(
            `[v0] Matching player: ${player.Name} (slug: ${playerSlug}, rank: ${player.Rank})`,
          )

          const fieldEntry = await prisma.tournamentField.findFirst({
            where: {
              tournamentId: tournament.id,
              player: { slug: playerSlug },
            },
          })

          if (!fieldEntry) {
            console.log(
              `[v0] PLAYER MATCH FAILED: ${player.Name} (${playerSlug}) not found in tournament field`,
            )
            summary.notes.push(
              `Player ${player.Name} at ${tournament.name} not found in field`,
            )
            playersMissed++
            continue
          }

          console.log(
            `[v0] Player matched: ${player.Name} → fieldEntryId=${fieldEntry.id}`,
          )

          // Map player to PlayerRound
          const playerRound = mapSportsDataPlayerRound(roundId, fieldEntry.id, player)
          playerRoundInputs.push({
            roundId,
            tournamentFieldId: fieldEntry.id,
            playerRound,
          })
          playersMatched++
        }

        console.log(
          `[v0] Player matching complete: matched=${playersMatched}, missed=${playersMissed}, total=${leaderboard.Players.length}`,
        )
      } else {
        console.log(`[v0] No players in leaderboard (leaderboard.Players is ${leaderboard.Players ? "empty array" : "null/undefined"})`)
      }

      // Bulk upsert all player rounds for this tournament
      console.log(
        `[v0] Preparing bulk upsert of ${playerRoundInputs.length} player rounds`,
      )
      if (playerRoundInputs.length > 0) {
        const bulkRes = await playerRoundRepo.bulkUpsert(playerRoundInputs)
        
        // All counts are based on verified database persistence, not intended writes
        summary.playerRoundsCreated += bulkRes.created
        summary.playerRoundsUpdated += bulkRes.updated
        summary.playerRoundsFailed += bulkRes.failed

        console.log(
          `[v0] Bulk upsert complete: created=${bulkRes.created}, updated=${bulkRes.updated}, failed=${bulkRes.failed}`,
        )

        if (bulkRes.errors.length > 0) {
          const errMsg = `${bulkRes.errors.length} errors importing player rounds for ${tournament.name}`
          summary.notes.push(errMsg)
          console.log(`[v0] Errors: ${errMsg}`)
          bulkRes.errors.forEach((err, i) => {
            console.log(`[v0]   Error ${i + 1}: ${err}`)
          })
        }
      } else {
        console.log(`[v0] No player rounds to upsert (all players failed to match)`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : ""
      const logMsg = `Exception importing ${tournament.name}: ${message}`
      summary.notes.push(logMsg)
      console.error(`[v0] ${logMsg}`)
      if (stack) {
        console.error(`[v0] Stack trace: ${stack}`)
      }
    }
  }

  // PHASE 6: Final verification - Query database to confirm actual persistence
  console.log(`[v0] PHASE 6: Final Persistence Verification`)
  console.log(`[v0] Querying actual database state...`)
  
  const actualRoundCount = await prisma.round.count()
  const actualPlayerRoundCount = await prisma.playerRound.count()
  
  console.log(`[v0] ACTUAL DATABASE STATE:`)
  console.log(`[v0]   Rounds in database: ${actualRoundCount}`)
  console.log(`[v0]   PlayerRounds in database: ${actualPlayerRoundCount}`)
  console.log(`[v0] REPORTED COUNTS (from repositories):`)
  console.log(`[v0]   Rounds created (reported): ${summary.roundsCreated}`)
  console.log(`[v0]   PlayerRounds created (reported): ${summary.playerRoundsCreated}`)
  console.log(`[v0]   PlayerRounds updated (reported): ${summary.playerRoundsUpdated}`)
  
  // Check for mismatch
  if (actualRoundCount === 0 && summary.roundsCreated > 0) {
    console.error(`[v0] ⚠️  CRITICAL: Rounds reported as created (${summary.roundsCreated}) but database contains 0!`)
  }
  if (actualPlayerRoundCount === 0 && (summary.playerRoundsCreated + summary.playerRoundsUpdated) > 0) {
    console.error(`[v0] ⚠️  CRITICAL: PlayerRounds reported as created/updated (${summary.playerRoundsCreated + summary.playerRoundsUpdated}) but database contains 0!`)
  }

  console.log(`[v0] Historical Results Import Summary:`)
  console.log(
    `[v0]   Tournaments considered: ${summary.tournamentsConsidered}`,
  )
  console.log(
    `[v0]   Tournaments with leaderboard: ${summary.tournamentsWithLeaderboard}`,
  )
  console.log(`[v0]   Rounds created: ${summary.roundsCreated}`)
  console.log(`[v0]   Player rounds created: ${summary.playerRoundsCreated}`)
  console.log(`[v0]   Player rounds updated: ${summary.playerRoundsUpdated}`)
  console.log(`[v0]   Player rounds failed: ${summary.playerRoundsFailed}`)
  if (summary.notes.length > 0) {
    console.log(`[v0]   Notes (${summary.notes.length}):`)
    summary.notes.forEach((note, i) => {
      console.log(`[v0]     ${i + 1}. ${note}`)
    })
  }

  return summary
}
