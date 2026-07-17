/**
 * Test script to execute Historical Results Import with full logging capture
 * 
 * This script:
 * - Redirects all console output to both stdout and a log file
 * - Executes the import
 * - Captures the entire execution flow
 * - Reports results
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create log file
const logFile = path.join(__dirname, 'import-execution-log.txt')
const logStream = fs.createWriteStream(logFile, { flags: 'w' })

// Timestamp helper
const getTimestamp = () => new Date().toISOString()

// Override console to log to both stdout and file
const originalLog = console.log
const originalError = console.error

console.log = (...args) => {
  const msg = args.join(' ')
  originalLog(msg)
  logStream.write(`${getTimestamp()} LOG: ${msg}\n`)
}

console.error = (...args) => {
  const msg = args.join(' ')
  originalError(msg)
  logStream.write(`${getTimestamp()} ERROR: ${msg}\n`)
}

// Start logging
console.log('╔════════════════════════════════════════════════════════════════════════════════╗')
console.log('║          HISTORICAL RESULTS IMPORT - EXECUTION TEST                           ║')
console.log('║                     With Full Diagnostic Logging                              ║')
console.log('╚════════════════════════════════════════════════════════════════════════════════╝')
console.log('')
console.log(`[SYSTEM] Test started at: ${getTimestamp()}`)
console.log(`[SYSTEM] Log file: ${logFile}`)
console.log('')

// Import the function
console.log('[SYSTEM] Importing historical-results-import module...')
let importHistoricalResults
try {
  const module = await import('./lib/imports/historical-results-import.js')
  importHistoricalResults = module.importHistoricalResults
  console.log('[SYSTEM] ✅ Module imported successfully')
} catch (err) {
  console.error('[SYSTEM] ❌ Failed to import module:', err.message)
  if (err.stack) {
    console.error('[SYSTEM] Stack trace:', err.stack)
  }
  logStream.end()
  process.exit(1)
}

// Execute import
console.log('')
console.log('[SYSTEM] ═══════════════════════════════════════════════════════════════════════════')
console.log('[SYSTEM] EXECUTING IMPORT...')
console.log('[SYSTEM] ═══════════════════════════════════════════════════════════════════════════')
console.log('')

let summary
try {
  summary = await importHistoricalResults()
  console.log('')
  console.log('[SYSTEM] ═══════════════════════════════════════════════════════════════════════════')
  console.log('[SYSTEM] IMPORT EXECUTION COMPLETED')
  console.log('[SYSTEM] ═══════════════════════════════════════════════════════════════════════════')
} catch (err) {
  console.error('')
  console.error('[SYSTEM] ═══════════════════════════════════════════════════════════════════════════')
  console.error('[SYSTEM] IMPORT EXECUTION FAILED WITH EXCEPTION')
  console.error('[SYSTEM] ═══════════════════════════════════════════════════════════════════════════')
  console.error('[SYSTEM] Error:', err.message)
  if (err.stack) {
    console.error('[SYSTEM] Stack trace:')
    console.error(err.stack)
  }
  console.log('')
  logStream.end()
  process.exit(1)
}

// Report results
console.log('')
console.log('[SYSTEM] FINAL RESULTS:')
console.log('[SYSTEM] ─────────────────────────────────────────────────────────────────────────')
if (summary) {
  console.log(`[SYSTEM] Tournaments considered:      ${summary.tournamentsConsidered}`)
  console.log(`[SYSTEM] Tournaments with leaderboard: ${summary.tournamentsWithLeaderboard}`)
  console.log(`[SYSTEM] Rounds created:              ${summary.roundsCreated}`)
  console.log(`[SYSTEM] Player rounds created:       ${summary.playerRoundsCreated}`)
  console.log(`[SYSTEM] Player rounds updated:       ${summary.playerRoundsUpdated}`)
  console.log(`[SYSTEM] Player rounds failed:        ${summary.playerRoundsFailed}`)
  if (summary.notes && summary.notes.length > 0) {
    console.log(`[SYSTEM] Notes (${summary.notes.length}):`)
    summary.notes.forEach((note, i) => {
      console.log(`[SYSTEM]   ${i + 1}. ${note}`)
    })
  }
}
console.log('[SYSTEM] ─────────────────────────────────────────────────────────────────────────')
console.log('')
console.log(`[SYSTEM] Test completed at: ${getTimestamp()}`)
console.log(`[SYSTEM] Full output saved to: ${logFile}`)
console.log('')
console.log('[SYSTEM] ✅ EXECUTION COMPLETE')

logStream.end()
process.exit(0)
