import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params

    const repo = getTournamentCourseMappingRepository(prisma)
    const result = await repo.markForReSearch(tournamentId)

    if (result.outcome !== "ok") {
      return NextResponse.json(
        { error: result.error?.message || "Failed to mark for re-search" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Mapping marked for re-search",
    })
  } catch (error) {
    console.error("Search-again error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
