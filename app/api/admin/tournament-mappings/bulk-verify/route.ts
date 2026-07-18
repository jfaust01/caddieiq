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
    const result = await repo.bulkVerify(tournamentIds)

    if (result.outcome !== "ok") {
      return NextResponse.json(
        { error: result.error?.message || "Failed to verify mappings" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: result.records,
      message: `Verified ${result.records} mappings`,
    })
  } catch (error) {
    console.error("Bulk verify error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
