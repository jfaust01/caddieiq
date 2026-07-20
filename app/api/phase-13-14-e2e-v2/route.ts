import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { importCourseIntelligence } from "@/lib/imports/course-intelligence-import"

export async function GET() {
  const results: any[] = []

  try {
    // =========================================================================
    // STEP 1: Find highest-confidence PENDING_REVIEW with VALID API ID (>0)
    // =========================================================================
    console.log("[v0] STEP 1: Finding highest-confidence PENDING_REVIEW with valid API ID...")

    const highestConfidenceMapping = await prisma.tournamentCourseMapping.findFirst({
      where: {
        verificationStatus: "PENDING_REVIEW",
        golfCourseApiCourseId: { gt: 0 }, // Must be > 0, not null
        matchConfidence: { gt: 0 },
      },
      orderBy: { matchConfidence: "desc" },
    })

    if (!highestConfidenceMapping) {
      return NextResponse.json({
        results,
        error: "No PENDING_REVIEW mappings with valid GolfCourseAPI Course ID (>0) found",
      })
    }

    results.push({
      step: 1,
      name: "Found highest-confidence mapping",
      data: {
        mappingId: highestConfidenceMapping.id,
        tournamentId: highestConfidenceMapping.tournamentId,
        golfCourseApiCourseId: highestConfidenceMapping.golfCourseApiCourseId,
        matchConfidence: highestConfidenceMapping.matchConfidence,
        currentStatus: highestConfidenceMapping.verificationStatus,
      },
    })

    // =========================================================================
    // STEP 2: Verify mapping using repository method
    // =========================================================================
    console.log("[v0] STEP 2: Verifying mapping...")

    const verifiedBefore = await prisma.tournamentCourseMapping.count({
      where: { OR: [{ verified: true }, { verificationStatus: "VERIFIED" }] },
    })

    const mappingRepo = getTournamentCourseMappingRepository(prisma)
    const verifyResult = await mappingRepo.verifyMapping(highestConfidenceMapping.tournamentId)

    if (verifyResult.outcome === "failed") {
      results.push({
        step: 2,
        name: "Verification FAILED",
        error: verifyResult.error?.message,
      })
      return NextResponse.json({
        results,
        error: `Verification failed: ${verifyResult.error?.message}`,
      })
    }

    const verifiedAfter = await prisma.tournamentCourseMapping.count({
      where: { OR: [{ verified: true }, { verificationStatus: "VERIFIED" }] },
    })

    results.push({
      step: 2,
      name: "Verified mapping using repository method",
      data: {
        verifiedBefore,
        verifiedAfter,
        delta: verifiedAfter - verifiedBefore,
      },
    })

    // =========================================================================
    // STEP 3: Count rows before import
    // =========================================================================
    console.log("[v0] STEP 3: Counting rows before import...")

    const countsBefore = {
      courses: await prisma.course.count(),
      courseDetails: await prisma.courseDetails.count(),
      courseHoles: await prisma.courseHole.count(),
      courseTees: await prisma.courseTee.count(),
      teeHoleYardages: await prisma.teeHoleYardage.count(),
      courseAddresses: await prisma.courseAddress.count(),
      courseCoordinates: await prisma.courseCoordinates.count(),
      courseMetadata: await prisma.courseMetadata.count(),
      courseSpecifications: await prisma.courseSpecifications.count(),
    }

    results.push({
      step: 3,
      name: "Row counts before import",
      data: countsBefore,
    })

    // =========================================================================
    // STEP 4: Execute Course Intelligence Import
    // =========================================================================
    console.log("[v0] STEP 4: Executing import...")

    const importStartTime = Date.now()
    const importResult = await importCourseIntelligence()
    const importDurationMs = Date.now() - importStartTime

    results.push({
      step: 4,
      name: "Course Intelligence Import executed",
      data: {
        coursesConsidered: importResult.coursesConsidered,
        coursesImported: importResult.coursesImported,
        coursesUpdated: importResult.coursesUpdated,
        holesImported: importResult.holesImported,
        teeBoxesImported: importResult.teeBoxesImported,
        durationMs: importDurationMs,
      },
    })

    // =========================================================================
    // STEP 5: Count rows after import
    // =========================================================================
    console.log("[v0] STEP 5: Counting rows after import...")

    const countsAfter = {
      courses: await prisma.course.count(),
      courseDetails: await prisma.courseDetails.count(),
      courseHoles: await prisma.courseHole.count(),
      courseTees: await prisma.courseTee.count(),
      teeHoleYardages: await prisma.teeHoleYardage.count(),
      courseAddresses: await prisma.courseAddress.count(),
      courseCoordinates: await prisma.courseCoordinates.count(),
      courseMetadata: await prisma.courseMetadata.count(),
      courseSpecifications: await prisma.courseSpecifications.count(),
    }

    const deltas = {
      courses: countsAfter.courses - countsBefore.courses,
      courseDetails: countsAfter.courseDetails - countsBefore.courseDetails,
      courseHoles: countsAfter.courseHoles - countsBefore.courseHoles,
      courseTees: countsAfter.courseTees - countsBefore.courseTees,
      teeHoleYardages: countsAfter.teeHoleYardages - countsBefore.teeHoleYardages,
      courseAddresses: countsAfter.courseAddresses - countsBefore.courseAddresses,
      courseCoordinates: countsAfter.courseCoordinates - countsBefore.courseCoordinates,
      courseMetadata: countsAfter.courseMetadata - countsBefore.courseMetadata,
      courseSpecifications: countsAfter.courseSpecifications - countsBefore.courseSpecifications,
    }

    const totalRowsAdded = Object.values(deltas).reduce((a, b) => a + b, 0)

    results.push({
      step: 5,
      name: "Row counts and deltas",
      data: {
        before: countsBefore,
        after: countsAfter,
        deltas,
        totalRowsAdded,
      },
    })

    // =========================================================================
    // FINAL ANALYSIS
    // =========================================================================
    const analysis = {
      step1_mappingFound: !!highestConfidenceMapping,
      step2_verificationSuccessful: verifiedAfter > verifiedBefore,
      step3_verifiedInFindVerified: await verifyMappingInFindVerified(mappingRepo, highestConfidenceMapping.id),
      step4_coursesProcessed: importResult.coursesConsidered > 0,
      step5_dataImported: totalRowsAdded > 0,
    }

    const conclusion = determinePipelineConclusion(analysis)

    results.push({
      step: "CONCLUSION",
      name: "Pipeline Analysis",
      data: analysis,
    })

    return NextResponse.json({
      results,
      conclusion,
    })
  } catch (error) {
    results.push({
      step: "ERROR",
      name: "Unexpected error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json({ results, error: String(error) }, { status: 500 })
  }
}

async function verifyMappingInFindVerified(
  mappingRepo: ReturnType<typeof getTournamentCourseMappingRepository>,
  mappingId: string
): Promise<boolean> {
  const result = await mappingRepo.findVerified()
  if (result.outcome === "failed") return false
  return !!(result.records && result.records.some((m) => m.id === mappingId))
}

function determinePipelineConclusion(analysis: any): string {
  if (!analysis.step1_mappingFound) return "ERROR: No mapping found"
  if (!analysis.step2_verificationSuccessful) return "ERROR: Verification failed"
  if (!analysis.step3_verifiedInFindVerified) return "ERROR: Verified mapping not in findVerified()"
  if (!analysis.step4_coursesProcessed) return "B. Verification works but importer has another runtime bug"
  if (!analysis.step5_dataImported) return "C. GolfCourseAPI requests fail or no data returned"
  return "A. The entire import pipeline works correctly"
}
