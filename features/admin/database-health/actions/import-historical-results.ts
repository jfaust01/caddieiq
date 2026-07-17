"use server"

import { isCurrentUserAdmin } from "@/lib/session"
import { importHistoricalResults } from "@/lib/imports/historical-results-import"

/**
 * Admin server action to trigger a historical results import (Rounds + PlayerRounds).
 */
export async function importHistoricalResultsAction() {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const summary = await importHistoricalResults()
    return { success: true, summary }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
