import { NextResponse } from "next/server"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/tournament-mappings/low-confidence
 * 
 * Returns all low-confidence unverified mappings pending admin review.
 * Includes statistics on total, auto-verified, and pending counts.
 */
export async function GET() {
  try {
    const repo = getTournamentCourseMappingRepository(prisma)

    // Fetch low-confidence mappings (throws on database error)
    const mappings = await repo.findLowConfidenceForReview(100)

    // Fetch statistics
    const statsResult = await repo.getConfidenceStatistics()
    if (statsResult.outcome !== "ok") {
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      mappings,
      stats: statsResult.records
        ? {
            totalMappings: statsResult.records.totalMappings,
            averageConfidence: statsResult.records.averageConfidence,
            autoVerifiedCount: statsResult.records.autoVerifiedCount,
            manualVerifiedCount: statsResult.records.manualVerifiedCount,
            pendingReviewCount: statsResult.records.pendingReviewCount,
          }
        : null,
    })
  } catch (error) {
    console.error("[v0] Error in low-confidence endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
