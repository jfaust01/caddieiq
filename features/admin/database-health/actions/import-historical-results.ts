"use server"

import { isCurrentUserAdmin } from "@/lib/session"
import { importHistoricalResults } from "@/lib/imports/historical-results-import"

/**
 * Response structure for historical results import action
 */
export interface ImportHistoricalResultsResponse {
  success: boolean
  summary?: any
  error?: string
  stack?: string
}

/**
 * Admin server action to trigger a historical results import (Rounds + PlayerRounds).
 */
export async function importHistoricalResultsAction(): Promise<ImportHistoricalResultsResponse> {
  console.log("[v0] Action: Import started")
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    console.log("[v0] Action: User not admin, returning unauthorized")
    return { success: false, error: "Unauthorized" }
  }

  try {
    console.log("[v0] Action: Calling importHistoricalResults()")
    const summary = await importHistoricalResults()
    console.log("[v0] Action: Import finished successfully")
    const response = { success: true, summary }
    console.log("[v0] Action: Returning success response")
    return response
  } catch (error) {
    // Extract error details with stack trace
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    const name = error instanceof Error ? error.name : "UnknownError"

    // Log complete error with file/line info for debugging
    console.error(`[v0] Action: Historical Results Import Error: ${name}`)
    console.error(`[v0] Action: Message: ${message}`)
    if (stack) {
      console.error(`[v0] Action: Stack Trace:`)
      stack.split("\n").forEach(line => {
        console.error(`[v0] ${line}`)
      })
    }

    // Return structured error response (stack trace only in development)
    const errorResponse = {
      success: false,
      error: message,
      stack: process.env.NODE_ENV === "development" ? stack : undefined,
    }
    console.log("[v0] Action: Returning error response")
    return errorResponse
  }
}
