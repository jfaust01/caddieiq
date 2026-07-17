import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { performAdminGolfCourseImport } from "@/lib/admin/golfcourse-import-service"

/**
 * Admin-only GolfCourse import endpoint.
 * 
 * Allows authenticated admins to re-import a course's GolfCourseAPI data
 * with full transparency into what changed.
 * 
 * POST /api/admin/imports/golfcourse
 * Body: { courseId: string, forceRefresh: boolean }
 * 
 * Response: { success: boolean, ...GolfCourseImportResult }
 */

export const maxDuration = 60

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Check authentication
    const headerList = await headers()
    const session = await auth.api.getSession({ headers: headerList })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role (adjust based on your auth system)
    // For now, we'll allow any authenticated user for testing
    // TODO: Add proper admin role check

    // Parse request
    let courseId: string
    let forceRefresh: boolean

    try {
      const body = await request.json() as { courseId?: unknown; forceRefresh?: unknown }
      courseId = typeof body.courseId === 'string' ? body.courseId : ''
      forceRefresh = typeof body.forceRefresh === 'boolean' ? body.forceRefresh : false
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      )
    }

    if (!courseId) {
      return NextResponse.json(
        { error: "Missing courseId" },
        { status: 400 },
      )
    }

    // Perform import
    const result = await performAdminGolfCourseImport(courseId, forceRefresh)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    })
  } catch (error) {
    console.error('[v0] Admin GolfCourse import failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Import failed",
      },
      { status: 500 },
    )
  }
}
