import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Count by status manually
    const pendingCount = await prisma.tournamentCourseMapping.count({
      where: { verificationStatus: "PENDING_REVIEW" },
    })
    const verifiedCount = await prisma.tournamentCourseMapping.count({
      where: { OR: [{ verified: true }, { verificationStatus: "VERIFIED" }] },
    })
    const rejectedCount = await prisma.tournamentCourseMapping.count({
      where: { verificationStatus: "REJECTED" },
    })
    const total = await prisma.tournamentCourseMapping.count()

    const byStatus = [
      { status: "PENDING_REVIEW", count: pendingCount },
      { status: "VERIFIED", count: verifiedCount },
      { status: "REJECTED", count: rejectedCount },
    ]

    // Find highest confidence PENDING_REVIEW
    const highestPending = await prisma.tournamentCourseMapping.findFirst({
      where: {
        verificationStatus: "PENDING_REVIEW",
        golfCourseApiCourseId: { not: null },
        matchConfidence: { gt: 0 },
      },
      orderBy: { matchConfidence: "desc" },
    })

    // Find all VERIFIED with API ID
    const verified = await prisma.tournamentCourseMapping.findMany({
      where: {
        OR: [{ verified: true }, { verificationStatus: "VERIFIED" }],
        golfCourseApiCourseId: { not: null },
      },
    })

    return NextResponse.json({
      byStatus,
      total,
      highestPendingReview: highestPending
        ? {
            id: highestPending.id,
            confidence: highestPending.matchConfidence,
            apiCourseId: highestPending.golfCourseApiCourseId,
          }
        : null,
      verifiedWithApiId: verified.length,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
