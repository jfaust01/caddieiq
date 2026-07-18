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
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const summary = await importHistoricalResults()
    return { success: true, summary }
  } catch (error) {
    // Extract error details with stack trace
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    const name = error instanceof Error ? error.name : "UnknownError"

    // Log complete error with file/line info for debugging
    console.error(`[v0] Historical Results Import Error: ${name}`)
    console.error(`[v0] Message: ${message}`)
    if (stack) {
      console.error(`[v0] Stack Trace:`)
      stack.split("\n").forEach(line => {
        console.error(`[v0] ${line}`)
      })
    }

    // Return structured error response (stack trace only in development)
    return {
      success: false,
      error: message,
      stack: process.env.NODE_ENV === "development" ? stack : undefined,
    }
  }
}
