import { NextResponse } from "next/server"
import { searchCourses } from "@/lib/admin/golfcourse-import-service"

/**
 * Search for courses by name, city, or state.
 * POST /api/admin/imports/golfcourse/search
 * Body: { query: string }
 */

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as { query?: unknown }
    const query = typeof body.query === 'string' ? body.query : ''

    const results = await searchCourses(query, 10)
    return NextResponse.json(results)
  } catch (error) {
    console.error('[v0] Course search failed:', error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 },
    )
  }
}
