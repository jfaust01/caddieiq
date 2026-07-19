import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("[v0] === Phase 13.4 Step 6: Generate Mapping Quality Report ===")

    // Get all mappings with details
    const mappings = await prisma.tournamentCourseMapping.findMany({
      include: {
        tournament: {
          select: { id: true, name: true },
        },
      },
    })

    // Build confidence distribution
    const confidenceBuckets = {
      "0-10": 0,
      "11-20": 0,
      "21-30": 0,
      "31-40": 0,
      "41-50": 0,
      "51-60": 0,
      "61-70": 0,
      "71-80": 0,
      "81-90": 0,
      "91-100": 0,
    }

    for (const mapping of mappings) {
      const confidence = mapping.matchConfidence || 0
      if (confidence <= 10) confidenceBuckets["0-10"]++
      else if (confidence <= 20) confidenceBuckets["11-20"]++
      else if (confidence <= 30) confidenceBuckets["21-30"]++
      else if (confidence <= 40) confidenceBuckets["31-40"]++
      else if (confidence <= 50) confidenceBuckets["41-50"]++
      else if (confidence <= 60) confidenceBuckets["51-60"]++
      else if (confidence <= 70) confidenceBuckets["61-70"]++
      else if (confidence <= 80) confidenceBuckets["71-80"]++
      else if (confidence <= 90) confidenceBuckets["81-90"]++
      else confidenceBuckets["91-100"]++
    }

    // Find unresolved tournaments
    const unresolvedTournaments = mappings
      .filter((m) => !m.verified && m.verificationStatus === "PENDING_REVIEW")
      .map((m) => ({
        tournamentId: m.tournamentId,
        tournamentName: m.tournament?.name,
        confidence: m.matchConfidence,
        courseName: m.golfCourseCourseName,
        golfCourseId: m.golfCourseApiCourseId,
      }))

    // Find duplicate course matches (multiple tournaments mapped to same course)
    const courseMatchCounts: Record<number, { count: number; tournaments: string[] }> = {}
    for (const mapping of mappings) {
      if (mapping.golfCourseApiCourseId && mapping.golfCourseApiCourseId > 0) {
        if (!courseMatchCounts[mapping.golfCourseApiCourseId]) {
          courseMatchCounts[mapping.golfCourseApiCourseId] = {
            count: 0,
            tournaments: [],
          }
        }
        courseMatchCounts[mapping.golfCourseApiCourseId].count++
        courseMatchCounts[mapping.golfCourseApiCourseId].tournaments.push(mapping.tournament?.name || mapping.tournamentId)
      }
    }

    const duplicateCourseMatches = Object.entries(courseMatchCounts)
      .filter(([_, data]) => data.count > 1)
      .map(([courseId, data]) => ({
        golfCourseApiId: Number(courseId),
        matchCount: data.count,
        tournaments: data.tournaments,
      }))

    // Find unmatched courses
    const unmatchedMappings = mappings.filter(
      (m) => !m.golfCourseApiCourseId || m.golfCourseApiCourseId <= 0,
    )

    // Calculate statistics
    const totalMappings = mappings.length
    const verifiedMappings = mappings.filter((m) => m.verified).length
    const rejectedMappings = mappings.filter((m) => m.verificationStatus === "REJECTED").length
    const pendingMappings = mappings.filter((m) => m.verificationStatus === "PENDING_REVIEW").length
    const matchedCourses = mappings.filter((m) => m.golfCourseApiCourseId && m.golfCourseApiCourseId > 0).length
    const unmatchedCourses = unmatchedMappings.length

    const avgConfidence =
      mappings.length > 0
        ? mappings.reduce((sum, m) => sum + (m.matchConfidence || 0), 0) / mappings.length
        : 0

    const verifiedStats = mappings.filter((m) => m.verified)
    const verifiedAvgConfidence =
      verifiedStats.length > 0
        ? verifiedStats.reduce((sum, m) => sum + (m.matchConfidence || 0), 0) / verifiedStats.length
        : 0

    // Check for violations
    const violations = mappings.filter(
      (m) => m.verified && (!m.golfCourseApiCourseId || m.golfCourseApiCourseId <= 0),
    )
    const confidenceViolations = mappings.filter(
      (m) => m.verified && (!m.matchConfidence || m.matchConfidence <= 0),
    )

    const report = {
      phase: "13.4",
      step: 6,
      status: "complete",
      generatedAt: new Date().toISOString(),
      summary: {
        totalMappings,
        verifiedMappings,
        rejectedMappings,
        pendingMappings,
        matchedCourses,
        unmatchedCourses,
        unmatchedCount: unmatchedCourses,
        averageConfidence: Math.round(avgConfidence * 100) / 100,
        verifiedAverageConfidence: Math.round(verifiedAvgConfidence * 100) / 100,
      },
      confidenceDistribution: confidenceBuckets,
      unresolvedTournaments: {
        count: unresolvedTournaments.length,
        details: unresolvedTournaments.slice(0, 10), // First 10
      },
      duplicateCourseMatches: {
        count: duplicateCourseMatches.length,
        details: duplicateCourseMatches,
      },
      unmatchedCourses: {
        count: unmatchedCourses,
        details: unmatchedMappings.slice(0, 10).map((m) => ({
          tournamentId: m.tournamentId,
          tournamentName: m.tournament?.name,
          courseName: m.golfCourseCourseName,
          matchConfidence: m.matchConfidence,
        })),
      },
      invariantViolations: {
        verifiedWithoutValidId: violations.length,
        verifiedWithoutConfidence: confidenceViolations.length,
        totalViolations: violations.length + confidenceViolations.length,
      },
      qualityChecks: {
        noInvariantViolations: violations.length === 0 && confidenceViolations.length === 0,
        noDuplicateMatches: duplicateCourseMatches.length === 0,
        allTournamentsResolved: unresolvedTournaments.length === 0,
        allCoursesMatched: unmatchedCourses === 0,
        highAverageConfidence: avgConfidence > 50,
      },
      readyForImport: verifiedMappings > 0 && violations.length === 0 && confidenceViolations.length === 0,
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
