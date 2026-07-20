import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { importCourseIntelligence } from "@/lib/imports/course-intelligence-import"

// Capture all console logs
const capturedLogs: string[] = []
const originalLog = console.log
console.log = (...args: any[]) => {
  const message = args.map((arg) => 
    typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(" ")
  capturedLogs.push(message)
  originalLog(...args)
}

export async function GET() {
  try {
    capturedLogs.length = 0

    console.log("[v0] ==================== PHASE 13.15 TRACE ====================")
    console.log("[v0] Testing verified mapping: cmrsd3z88000dbgnvgq8qv6mc (GolfCourseAPI ID: 18214)")
    console.log("[v0] Expected: Mapping should be imported with holes and tees")
    console.log("[v0] ============================================================\n")

    // Step 1: Verify the mapping exists and is VERIFIED
    console.log("[v0] STEP 1: Checking mapping status in database")
    const mapping = await prisma.tournamentCourseMapping.findUnique({
      where: { id: "cmrsd3z88000dbgnvgq8qv6mc" },
    })

    console.log("[v0] Mapping found:", {
      id: mapping?.id,
      verified: mapping?.verified,
      verificationStatus: mapping?.verificationStatus,
      golfCourseApiCourseId: mapping?.golfCourseApiCourseId,
    })

    if (!mapping?.verified) {
      return NextResponse.json({
        error: "Mapping is not VERIFIED",
        mapping: {
          verified: mapping?.verified,
          verificationStatus: mapping?.verificationStatus,
        },
      })
    }

    // Step 2: Run import with tracing
    console.log("\n[v0] STEP 2: Running course intelligence import with full tracing")
    const importResult = await importCourseIntelligence()

    console.log("\n[v0] STEP 3: Import completed with results")
    console.log("[v0] Import summary:", {
      coursesConsidered: importResult.coursesConsidered,
      coursesMatched: importResult.coursesMatched,
      coursesImported: importResult.coursesImported,
      coursesUpdated: importResult.coursesUpdated,
      coursesSkipped: importResult.coursesSkipped,
      holesImported: importResult.holesImported,
      teeBoxesImported: importResult.teeBoxesImported,
      failures: importResult.failures,
      warnings: importResult.warnings,
    })

    console.log("\n[v0] STEP 4: Import trace complete")
    
    // Extract TRACE logs for analysis
    const traceLogs = capturedLogs.filter((log) => log.includes("TRACE") || log.includes("STEP"))

    return NextResponse.json({
      status: "TRACE_COMPLETE",
      mapping: {
        id: mapping.id,
        verified: mapping.verified,
        golfCourseApiCourseId: mapping.golfCourseApiCourseId,
      },
      importResults: {
        coursesConsidered: importResult.coursesConsidered,
        coursesImported: importResult.coursesImported,
        holesImported: importResult.holesImported,
        teeBoxesImported: importResult.teeBoxesImported,
        failures: importResult.failures,
        warnings: importResult.warnings.slice(0, 3),
      },
      traceLogs: traceLogs,
      allLogs: capturedLogs.filter((log) => log.includes("[v0]")).slice(0, 50),
    })
  } catch (error) {
    console.log("[v0] TRACE ERROR:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        capturedLogs: capturedLogs.filter((log) => log.includes("[v0]")),
      },
      { status: 500 },
    )
  } finally {
    console.log = originalLog
  }
}
