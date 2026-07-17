"use server"

import { auth } from "@/lib/auth"
import { runTournamentImport } from "@/lib/imports"
import { orchestrateTournamentCourseMapping } from "@/lib/imports/tournament-course-mapping-orchestration"
import { headers } from "next/headers"

export async function importTournamentsAction() {
  try {
    // Verify the user is authenticated (already done in the UI, but enforce here)
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return {
        success: false,
        error: "Unauthorized: You must be logged in to perform imports",
      }
    }

    console.log("[v0] importTournamentsAction: Starting tournament import...")

    // Run tournament import directly (no HTTP call needed, preserves auth context)
    const result = await runTournamentImport()

    // After tournament import succeeds, orchestrate tournament → course mapping
    let mappingOrchestration = null
    if (result.failed === 0) {
      console.log("[v0] Tournament import succeeded. Starting course mapping orchestration...")
      mappingOrchestration = await orchestrateTournamentCourseMapping()
    } else {
      console.log(
        `[v0] Tournament import had ${result.failed} failures. Skipping course mapping orchestration.`,
      )
    }

    console.log("[v0] importTournamentsAction: Complete")

    return {
      success: true,
      data: {
        ok: result.failed === 0 && (mappingOrchestration?.ok ?? true),
        summary: {
          provider: result.provider,
          entity: result.entity,
          durationMs: result.durationMs,
          processed: result.processed,
          mapped: result.mapped,
          validated: result.validated,
          inserted: result.inserted,
          updated: result.updated,
          skipped: result.skipped,
          failed: result.failed,
          warnings: result.warnings,
          qualityScoreAverage: result.qualityScoreAverage,
        },
        mapping: mappingOrchestration
          ? {
              tournamentCoursesProcessed: mappingOrchestration.tournamentCoursesProcessed,
              mappingRowsCreated: mappingOrchestration.mappingRowsCreated,
              golfCourseApiMatchesFound: mappingOrchestration.golfCourseApiMatchesFound,
              golfCourseApiUnmatched: mappingOrchestration.golfCourseApiUnmatched,
              mappingsUpdated: mappingOrchestration.mappingsUpdated,
              mappingsReused: mappingOrchestration.mappingsReused,
              skippedTournaments: mappingOrchestration.skippedTournaments,
              totalErrors: mappingOrchestration.totalErrors,
              durationMs: mappingOrchestration.durationMs,
              summary: mappingOrchestration.summary,
              firstErrorMessage: mappingOrchestration.firstErrorMessage,
              firstErrorCause: mappingOrchestration.firstErrorCause,
            }
          : null,
        errors: result.errors.slice(0, 50),
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred"
    console.error("[v0] importTournamentsAction error:", message)
    return {
      success: false,
      error: message,
    }
  }
}
