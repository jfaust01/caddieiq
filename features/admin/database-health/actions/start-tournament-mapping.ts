"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { processTournamentCourseMapping } from "@/lib/imports/tournament-mapping-background"

export async function startTournamentMappingAction() {
  try {
    // Get headers first, before any other awaits (Next.js 16 requirement)
    const hdrs = await headers()

    // Verify the user is authenticated
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session) {
      return {
        success: false,
        error: "Unauthorized: You must be logged in to start mapping",
      }
    }

    // Start the background mapping job (fire and forget)
    // This returns immediately while the mapping processes in the background
    processTournamentCourseMapping().catch((error) => {
      console.error("[v0] Tournament mapping background job failed:", error)
    })

    return {
      success: true,
      data: {
        message: "Tournament course mapping started",
        status: "pending",
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
