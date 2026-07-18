import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { tournamentIds, reason } = await request.json()

    if (!Array.isArray(tournamentIds) || tournamentIds.length === 0) {
      return NextResponse.json(
        { error: "tournamentIds must be a non-empty array" },
        { status: 400 }
      )
    }

    const repo = getTournamentCourseMappingRepository(prisma)
    const result = await repo.bulkReject(tournamentIds, reason)

    if (result.outcome !== "ok") {
      return NextResponse.json(
        { error: result.error?.message || "Failed to reject mappings" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: result.records,
      message: `Rejected ${result.records} mappings`,
    })
  } catch (error) {
    console.error("Bulk reject error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
