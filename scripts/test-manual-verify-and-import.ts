import { prisma } from "@/lib/prisma"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { importCourseIntelligence } from "@/lib/imports/course-intelligence-import"

async function main() {
  console.log("════════════════════════════════════════════════════════════")
  console.log("TEST: Manual Verify Mapping & Run Course Import")
  console.log("════════════════════════════════════════════════════════════")

  try {
    const mappingRepo = getTournamentCourseMappingRepository(prisma)

    // Step 1: Find TPC Sawgrass or similar mapping
    console.log("\nStep 1: Searching for mappings to verify...")
    const allMappings = await prisma.tournamentCourseMapping.findMany({
      where: { verificationStatus: "PENDING_REVIEW" },
      include: { tournament: true },
      orderBy: { matchConfidence: "desc" },
      take: 5,
    })

    console.log(`Found ${allMappings.length} pending review mappings`)
    allMappings.forEach((m) => {
      console.log(
        `  - ${m.tournament.name} (confidence: ${m.matchConfidence}%, API ID: ${m.golfCourseApiCourseId || "none"})`,
      )
    })

    // Find one to verify (prefer highest confidence or has API ID)
    const mappingToVerify = allMappings.find((m) => m.golfCourseApiCourseId) || allMappings[0]

    if (!mappingToVerify) {
      console.log("❌ No mappings found to verify")
      return
    }

    console.log(`\nStep 2: Manually verifying: ${mappingToVerify.tournament.name}`)
    console.log(`  Tournament ID: ${mappingToVerify.tournamentId}`)
    console.log(`  Current status: ${mappingToVerify.verificationStatus}`)
    console.log(`  Confidence: ${mappingToVerify.matchConfidence}%`)
    console.log(`  Golf Course API ID: ${mappingToVerify.golfCourseApiCourseId}`)

    // Step 2: Manually verify using repository method
    const verifyResult = await mappingRepo.verifyMapping(mappingToVerify.tournamentId)

    if (verifyResult.outcome === "ok") {
      console.log("✓ Successfully verified mapping")
      console.log(`  New status: ${verifyResult.data.verificationStatus}`)
      console.log(`  Verified flag: ${verifyResult.data.verified}`)
    } else {
      console.log(`❌ Failed to verify mapping: ${verifyResult.error.message}`)
      return
    }

    // Step 3: Check database state before import
    console.log("\nStep 3: Checking verified mappings before import...")
    const verifiedMappings = await prisma.tournamentCourseMapping.findMany({
      where: {
        OR: [{ verified: true }, { verificationStatus: "VERIFIED" }],
      },
    })
    console.log(`  Verified mappings in DB: ${verifiedMappings.length}`)
    verifiedMappings.forEach((m) => {
      console.log(`    - Tournament ${m.tournamentId}: ${m.verificationStatus}, API ID: ${m.golfCourseApiCourseId}`)
    })

    // Step 4: Run course import
    console.log("\nStep 4: Running course import...")
    console.log("─".repeat(60))

    const importResult = await importCourseIntelligence(prisma)

    console.log("─".repeat(60))
    console.log("\nImport Complete:")
    console.log(`  Status: ${importResult.ok ? "✓ SUCCESS" : "⚠ PARTIAL"}`)
    console.log(`  Courses Considered: ${importResult.coursesConsidered}`)
    console.log(`  Courses Matched: ${importResult.coursesMatched}`)
    console.log(`  Courses Imported: ${importResult.coursesImported}`)
    console.log(`  Holes Imported: ${importResult.holesImported}`)
    console.log(`  Tee Boxes Imported: ${importResult.teeBoxesImported}`)
    console.log(`  All Criteria Met: ${importResult.allCriteriaMet}`)

    if (importResult.errors && importResult.errors.length > 0) {
      console.log(`\n⚠ Errors encountered:`)
      importResult.errors.forEach((err) => {
        console.log(`  - ${err}`)
      })
    }

    // Step 5: Check database state after import
    console.log("\nStep 5: Checking course tables after import...")
    const courseCount = await prisma.course.count()
    const courseDetailsCount = await prisma.courseDetails.count()
    const courseHolesCount = await prisma.courseHole.count()

    console.log(`  Courses table: ${courseCount} rows`)
    console.log(`  Course details table: ${courseDetailsCount} rows`)
    console.log(`  Course holes table: ${courseHolesCount} rows`)

    if (courseCount > 0) {
      console.log("✓ Course data imported successfully!")
      const course = await prisma.course.findFirst()
      if (course) {
        console.log(`\nSample course:`)
        console.log(`  ID: ${course.id}`)
        console.log(`  Name: ${course.name}`)
        console.log(`  Location: ${course.location}`)
      }
    } else {
      console.log("❌ No courses imported")
    }

    console.log("\n════════════════════════════════════════════════════════════")
    console.log("TEST COMPLETE")
    console.log("════════════════════════════════════════════════════════════")
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

main().catch(console.error)
