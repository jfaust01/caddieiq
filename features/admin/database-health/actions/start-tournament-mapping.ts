"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

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

    // Call the API route to start the background job
    // The route returns 202 Accepted immediately while processing continues independently
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"

    const response = await fetch(
      `${baseUrl}/api/admin/tournament-mapping/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pass the authorization headers to the API route
          Cookie: hdrs.get("cookie") || "",
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error || "Failed to start mapping",
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
