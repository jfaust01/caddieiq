"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * Get the status of the tournament mapping workflow.
 * Calls the status API endpoint which queries the actual Workflow SDK run state.
 * Accepts an optional runId to query a specific workflow run.
 */
export async function getTournamentMappingStatusAction(runId?: string) {
  try {
    // Get headers first, before any other awaits (Next.js 16 requirement)
    const hdrs = await headers()

    // Verify the user is authenticated
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session) {
      return {
        success: false,
        error: "Unauthorized: You must be logged in to check status",
      }
    }

    // Call the status API endpoint
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"

    const url = new URL(`${baseUrl}/api/admin/tournament-mapping/status`)
    if (runId) {
      url.searchParams.append("runId", runId)
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: hdrs.get("cookie") || "",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error || "Failed to get mapping status",
      }
    }

    const result = await response.json()
    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred"
    return {
      success: false,
      error: message,
    }
  }
}
