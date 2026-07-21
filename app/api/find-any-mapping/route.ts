import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Find ANY PENDING_REVIEW mapping with API ID > 0
    const anyMapping = await prisma.tournamentCourseMapping.findFirst({
      where: {
        verificationStatus: "PENDING_REVIEW",
        golfCourseApiCourseId: { gt: 0 },
      },
      orderBy: { matchConfidence: "desc" },
    })

    if (!anyMapping) {
      // Find by any confidence
      const anyConfidence = await prisma.tournamentCourseMapping.findFirst({
        where: {
          verificationStatus: "PENDING_REVIEW",
          golfCourseApiCourseId: { not: null, not: 0 },
        },
      })

      if (anyConfidence) {
        return NextResponse.json({ found: true, mapping: anyConfidence })
      }

      // Last resort: get first PENDING_REVIEW with ANY API ID
      const lastResort = await prisma.tournamentCourseMapping.findFirst({
        where: {
          verificationStatus: "PENDING_REVIEW",
        },
      })

      if (lastResort) {
        return NextResponse.json({
          found: true,
          mapping: lastResort,
          note: "This mapping has no GolfCourseAPI match yet",
        })
      }

      return NextResponse.json({ found: false, message: "No PENDING_REVIEW mappings available" })
    }

    return NextResponse.json({ found: true, mapping: anyMapping })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
