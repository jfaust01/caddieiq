import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { importCourseIntelligence } from "@/lib/imports/course-intelligence-import"

export async function POST() {
  try {
    console.log("[v0] === Phase 13.4 Step 5: Run Course Importer ===")
    console.log("[v0] Starting at:", new Date().toISOString())

    // Get verified mappings
    const mappingRepo = getTournamentCourseMappingRepository(prisma)
    const mappings = await mappingRepo.findVerified()

    console.log(`[v0] Found ${mappings.length} verified mappings to process`)

    if (mappings.length === 0) {
      return NextResponse.json(
        {
          phase: "13.4",
          step: 5,
          status: "no_verified_mappings",
          warning: "No verified mappings found to import",
          suggestion: "Run mapping orchestration first (step 1)",
          coursesConsidered: 0,
          coursesMatched: 0,
          coursesImported: 0,
          holesImported: 0,
          teeBoxesImported: 0,
        },
        { status: 200 }
      )
    }

    // Run importer
    const result = await importCourseIntelligence({
      jobId: `phase-13-4-${Date.now()}`,
      startedAt: new Date(),
    })

    console.log("[v0] Importer complete!")
    console.log(`[v0] Courses imported: ${result.coursesImported}`)
    console.log(`[v0] Holes imported: ${result.holesImported}`)
    console.log(`[v0] Tee boxes imported: ${result.teeBoxesImported}`)

    // Check success criteria
    const successCriteria = {
      coursesConsideredGreaterThanZero: result.coursesConsidered > 0,
      coursesImportedGreaterThanZero: result.coursesImported > 0,
      holesImportedGreaterThanZero: result.holesImported > 0,
      teeBoxesImportedGreaterThanZero: result.teeBoxesImported > 0,
      allCriteriaMet:
        result.coursesConsidered > 0 &&
        result.coursesImported > 0 &&
        result.holesImported > 0 &&
        result.teeBoxesImported > 0,
    }

    return NextResponse.json(
      {
        phase: "13.4",
        step: 5,
        status: "complete",
        timing: {
          startedAt: result.startedAt,
          completedAt: result.completedAt,
          durationMs: result.durationMs,
        },
        importerResult: {
          jobId: result.jobId,
          coursesConsidered: result.coursesConsidered,
          coursesMatched: result.coursesMatched,
          coursesImported: result.coursesImported,
          coursesUpdated: result.coursesUpdated,
          coursesSkipped: result.coursesSkipped,
          holesImported: result.holesImported,
          holesUpdated: result.holesUpdated,
          holesSkipped: result.holesSkipped,
          teeBoxesImported: result.teeBoxesImported,
          teeBoxesUpdated: result.teeBoxesUpdated,
          teeBoxesSkipped: result.teeBoxesSkipped,
          warnings: result.warnings,
          failures: result.failures,
        },
        successCriteria,
        allCriteriaMet: successCriteria.allCriteriaMet,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
