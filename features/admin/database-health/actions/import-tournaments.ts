"use server"

import { auth } from "@/lib/auth"
import { runTournamentImport } from "@/lib/imports"
import { orchestrateTournamentCourseMapping } from "@/lib/imports/tournament-course-mapping-orchestration"
import { headers } from "next/headers"

export async function importTournamentsAction() {
  try {
    // Get headers first, before any other awaits (Next.js 16 requirement)
    const hdrs = await headers()

    // Verify the user is authenticated (already done in the UI, but enforce here)
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session) {
      return {
        success: false,
        error: "Unauthorized: You must be logged in to perform imports",
      }
    }

    // Run tournament import directly (no HTTP call needed, preserves auth context)
    const result = await runTournamentImport()

    // After tournament import succeeds, orchestrate tournament → course mapping
    let mappingOrchestration = null
    if (result.failed === 0) {
      mappingOrchestration = await orchestrateTournamentCourseMapping()
    }

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
              mappingsCreated: mappingOrchestration.mappingRowsCreated,
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
    return {
      success: false,
      error: message,
    }
  }
}
