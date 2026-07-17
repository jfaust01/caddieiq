import { importHistoricalResults } from '@/lib/imports/historical-results-import'

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗')
  console.log('║          HISTORICAL RESULTS IMPORT - EXECUTION TEST                           ║')
  console.log('║                     With Full Diagnostic Logging                              ║')
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n')

  try {
    console.log('[SYSTEM] Starting import...\n')
    const result = await importHistoricalResults()
    
    console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗')
    console.log('║                          IMPORT COMPLETED                                     ║')
    console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n')
    
    console.log('[SUMMARY] Final Results:')
    console.log(`  Tournaments considered:       ${result.tournamentsConsidered}`)
    console.log(`  Tournaments with leaderboard: ${result.tournamentsWithLeaderboard}`)
    console.log(`  Rounds created:               ${result.roundsCreated}`)
    console.log(`  Player rounds created:        ${result.playerRoundsCreated}`)
    console.log(`  Player rounds updated:        ${result.playerRoundsUpdated}`)
    console.log(`  Player rounds failed:         ${result.playerRoundsFailed}`)
    
    if (result.notes.length > 0) {
      console.log(`\n[SUMMARY] Notes (${result.notes.length}):`)
      result.notes.slice(0, 10).forEach((note, i) => {
        console.log(`  ${i + 1}. ${note}`)
      })
      if (result.notes.length > 10) {
        console.log(`  ... and ${result.notes.length - 10} more notes`)
      }
    }
    
    process.exit(0)
  } catch (error) {
    console.error('\n[ERROR] Import failed:')
    console.error(error)
    process.exit(1)
  }
}

main()
