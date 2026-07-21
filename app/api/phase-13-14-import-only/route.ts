import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { importCourseIntelligence } from "@/lib/imports/course-intelligence-import"

export async function GET() {
  try {
    const results: any[] = []

    // =========================================================================
    // Step 1: Get the one VERIFIED mapping
    // =========================================================================
    const verifiedMappings = await prisma.tournamentCourseMapping.findMany({
      where: {
        OR: [{ verified: true }, { verificationStatus: "VERIFIED" }],
        golfCourseApiCourseId: { not: null },
      },
    })

    results.push({
      step: 1,
      name: "VERIFIED mappings found",
      data: {
        count: verifiedMappings.length,
        mappings: verifiedMappings.map((m) => ({
          id: m.id,
          apiCourseId: m.golfCourseApiCourseId,
          confidence: m.matchConfidence,
        })),
      },
    })

    // =========================================================================
    // Step 2: Count rows before import
    // =========================================================================
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
      step: 2,
      name: "Rows before import",
      data: countsBefore,
    })

    // =========================================================================
    // Step 3: Execute import
    // =========================================================================
    const importStart = Date.now()
    const importResult = await importCourseIntelligence()
    const importDurationMs = Date.now() - importStart

    results.push({
      step: 3,
      name: "Import result",
      data: {
        coursesConsidered: importResult.coursesConsidered,
        coursesImported: importResult.coursesImported,
        coursesUpdated: importResult.coursesUpdated,
        coursesSkipped: importResult.coursesSkipped,
        holesImported: importResult.holesImported,
        teeBoxesImported: importResult.teeBoxesImported,
        durationMs: importDurationMs,
      },
    })

    // =========================================================================
    // Step 4: Count rows after import
    // =========================================================================
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
      step: 4,
      name: "Rows after import",
      data: {
        before: countsBefore,
        after: countsAfter,
        deltas,
        totalRowsAdded,
      },
    })

    // =========================================================================
    // Analysis
    // =========================================================================
    const success =
      verifiedMappings.length > 0 && importResult.coursesConsidered > 0 && totalRowsAdded > 0

    results.push({
      conclusion: success
        ? "A. The entire import pipeline works correctly"
        : `Pipeline status: ${
            verifiedMappings.length === 0
              ? "No verified mappings"
              : importResult.coursesConsidered === 0
                ? "Importer found no courses to process"
                : "GolfCourseAPI data not imported"
          }`,
    })

    return NextResponse.json({ results, success })
  } catch (error) {
    return NextResponse.json({ error: String(error), stack: error instanceof Error ? error.stack : undefined }, { status: 500 })
  }
}
