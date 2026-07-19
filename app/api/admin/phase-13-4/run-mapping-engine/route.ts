import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { orchestrateTournamentCourseMapping } from "@/lib/imports/tournament-course-mapping-orchestration"

export async function POST() {
  try {
    console.log("[v0] === Phase 13.4 Step 1: Re-run Tournament Course Mapping Workflow ===")
    console.log("[v0] Starting at:", new Date().toISOString())

    // Get all tournaments
    const tournaments = await prisma.tournament.findMany({
      select: { id: true, name: true, sourceType: true, sourceTournamentId: true },
    })

    console.log(`[v0] Found ${tournaments.length} tournaments to process`)

    if (tournaments.length === 0) {
      return NextResponse.json(
        { error: "No tournaments found" },
        { status: 404 }
      )
    }

    // Run orchestration
    console.log("[v0] Running Tournament Course Mapping orchestration...")
    const stats = await orchestrateTournamentCourseMapping(tournaments, prisma)

    console.log("[v0] Orchestration complete!")

    // Get updated statistics
    const mappings = await prisma.tournamentCourseMapping.findMany({
      select: {
        tournamentId: true,
        golfCourseApiCourseId: true,
        matchConfidence: true,
        verified: true,
        verificationStatus: true,
      },
    })

    // Analyze results
    const verified = mappings.filter((m) => m.verified).length
    const unverified = mappings.filter((m) => !m.verified).length
    const withValidId = mappings.filter((m) => m.golfCourseApiCourseId && m.golfCourseApiCourseId > 0).length
    const pendingReview = mappings.filter((m) => m.verificationStatus === "PENDING_REVIEW").length
    const rejected = mappings.filter((m) => m.verificationStatus === "REJECTED").length
    const avgConfidence =
      mappings.length > 0
        ? mappings.reduce((sum, m) => sum + (m.matchConfidence || 0), 0) / mappings.length
        : 0
    const maxConfidence = Math.max(...mappings.map((m) => m.matchConfidence || 0), 0)
    const minConfidence = Math.min(...mappings.map((m) => m.matchConfidence || 0), 0)

    // Check for violations
    const violations = mappings.filter(
      (m) => m.verified && (!m.golfCourseApiCourseId || m.golfCourseApiCourseId <= 0),
    )
    const confidenceViolations = mappings.filter((m) => m.verified && (!m.matchConfidence || m.matchConfidence <= 0))

    const result = {
      phase: "13.4",
      step: 1,
      status: "complete",
      timing: {
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      orchestration: stats,
      mappingStatistics: {
        totalMappings: mappings.length,
        verified,
        unverified,
        pendingReview,
        rejected,
        withValidGolfCourseApiId: withValidId,
        averageConfidence: Math.round(avgConfidence * 100) / 100,
        maxConfidence,
        minConfidence,
      },
      invariantViolations: {
        verifiedWithoutValidId: violations.length,
        verifiedWithoutConfidence: confidenceViolations.length,
        totalViolations: violations.length + confidenceViolations.length,
      },
      checks: {
        allVerifiedHaveValidId: violations.length === 0,
        allVerifiedHaveValidConfidence: confidenceViolations.length === 0,
        noViolations: violations.length === 0 && confidenceViolations.length === 0,
      },
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
