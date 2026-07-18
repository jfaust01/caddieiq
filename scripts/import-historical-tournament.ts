#!/usr/bin/env node
/**
 * Development script to import a single historical tournament by SportsDataIO ID.
 *
 * Usage:
 *   pnpm historical:tournament 590
 *
 * This imports only the specified tournament and prints detailed statistics.
 */

import { importHistoricalResults } from "@/lib/imports/historical-results-import"

async function main() {
  const args = process.argv.slice(2)
  const tournamentId = args[0]

  if (!tournamentId || isNaN(Number(tournamentId))) {
    console.error("[v0] Error: Tournament ID required")
    console.error("[v0] Usage: pnpm historical:tournament <tournamentId>")
    console.error("[v0] Example: pnpm historical:tournament 590")
    process.exit(1)
  }

  const startTime = Date.now()

  try {
    console.log(`[v0] Importing tournament ${tournamentId}...`)
    console.log("")

    const summary = await importHistoricalResults({
      tournamentId: Number(tournamentId),
    })

    const duration = Date.now() - startTime
    const seconds = (duration / 1000).toFixed(2)

    console.log("")
    console.log("========================================")
    console.log("Import Summary")
    console.log("========================================")
    console.log(`Tournament imported: ${summary.tournamentsWithLeaderboard}/${summary.tournamentsConsidered}`)
    console.log(`Rounds created: ${summary.roundsCreated}`)
    console.log(`PlayerRounds created: ${summary.playerRoundsCreated}`)
    console.log(`PlayerRounds updated: ${summary.playerRoundsUpdated}`)
    console.log(`PlayerRounds failed: ${summary.playerRoundsFailed}`)
    console.log(`RoundStatistics created: ${summary.roundStatisticsCreated}`)
    console.log(`RoundStatistics updated: ${summary.roundStatisticsUpdated}`)
    console.log(`RoundStatistics failed: ${summary.roundStatisticsFailed}`)
    console.log(`Execution time: ${seconds}s`)

    if (summary.notes && summary.notes.length > 0) {
      console.log("")
      console.log("Notes:")
      summary.notes.forEach(note => console.log(`  - ${note}`))
    }

    console.log("========================================")

    const hasErrors = summary.playerRoundsFailed > 0 || summary.roundStatisticsFailed > 0
    process.exit(hasErrors ? 1 : 0)
  } catch (error) {
    console.error("[v0] Import failed:", error)
    process.exit(1)
  }
}

main()
