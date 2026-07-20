import { prisma } from "@/lib/prisma"

/**
 * Diagnostic script to determine why the course import processed 0 courses.
 * 
 * This script:
 * 1. Counts all mappings by status before findVerified() is called
 * 2. Executes findVerified() and logs the query
 * 3. Shows the actual records returned
 * 4. Traces the execution path to find where it returns early
 */

async function diagnose() {
  console.log("\n" + "=".repeat(80))
  console.log("[DIAGNOSTIC] Golf Course Import Zero-Course Investigation")
  console.log("=".repeat(80) + "\n")

  try {
    // =========================================================================
    // STEP 1: Count mappings by status BEFORE findVerified()
    // =========================================================================
    console.log("[STEP 1] Total Mapping Counts Before findVerified()\n")

    const totalCount = await prisma.tournamentCourseMapping.count()
    console.log(`Total mappings in database: ${totalCount}`)

    const verifiedCount = await prisma.tournamentCourseMapping.count({
      where: { verified: true },
    })
    console.log(`verified=true: ${verifiedCount}`)

    const verificationStatusVERIFIED = await prisma.tournamentCourseMapping.count({
      where: { verificationStatus: "VERIFIED" },
    })
    console.log(`verificationStatus="VERIFIED": ${verificationStatusVERIFIED}`)

    const pendingReviewCount = await prisma.tournamentCourseMapping.count({
      where: { verificationStatus: "PENDING_REVIEW" },
    })
    console.log(`verificationStatus="PENDING_REVIEW": ${pendingReviewCount}`)

    const rejectedCount = await prisma.tournamentCourseMapping.count({
      where: { verificationStatus: "REJECTED" },
    })
    console.log(`verificationStatus="REJECTED": ${rejectedCount}`)

    const verifiedFalseCount = await prisma.tournamentCourseMapping.count({
      where: { verified: false },
    })
    console.log(`verified=false: ${verifiedFalseCount}`)

    console.log()

    // =========================================================================
    // STEP 2: Execute findVerified() and show the SQL query
    // =========================================================================
    console.log("[STEP 2] Execute findVerified() Query\n")
    console.log("Query:")
    console.log(`  SELECT * FROM tournament_course_mapping`)
    console.log(`  WHERE verified=true OR verificationStatus='VERIFIED'`)
    console.log(`  ORDER BY createdAt ASC\n`)

    const mappings = await prisma.tournamentCourseMapping.findMany({
      where: {
        OR: [
          { verified: true },
          { verificationStatus: "VERIFIED" },
        ],
      },
      orderBy: { createdAt: "asc" },
    })

    console.log(`Rows returned by findVerified(): ${mappings.length}\n`)

    // =========================================================================
    // STEP 3: If zero rows, show sample records to understand the state
    // =========================================================================
    if (mappings.length === 0) {
      console.log("[STEP 3] ZERO MAPPINGS FOUND - Showing Sample Records\n")

      const sampleMappings = await prisma.tournamentCourseMapping.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      })

      if (sampleMappings.length > 0) {
        console.log("Sample records from database:\n")
        for (const mapping of sampleMappings) {
          console.log(`ID: ${mapping.id}`)
          console.log(`  tournamentId: ${mapping.tournamentId}`)
          console.log(`  verified: ${mapping.verified}`)
          console.log(`  verificationStatus: ${mapping.verificationStatus}`)
          console.log(`  autoVerified: ${mapping.autoVerified}`)
          console.log(`  matchConfidence: ${mapping.matchConfidence}%`)
          console.log(`  golfCourseApiCourseId: ${mapping.golfCourseApiCourseId}`)
          console.log()
        }
      }

      // Check if any mappings exist at all
      if (totalCount === 0) {
        console.log("ROOT CAUSE: No mappings exist in the database!")
        console.log("Solution: Run tournament course mapping import first")
        return
      }

      // Check the status distribution
      console.log("Status Distribution:")
      console.log(`  VERIFIED: ${verificationStatusVERIFIED}`)
      console.log(`  PENDING_REVIEW: ${pendingReviewCount}`)
      console.log(`  REJECTED: ${rejectedCount}`)
      console.log(`  verified=true: ${verifiedCount}`)
      console.log(`  verified=false: ${verifiedFalseCount}`)
      console.log()

      // Determine root cause
      if (verificationStatusVERIFIED === 0 && verifiedCount === 0) {
        console.log("ROOT CAUSE: ALL mappings are PENDING_REVIEW or REJECTED")
        console.log(`  PENDING_REVIEW: ${pendingReviewCount}`)
        console.log(`  REJECTED: ${rejectedCount}`)
        console.log()
        console.log("Why findVerified() returned 0:")
        console.log("  Query: WHERE verified=true OR verificationStatus='VERIFIED'")
        console.log("  Result: No rows match these conditions")
        console.log()
        console.log("Next Steps:")
        console.log("  1. Verify a mapping using verifyMapping() method")
        console.log("  2. OR check if verificationStatus values are set correctly")
        return
      }
    } else {
      console.log("[STEP 3] MAPPINGS FOUND by findVerified()\n")
      console.log("IDs of verified mappings:")
      for (const mapping of mappings) {
        console.log(`  ${mapping.id}`)
      }
      console.log()

      // If mappings were found, why did the importer report 0 courses?
      console.log("[STEP 4] Why Did Importer Report 0 Courses?\n")
      console.log(`findVerified() returned ${mappings.length} mappings`)
      console.log("But CourseImportSummary.coursesConsidered = 0")
      console.log()
      console.log("This means the importer exited BEFORE the loop that processes mappings.")
      console.log("Check for early returns in importCourseIntelligence():")
      console.log("  - Error fetching mappings (but we verified it succeeded)")
      console.log("  - Prisma initialization error")
      console.log("  - GolfCourseAPIClient initialization error")
      console.log("  - Try-catch block catching an exception")
    }

  } catch (error) {
    console.error("\n[ERROR] Diagnostic script failed:")
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnose()
