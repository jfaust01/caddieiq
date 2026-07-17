/**
 * Server action for importing GolfCourse API data.
 *
 * Only accessible to authenticated admin users. Records import history and
 * supports ad-hoc course data downloads.
 */

"use server"

import { isCurrentUserAdmin } from "@/lib/session"
import { GolfCourseAPIClient } from "@/lib/providers/golfcourseapi/client"
import { importCourseIntelligence } from "@/lib/imports/course-intelligence-import"
import type { CourseImportSummary } from "@/lib/types/course-import"

/**
 * Import course intelligence (details, holes, tees) for all verified tournament-course mappings.
 *
 * Enriches tournaments with detailed course information from GolfCourse API.
 *
 * @returns Import result with counts and any errors/warnings
 * @throws If not authenticated or not an admin
 */
export async function importCourseIntelligenceAction() {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin role required" }
  }

  try {
    // Create GolfCourse API client
    const client = new GolfCourseAPIClient()

    // Import course intelligence for all verified mappings
    const result = await importCourseIntelligence(client)

    return {
      success: true,
      result,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] Course intelligence import action failed: ${errorMsg}`)

    return {
      success: false,
      error: errorMsg,
    }
  }
}
