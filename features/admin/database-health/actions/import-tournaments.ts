"use server"

import { auth } from "@/lib/auth"
import { runTournamentImport } from "@/lib/imports"
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

    // Run tournament import only (course mapping is handled separately as background job)
    const result = await runTournamentImport()

    return {
      success: true,
      data: {
        ok: result.failed === 0,
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
