import { orchestrateTournamentCourseMapping } from "@/lib/imports/tournament-course-mapping-orchestration"
import prismaClient from "@/lib/prisma"

/**
 * Phase 13.4: Run tournament matching with fixed GolfCourseAPI client
 * 
 * The GolfCourseAPI client has been fixed to use the correct search_query parameter.
 * This script runs the full tournament matching orchestration and captures detailed metrics.
 */

async function runTournamentMatching() {
  console.log("\n")
  console.log("╔══════════════════════════════════════════════════════════════════╗")
  console.log("║          PHASE 13.4: TOURNAMENT MATCHING VERIFICATION             ║")
  console.log("║                   (Fixed GolfCourseAPI Client)                    ║")
  console.log("╚══════════════════════════════════════════════════════════════════╝")
  console.log("\n")

  try {
    const result = await orchestrateTournamentCourseMapping(prismaClient)

    // Detailed report
    console.log("\n")
    console.log("╔══════════════════════════════════════════════════════════════════╗")
    console.log("║                    DETAILED MATCHING REPORT                      ║")
    console.log("╚══════════════════════════════════════════════════════════════════╝")

    console.log("\n📊 OVERALL STATISTICS")
    console.log("─".repeat(66))
    console.log(`Total Duration:                    ${result.durationMs}ms`)
    console.log(`Tournament Courses Processed:       ${result.tournamentCoursesProcessed}`)
    console.log(`Mapping Rows Created:              ${result.mappingRowsCreated}`)
    console.log(`GolfCourseAPI Matches Found:       ${result.golfCourseApiMatchesFound}`)
    console.log(`GolfCourseAPI Unmatched:           ${result.golfCourseApiUnmatched}`)
    console.log(`Mappings Reused (Verified):        ${result.mappingsReused}`)
    console.log(`Mappings Updated:                  ${result.mappingsUpdated}`)
    console.log(`Skipped Tournaments:               ${result.skippedTournaments}`)
    console.log(`Total Errors:                      ${result.totalErrors}`)

    // Calculate success metrics
    const autoMatched = result.golfCourseApiMatchesFound
    const manualReview = result.golfCourseApiUnmatched
    const reusingVerified = result.mappingsReused
    const totalMatched = autoMatched + reusingVerified

    const successRate =
      result.tournamentCoursesProcessed > 0
        ? ((totalMatched / result.tournamentCoursesProcessed) * 100).toFixed(2)
        : "0.00"

    console.log("\n" + "─".repeat(66))
    console.log("MATCH STATUS BREAKDOWN")
    console.log("─".repeat(66))
    console.log(`Auto-Matched (GolfCourseAPI):      ${autoMatched}`)
    console.log(`Pending Manual Review:             ${manualReview}`)
    console.log(`Reusing Verified Mappings:         ${reusingVerified}`)
    console.log(`─`.repeat(66))
    console.log(`Total Verified/Matched:            ${totalMatched}/${result.tournamentCoursesProcessed} (${successRate}%)`)

    // Confidence score analysis
    if (result.results.length > 0) {
      const resultsWithConfidence = result.results.filter((r) => r.confidence !== undefined)
      if (resultsWithConfidence.length > 0) {
        const confidenceScores = resultsWithConfidence.map((r) => r.confidence as number)
        const avgConfidence = (confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length).toFixed(2)
        const minConfidence = Math.min(...confidenceScores)
        const maxConfidence = Math.max(...confidenceScores)

        console.log("\n" + "─".repeat(66))
        console.log("CONFIDENCE SCORES")
        console.log("─".repeat(66))
        console.log(`Matches with Confidence:          ${resultsWithConfidence.length}`)
        console.log(`Average Confidence:               ${avgConfidence}%`)
        console.log(`Minimum Confidence:               ${minConfidence}%`)
        console.log(`Maximum Confidence:               ${maxConfidence}%`)

        // Confidence distribution
        const high = confidenceScores.filter((c) => c >= 80).length
        const medium = confidenceScores.filter((c) => c >= 50 && c < 80).length
        const low = confidenceScores.filter((c) => c < 50).length

        console.log("\n" + "─".repeat(66))
        console.log("CONFIDENCE DISTRIBUTION")
        console.log("─".repeat(66))
        console.log(`High (80-100%):                    ${high}`)
        console.log(`Medium (50-79%):                   ${medium}`)
        console.log(`Low (0-49%):                       ${low}`)
      }
    }

    // Detailed results by tournament (grouped by status)
    console.log("\n" + "═".repeat(66))
    console.log("TOURNAMENT-BY-TOURNAMENT RESULTS")
    console.log("═".repeat(66))

    const successResults = result.results.filter((r) => r.status === "success")
    const errorResults = result.results.filter((r) => r.status === "error")

    if (successResults.length > 0) {
      console.log("\n✅ SUCCESSFUL MATCHES (" + successResults.length + ")")
      console.log("─".repeat(66))
      successResults.forEach((r, idx) => {
        const matchType = r.mappingReused ? "REUSED" : r.mappingCreated ? "CREATED" : "UPDATED"
        const confidence = r.confidence !== undefined ? `(${r.confidence}%)` : ""
        console.log(`  ${idx + 1}. ${r.tournamentName}`)
        console.log(`     Course: ${r.courseName}`)
        console.log(`     Status: ${matchType} ${confidence}`)
      })
    }

    if (errorResults.length > 0) {
      console.log("\n❌ FAILED MATCHES (" + errorResults.length + ")")
      console.log("─".repeat(66))
      errorResults.forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.tournamentName}`)
        console.log(`     Course: ${r.courseName}`)
        console.log(`     Error: ${r.error}`)
      })
    }

    // Final summary
    console.log("\n" + "═".repeat(66))
    console.log("FINAL SUMMARY")
    console.log("═".repeat(66))
    console.log(result.summary)

    if (!result.ok && result.firstErrorMessage) {
      console.log(`\nFirst Error: ${result.firstErrorMessage}`)
      if (result.firstErrorCause) {
        console.log(`Cause:\n${result.firstErrorCause}`)
      }
    }

    console.log("\n" + "═".repeat(66))
    console.log(result.ok ? "✅ PHASE 13.4 COMPLETE - SUCCESS" : "⚠️ PHASE 13.4 COMPLETE - WITH ERRORS")
    console.log("═".repeat(66))
    console.log("\n")

    process.exit(result.ok ? 0 : 1)
  } catch (error) {
    console.error("\n❌ PHASE 13.4 FAILED")
    console.error(error)
    process.exit(1)
  }
}

runTournamentMatching()
