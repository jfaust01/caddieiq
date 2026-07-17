import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { processTournamentCourseMapping } from "@/lib/imports/tournament-mapping-background"

/**
 * POST /api/admin/tournament-mapping/start
 * Initiates the tournament course mapping background job without blocking.
 * Returns immediately while the mapping processes independently.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fire the background job and return immediately
    // The job runs independently of this request
    processTournamentCourseMapping().catch((error) => {
      console.error("[v0] Tournament mapping background job error:", error)
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Tournament course mapping started in background",
          status: "pending",
        },
      },
      { status: 202 } // 202 Accepted - request accepted for processing
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
