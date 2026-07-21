import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get samples of PENDING_REVIEW
    const pending = await prisma.tournamentCourseMapping.findMany({
      where: { verificationStatus: "PENDING_REVIEW" },
      orderBy: { matchConfidence: "desc" },
      take: 10,
      select: {
        id: true,
        matchConfidence: true,
        golfCourseApiCourseId: true,
        verificationStatus: true,
      },
    })

    // Count by API ID
    const withApiId = await prisma.tournamentCourseMapping.count({
      where: {
        verificationStatus: "PENDING_REVIEW",
        golfCourseApiCourseId: { not: null },
      },
    })

    const withoutApiId = await prisma.tournamentCourseMapping.count({
      where: {
        verificationStatus: "PENDING_REVIEW",
        golfCourseApiCourseId: null,
      },
    })

    return NextResponse.json({
      pendingSamples: pending,
      pendingWithApiId: withApiId,
      pendingWithoutApiId: withoutApiId,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
