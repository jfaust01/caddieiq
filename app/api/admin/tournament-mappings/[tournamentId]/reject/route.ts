import { NextResponse } from "next/server"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/admin/tournament-mappings/[tournamentId]/reject
 * 
 * Reject an incorrect tournament-course mapping.
 * Keeps verified=false and marks it as rejected for potential re-matching.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params
    const repo = getTournamentCourseMappingRepository(prisma)

    // Update mapping to indicate it was rejected
    const result = await repo.update(tournamentId, {
      verified: false,
      matchedBy: "rejected-by-admin",
    })

    if (result.outcome !== "ok") {
      return NextResponse.json(
        { error: "Failed to reject mapping" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mapping: result.records,
      message: "Mapping marked for re-matching",
    })
  } catch (error) {
    console.error("[v0] Error rejecting mapping:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
