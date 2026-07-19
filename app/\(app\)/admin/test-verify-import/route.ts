import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { TournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { importCourseIntelligence } from "@/lib/imports/course-intelligence-import"

export async function POST(request: NextRequest) {
  try {
    console.log("\n═══════════════════════════════════════════════════════════════")
    console.log("TEST: Verify Single Mapping and Run Course Import")
    console.log("═══════════════════════════════════════════════════════════════\n")

    // Step 1: Find a good candidate mapping
    console.log("STEP 1: Finding a high-confidence mapping to test with...\n")

    let testMapping = await prisma.tournamentCourseMapping.findFirst({
      where: {
        OR: [
          { tournamentCourseName: { contains: "Sawgrass" } },
          { tournamentCourseName: { contains: "Harbour" } },
          { tournamentCourseName: { contains: "Pebble" } },
        ],
      },
      include: {
        tournamentCourse: {
          include: {
            tournament: true,
          },
        },
      },
    })

    if (!testMapping) {
      // Find any high-confidence mapping
      testMapping = await prisma.tournamentCourseMapping.findFirst({
        where: {
          matchConfidence: { gte: 50 },
        },
        orderBy: {
          matchConfidence: "desc",
        },
        include: {
          tournamentCourse: {
            include: {
              tournament: true,
            },
          },
        },
      })
    }

    if (!testMapping) {
      return NextResponse.json(
        { error: "No mappings with >= 50% confidence found" },
        { status: 404 }
      )
    }

    console.log(`✓ Found: ${testMapping.tournamentCourse.tournament.name}`)
    console.log(`  Course: ${testMapping.tournamentCourseName}`)
    console.log(`  API ID: ${testMapping.golfCourseApiCourseId || "NONE"}`)
    console.log(`  Confidence: ${testMapping.matchConfidence}%`)
    console.log(`  Current Status: ${testMapping.verificationStatus}, Verified: ${testMapping.verified}\n`)

    // Step 2: Verify the mapping using repository method
    console.log("STEP 2: Verifying mapping using repository method...\n")

    const mappingRepo = new TournamentCourseMappingRepository(prisma)
    await mappingRepo.verifyMapping(testMapping.tournamentCourseId)

    console.log("✓ Mapping verified!\n")

    // Step 3: Confirm verification was set
    const verifiedMapping = await prisma.tournamentCourseMapping.findUnique({
      where: { id: testMapping.id },
    })

    console.log(`✓ Verification confirmed in database:`)
    console.log(`  verificationStatus: ${verifiedMapping?.verificationStatus}`)
    console.log(`  verified: ${verifiedMapping?.verified}`)
    console.log(`  autoVerified: ${verifiedMapping?.autoVerified}\n`)

    // Step 4: Check if mapping is now selectable
    console.log("STEP 3: Checking if mapping is now selectable by course importer...\n")

    const selectableForImport = await prisma.tournamentCourseMapping.findMany({
      where: {
        OR: [{ verified: true }, { verificationStatus: "VERIFIED" }],
      },
    })

    const isSelectable = selectableForImport.some((m) => m.id === testMapping.id)
    console.log(`✓ Is mapping selectable? ${isSelectable ? "YES" : "NO"}`)
    console.log(`  Total verified mappings available: ${selectableForImport.length}\n`)

    // Step 5: Count current rows in course tables
    console.log("STEP 4: Counting rows in course tables BEFORE import...\n")

    const coursesBefore = await prisma.courses.count()
    const courseDetailsBefore = await prisma.courseDetails.count()
    const courseHolesBefore = await prisma.courseHoles.count()
    const courseTeesBefore = await prisma.courseTees.count()
    const teeHoleYardagesBefore = await prisma.teeHoleYardages.count()

    console.log(`  courses: ${coursesBefore}`)
    console.log(`  course_details: ${courseDetailsBefore}`)
    console.log(`  course_holes: ${courseHolesBefore}`)
    console.log(`  course_tees: ${courseTeesBefore}`)
    console.log(`  tee_hole_yardages: ${teeHoleYardagesBefore}\n`)

    // Step 6: Run the course import
    console.log("STEP 5: Running course intelligence import...\n")

    const importResult = await importCourseIntelligence()

    console.log(`✓ Import completed!`)
    console.log(`  Courses considered: ${importResult.coursesConsidered}`)
    console.log(`  Courses matched: ${importResult.coursesMatched}`)
    console.log(`  Courses imported: ${importResult.coursesImported}`)
    console.log(`  Job ID: ${importResult.jobId}\n`)

    // Step 7: Count rows after import
    console.log("STEP 6: Counting rows in course tables AFTER import...\n")

    const coursesAfter = await prisma.courses.count()
    const courseDetailsAfter = await prisma.courseDetails.count()
    const courseHolesAfter = await prisma.courseHoles.count()
    const courseTeesAfter = await prisma.courseTees.count()
    const teeHoleYardagesAfter = await prisma.teeHoleYardages.count()

    console.log(`  courses: ${coursesAfter} (${coursesAfter - coursesBefore > 0 ? "+" : ""}${coursesAfter - coursesBefore})`)
    console.log(
      `  course_details: ${courseDetailsAfter} (${courseDetailsAfter - courseDetailsBefore > 0 ? "+" : ""}${courseDetailsAfter - courseDetailsBefore})`
    )
    console.log(
      `  course_holes: ${courseHolesAfter} (${courseHolesAfter - courseHolesBefore > 0 ? "+" : ""}${courseHolesAfter - courseHolesBefore})`
    )
    console.log(
      `  course_tees: ${courseTeesAfter} (${courseTeesAfter - courseTeesBefore > 0 ? "+" : ""}${courseTeesAfter - courseTeesBefore})`
    )
    console.log(
      `  tee_hole_yardages: ${teeHoleYardagesAfter} (${teeHoleYardagesAfter - teeHoleYardagesBefore > 0 ? "+" : ""}${teeHoleYardagesAfter - teeHoleYardagesBefore})\n`
    )

    // Step 8: Check for errors
    console.log("STEP 7: Checking for errors in import_runs...\n")

    const importRuns = await prisma.importRun.findMany({
      where: {
        jobId: importResult.jobId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    if (importRuns.length === 0) {
      console.log("✓ No error records found (import runs clean)\n")
    } else {
      for (const run of importRuns) {
        console.log(`  ${run.resourceType}: ${run.status}`)
        if (run.errorMessage) {
          console.log(`    Error: ${run.errorMessage}`)
        }
      }
      console.log("")
    }

    // Summary
    console.log("═══════════════════════════════════════════════════════════════")
    console.log("TEST RESULTS SUMMARY")
    console.log("═══════════════════════════════════════════════════════════════\n")

    const results = {
      mappingSelected: true,
      mappingId: testMapping.id,
      tournament: testMapping.tournamentCourse.tournament.name,
      course: testMapping.tournamentCourseName,
      verificationStatus: verifiedMapping?.verificationStatus,
      verified: verifiedMapping?.verified,
      isSelectableByImporter: isSelectable,
      totalVerifiedMappings: selectableForImport.length,
      courseImportExecuted: importResult.coursesImported > 0,
      coursesConsidered: importResult.coursesConsidered,
      coursesMatched: importResult.coursesMatched,
      coursesImported: importResult.coursesImported,
      jobId: importResult.jobId,
      tablesReceivingRows: [
        coursesAfter > coursesBefore && { table: "courses", newRows: coursesAfter - coursesBefore },
        courseDetailsAfter > courseDetailsBefore && { table: "course_details", newRows: courseDetailsAfter - courseDetailsBefore },
        courseHolesAfter > courseHolesBefore && { table: "course_holes", newRows: courseHolesAfter - courseHolesBefore },
        courseTeesAfter > courseTeesBefore && { table: "course_tees", newRows: courseTeesAfter - courseTeesBefore },
        teeHoleYardagesAfter > teeHoleYardagesBefore && { table: "tee_hole_yardages", newRows: teeHoleYardagesAfter - teeHoleYardagesBefore },
      ].filter(Boolean),
      errorsFound: importRuns.filter((r) => r.status === "ERROR"),
      allImportRuns: importRuns,
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error("❌ Test failed:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
