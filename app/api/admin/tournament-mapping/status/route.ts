import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total tournament courses that need mapping
    const totalTournamentCourses = await prisma.tournamentCourse.count({
      where: {
        tournament: { active: true },
        hostCourse: true,
      },
    })

    // Get mapping statistics
    const completedMappings = await prisma.tournamentCourseMapping.count()

    // Determine status
    let status: "pending" | "in_progress" | "completed" = "pending"
    if (completedMappings > 0 && completedMappings < totalTournamentCourses) {
      status = "in_progress"
    } else if (completedMappings >= totalTournamentCourses && totalTournamentCourses > 0) {
      status = "completed"
    }

    // Get detailed stats by match confidence
    const stats = await prisma.tournamentCourseMapping.aggregate({
      _count: true,
      _avg: {
        matchConfidence: true,
      },
    })

    const verified = await prisma.tournamentCourseMapping.count({
      where: { verified: true },
    })

    const highConfidence = await prisma.tournamentCourseMapping.count({
      where: {
        verified: false,
        matchConfidence: { gte: 0.8 },
      },
    })

    const unmatched = await prisma.tournamentCourseMapping.count({
      where: {
        matchConfidence: { lt: 0.5 },
      },
    })

    return NextResponse.json({
      status,
      total: totalTournamentCourses,
      completed: completedMappings,
      percentage: totalTournamentCourses > 0 ? Math.round((completedMappings / totalTournamentCourses) * 100) : 0,
      breakdown: {
        verified,
        highConfidence,
        unmatched,
      },
      avgConfidence: stats._avg.matchConfidence ? Math.round(stats._avg.matchConfidence * 100) / 100 : 0,
    })
  } catch (error) {
    console.error("[v0] Tournament mapping status error:", error)
    return NextResponse.json(
      { error: "Failed to get mapping status" },
      { status: 500 },
    )
  }
}
