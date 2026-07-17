import { NextResponse } from "next/server"
import { getCourseCoverage } from "@/lib/admin/golfcourse-import-service"

/**
 * Fetch data coverage for a course.
 * GET /api/admin/imports/golfcourse/coverage/[id]
 */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: "Missing course ID" },
        { status: 400 }
      )
    }

    const coverage = await getCourseCoverage(id)
    return NextResponse.json(coverage)
  } catch (error) {
    console.error('[v0] Coverage fetch failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch coverage" },
      { status: 500 }
    )
  }
}
