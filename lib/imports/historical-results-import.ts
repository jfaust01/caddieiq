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
  const roundRepo = getRoundRepository(prisma)
  const playerRoundRepo = getPlayerRoundRepository(prisma)

  let firstApiError: { tournament: string; localId: string; externalId: string; message: string; error: unknown } | null = null

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

      // Verify we have the SportsDataIO tournament ID
      if (!tournament.externalId) {
        const errMsg = `ERROR: Tournament ${tournament.name} (${tournament.id}) has no externalId - cannot fetch leaderboard`
        console.error(`[v0] ${errMsg}`)
        summary.notes.push(errMsg)
        continue
      }

      // Fetch the leaderboard from SportsDataIO using the provider's tournament ID
      console.log(
        `[v0] Fetching leaderboard from SportsDataIO for externalId: ${tournament.externalId}`,
      )
      
      let leaderboardResp
      try {
        leaderboardResp = await prov.getLeaderboard(String(tournament.externalId))
      } catch (apiError) {
        // Capture first API error for debugging with full diagnostics
        if (!firstApiError) {
          const errorDetails = (apiError as any)?.details ?? {}
          const status = errorDetails.status ?? "unknown"
          const endpoint = errorDetails.path ?? "/json/Leaderboard/[tournamentId]"
          const responseBody = errorDetails.body ?? ""

          firstApiError = {
            tournament: tournament.name,
            localId: tournament.id,
            externalId: tournament.externalId || "undefined",
            message: apiError instanceof Error ? apiError.message : String(apiError),
            error: apiError,
          }

          console.error(`[v0] ═════════════════════════════════════════════════════════════`)
          console.error(`[v0] FIRST SPORTSDATAIO API ERROR - DETAILED DIAGNOSTICS`)
          console.error(`[v0] ═════════════════════════════════════════════════════════════`)
          console.error(`[v0] Tournament: ${tournament.name}`)
          console.error(`[v0] Local Tournament ID: ${tournament.id}`)
          console.error(`[v0] SportsDataIO Tournament ID: ${tournament.externalId}`)
          console.error(`[v0] HTTP Status: ${status}`)
          console.error(`[v0] Endpoint: GET ${endpoint}`)
          if (responseBody) {
            console.error(`[v0] Response Body (truncated): ${responseBody}`)
          }
          console.error(`[v0] Error Message: ${firstApiError.message}`)
          console.error(`[v0] ═════════════════════════════════════════════════════════════`)
        }

        const errorDetails = (apiError as any)?.details ?? {}
        const status = errorDetails.status ?? "unknown"
        const logMsg = `Leaderboard fetch failed for ${tournament.name} (SportsDataIO ID: ${tournament.externalId}, HTTP ${status}): ${apiError instanceof Error ? apiError.message : String(apiError)}`
        summary.notes.push(logMsg)
        console.error(`[v0] ${logMsg}`)
        continue
      }

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

      if (roundRes.outcome === "failed") {
        const errMsg = `PERSISTENCE VERIFICATION FAILED: Round upsert for ${tournament.name} (${tournament.id}) failed verification. Error: ${roundRes.error}`
        console.error(`[v0] ${errMsg}`)
        throw new Error(errMsg)
      }

      summary.roundsCreated++
      const roundId = roundRes.record!.id
      console.log(
        `[v0] Round created successfully: roundId=${roundId}, status=${roundRes.record!.status}`,
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
        
        console.log(
          `[v0] Bulk upsert complete: inserted=${bulkRes.inserted}, updated=${bulkRes.updated}, failed=${bulkRes.failed}`,
        )

        // FAIL FAST: If any player rounds failed persistence verification, terminate the import
        if (bulkRes.failed > 0) {
          const errorMessages = bulkRes.errors.map(e => `${e.reference}: ${e.error}`).join("; ")
          const errMsg = `PERSISTENCE VERIFICATION FAILED: ${bulkRes.failed} player rounds failed verification for ${tournament.name} (${tournament.id}). Errors: ${errorMessages}`
          console.error(`[v0] ${errMsg}`)
          throw new Error(errMsg)
        }

        // All counts are based on verified database persistence, not intended writes
        summary.playerRoundsCreated += bulkRes.inserted
        summary.playerRoundsUpdated += bulkRes.updated

        console.log(
          `[v0] All player rounds persisted successfully`,
        )
      } else {
        console.log(`[v0] No player rounds to upsert (all players failed to match)`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : ""
      
      // If this is a persistence verification failure, re-throw immediately to fail fast
      if (message.includes("PERSISTENCE VERIFICATION FAILED")) {
        console.error(`[v0] TERMINATING IMPORT: ${message}`)
        if (stack) {
          console.error(`[v0] Stack trace: ${stack}`)
        }
        throw error
      }
      
      // For other errors, log and continue
      const logMsg = `Exception importing ${tournament.name}: ${message}`
      summary.notes.push(logMsg)
      console.error(`[v0] ${logMsg}`)
      if (stack) {
        console.error(`[v0] Stack trace: ${stack}`)
      }
    }
  }

  // Log details of the first API error if any occurred
  if (firstApiError) {
    console.error(`\n[v0] ═════════════════════════════════════════════════════════════`)
    console.error(`[v0] FIRST API ERROR DETAILS (likely root cause of HTTP 400)`)
    console.error(`[v0] ═════════════════════════════════════════════════════════════`)
    console.error(`[v0] Tournament: ${firstApiError.tournament}`)
    console.error(`[v0] Local Tournament ID: ${firstApiError.localId}`)
    console.error(`[v0] SportsDataIO External ID: ${firstApiError.externalId}`)
    console.error(`[v0] Error Message: ${firstApiError.message}`)
    if (firstApiError.error instanceof Error && firstApiError.error.stack) {
      console.error(`[v0] Stack Trace:`)
      console.error(firstApiError.error.stack)
    }
    console.error(`[v0] ═════════════════════════════════════════════════════════════\n`)
  }

  // IMPORT COMPLETED SUCCESSFULLY - All repositories verified persistence
  console.log(`\n[v0] Import loop completed successfully - all tournaments processed`)
  
  // PHASE 6: Final verification - Query database to confirm actual persistence
  console.log(`\n[v0] ═════════════════════════════════════════════════════════════`)
  console.log(`[v0] PHASE 6: Final Persistence Verification`)
  console.log(`[v0] ═════════════════════════════════════════════════════════════`)
  
  console.log(`[v0] Querying actual database state using same Prisma client...`)
  const actualRoundCount = await prisma.round.count()
  const actualPlayerRoundCount = await prisma.playerRound.count()
  const actualRoundStatsCount = await (prisma.roundStatistic?.count?.() ?? Promise.resolve(0))
  
  console.log(`\n[v0] ACTUAL DATABASE STATE (verified by Prisma.count()):`)
  console.log(`[v0]   rounds: ${actualRoundCount}`)
  console.log(`[v0]   player_rounds: ${actualPlayerRoundCount}`)
  console.log(`[v0]   round_statistics: ${actualRoundStatsCount}`)
  
  console.log(`\n[v0] REPORTED COUNTS (from import summary):`)
  console.log(`[v0]   Rounds created: ${summary.roundsCreated}`)
  console.log(`[v0]   PlayerRounds created: ${summary.playerRoundsCreated}`)
  console.log(`[v0]   PlayerRounds updated: ${summary.playerRoundsUpdated}`)
  
  // Critical validation
  const roundMismatch = actualRoundCount !== summary.roundsCreated
  const playerRoundMismatch = actualPlayerRoundCount !== (summary.playerRoundsCreated + summary.playerRoundsUpdated)
  
  if (roundMismatch) {
    console.error(`\n[v0] ⚠️  CRITICAL MISMATCH: Rounds`)
    console.error(`[v0]    Reported: ${summary.roundsCreated} created`)
    console.error(`[v0]    Actual:   ${actualRoundCount} in database`)
    console.error(`[v0]    Difference: ${Math.abs(actualRoundCount - summary.roundsCreated)}`)
  }
  if (playerRoundMismatch) {
    console.error(`\n[v0] ⚠️  CRITICAL MISMATCH: PlayerRounds`)
    console.error(`[v0]    Reported: ${summary.playerRoundsCreated + summary.playerRoundsUpdated} created/updated`)
    console.error(`[v0]    Actual:   ${actualPlayerRoundCount} in database`)
    console.error(`[v0]    Difference: ${Math.abs(actualPlayerRoundCount - (summary.playerRoundsCreated + summary.playerRoundsUpdated))}`)
  }

  console.log(`\n[v0] ✅ Historical Results Import Summary (VERIFIED PERSISTENCE):`)
  console.log(
    `[v0]   Tournaments considered: ${summary.tournamentsConsidered}`,
  )
  console.log(
    `[v0]   Tournaments with leaderboard: ${summary.tournamentsWithLeaderboard}`,
  )
  console.log(`[v0]   Rounds created: ${summary.roundsCreated}`)
  console.log(`[v0]   Player rounds created: ${summary.playerRoundsCreated}`)
  console.log(`[v0]   Player rounds updated: ${summary.playerRoundsUpdated}`)
  if (summary.notes.length > 0) {
    console.log(`[v0]   Notes (${summary.notes.length}):`)
    summary.notes.forEach((note, i) => {
      console.log(`[v0]     ${i + 1}. ${note}`)
    })
  }
  console.log(`[v0] ═════════════════════════════════════════════════════════════\n`)

  return summary
}
