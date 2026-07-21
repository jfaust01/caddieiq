import { NextResponse } from "next/server"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/admin/tournament-mappings/[tournamentId]/verify
 * 
 * Manually verify a tournament-course mapping.
 * Sets verified=true without requiring auto-verification threshold.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params
    const repo = getTournamentCourseMappingRepository(prisma)

    // Update mapping to verified=true
    const result = await repo.update(tournamentId, {
      verified: true,
    })

    if (result.outcome !== "ok") {
      return NextResponse.json(
        { error: "Failed to verify mapping" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mapping: result.records,
    })
  } catch (error) {
    console.error("[v0] Error verifying mapping:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
