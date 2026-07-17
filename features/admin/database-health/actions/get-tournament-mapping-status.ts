"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function getTournamentMappingStatusAction() {
  try {
    // Get headers first, before any other awaits (Next.js 16 requirement)
    const hdrs = await headers()

    // Verify the user is authenticated
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session) {
      return {
        success: false,
        error: "Unauthorized: You must be logged in to check status",
      }
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

    const mappingStats = await prisma.tournamentCourseMapping.aggregate({
      _count: true,
      where: {},
    })

    // Determine status
    let status: "pending" | "in_progress" | "completed" | "error" = "pending"
    if (completedMappings > 0 && completedMappings < totalTournamentCourses) {
      status = "in_progress"
    } else if (completedMappings >= totalTournamentCourses) {
      status = "completed"
    }

    // Get detailed mapping stats
    const stats = await prisma.$queryRaw<
      Array<{ status: string; count: bigint }>
    >`
      SELECT 
        CASE 
          WHEN "verified" = true THEN 'verified'
          WHEN "matchConfidence" > 0.8 THEN 'high_confidence'
          WHEN "matchConfidence" > 0.5 THEN 'medium_confidence'
          ELSE 'unmatched'
        END as status,
        COUNT(*) as count
      FROM tournament_course_mappings
      GROUP BY status
    `

    const statsMap: Record<string, number> = {}
    stats.forEach((row) => {
      statsMap[row.status] = Number(row.count)
    })

    return {
      success: true,
      data: {
        status,
        total: totalTournamentCourses,
        completed: completedMappings,
        percentage: totalTournamentCourses > 0 ? Math.round((completedMappings / totalTournamentCourses) * 100) : 0,
        breakdown: {
          verified: statsMap["verified"] || 0,
          highConfidence: statsMap["high_confidence"] || 0,
          mediumConfidence: statsMap["medium_confidence"] || 0,
          unmatched: statsMap["unmatched"] || 0,
        },
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred"
    return {
      success: false,
      error: message,
    }
  }
}
