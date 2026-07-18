import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { tournamentIds } = await request.json()

    if (!Array.isArray(tournamentIds) || tournamentIds.length === 0) {
      return NextResponse.json(
        { error: "tournamentIds must be a non-empty array" },
        { status: 400 }
      )
    }

    const repo = getTournamentCourseMappingRepository(prisma)
    let successCount = 0

    for (const tournamentId of tournamentIds) {
      const result = await repo.markForReSearch(tournamentId)
      if (result.outcome === "ok") {
        successCount++
      }
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      message: `Marked ${successCount} mappings for re-search`,
    })
  } catch (error) {
    console.error("Bulk search-again error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
