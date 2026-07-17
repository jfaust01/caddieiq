"use server"

import { auth } from "@/lib/auth"
import { runTournamentImport } from "@/lib/imports"
import { orchestrateTournamentCourseMapping } from "@/lib/imports/tournament-course-mapping-orchestration"
import { headers } from "next/headers"

export async function importTournamentsAction() {
  console.log("[v0] ACTION START")
  try {
    // Verify the user is authenticated (already done in the UI, but enforce here)
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      console.log("[v0] RETURN ERROR: Unauthorized")
      return {
        success: false,
        error: "Unauthorized: You must be logged in to perform imports",
      }
    }

    console.log("[v0] importTournamentsAction: Starting tournament import...")

    // Run tournament import directly (no HTTP call needed, preserves auth context)
    console.log("[v0] Before runTournamentImport()")
    const result = await runTournamentImport()
    console.log("[v0] After runTournamentImport()")

    // After tournament import succeeds, orchestrate tournament → course mapping
    let mappingOrchestration = null
    if (result.failed === 0) {
      console.log("[v0] Tournament import succeeded. Before orchestrateTournamentCourseMapping()...")
      mappingOrchestration = await orchestrateTournamentCourseMapping()
      console.log("[v0] After orchestrateTournamentCourseMapping()")
    } else {
      console.log(
        `[v0] Tournament import had ${result.failed} failures. Skipping course mapping orchestration.`,
      )
    }

    console.log("[v0] importTournamentsAction: Before building response object")

    const responseData = {
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

    console.log("[v0] RETURN SUCCESS: response object built, about to return")
    console.log("[v0] RETURN SUCCESS: mapping results =", mappingOrchestration ? `${mappingOrchestration.mappingRowsCreated} created, ${mappingOrchestration.totalErrors} errors` : "null")
    return responseData
  } catch (error) {
    console.log("[v0] THROW caught in catch block")
    const message = error instanceof Error ? error.message : "Unknown error occurred"
    console.error("[v0] importTournamentsAction error:", message, error instanceof Error ? error.stack : "")
    console.log("[v0] RETURN ERROR")
    return {
      success: false,
      error: message,
    }
  } finally {
    console.log("[v0] FINALLY BLOCK: Action execution completed (success or error)")
  }
}
