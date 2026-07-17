/**
 * Server action for importing GolfCourse API data.
 *
 * Only accessible to authenticated admin users. Records import history and
 * supports ad-hoc course data downloads.
 */

"use server"

import { auth } from "@/lib/auth-server"
import { GolfCourseAPIClient } from "@/lib/providers/golfcourseapi/client"
import { importGolfCourses } from "@/lib/imports/golfcourse-import"

/**
 * Import GolfCourse data for one or more courses by their GolfCourse API IDs.
 *
 * @param courseIds - Array of GolfCourse API course IDs to import
 * @returns Import result with counts and any errors
 * @throws If not authenticated or not an admin
 */
export async function importGolfCourseAction(courseIds: number[]) {
  // Verify authentication and admin role
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized: Not authenticated")
  }

  const userRole = (session.user as any)?.role
  if (userRole !== "ADMIN") {
    throw new Error("Unauthorized: Admin role required")
  }

  if (!courseIds || courseIds.length === 0) {
    throw new Error("Bad request: courseIds is required and must not be empty")
  }

  console.log(`[v0] Starting GolfCourse import action for ${courseIds.length} course(s)`)

  try {
    // Create GolfCourse API client
    const client = new GolfCourseAPIClient()

    // Import courses
    const result = await importGolfCourses(client, courseIds)

    console.log(`[v0] GolfCourse import action completed: ${result.status}`)

    return {
      success: true,
      result,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] GolfCourse import action failed: ${errorMsg}`)

    return {
      success: false,
      error: errorMsg,
    }
  }
}
