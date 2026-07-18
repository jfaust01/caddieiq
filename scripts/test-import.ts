#!/usr/bin/env node

/**
 * Test script: Import ONE course to verify Phase 13.1 normalized entity cascade
 */

import prismaClient from "@/lib/prisma"
import { importCourseIntelligence } from "@/lib/imports/course-intelligence-import"

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════╗")
  console.log("║  PHASE 13.1 IMPORTER TEST - SINGLE COURSE IMPORT      ║")
  console.log("╚════════════════════════════════════════════════════════╝\n")

  try {
    // ========================================================================
    // STEP 1: Get first tournament-course mapping
    // ========================================================================
    console.log("[TEST] STEP 1: Get first tournament-course mapping...")
    const firstMapping = await prismaClient.tournamentCourseMapping.findFirst({
      orderBy: { createdAt: "asc" },
    })

    if (!firstMapping) {
      console.error("❌ No tournament-course mappings found!")
      process.exit(1)
    }

    console.log(`✓ Found mapping:`)
    console.log(`  Tournament ID: ${firstMapping.tournamentId}`)
    console.log(`  GolfCourse API ID: ${firstMapping.golfCourseApiCourseId}`)
    console.log(`  Verified: ${firstMapping.verified}`)

    // ========================================================================
    // STEP 2: Verify the mapping
    // ========================================================================
    console.log("\n[TEST] STEP 2: Setting verified=true...")
    const updated = await prismaClient.tournamentCourseMapping.update({
      where: { tournamentId: firstMapping.tournamentId },
      data: { verified: true },
    })
    console.log(`✓ Mapping verified: ${updated.verified}`)

    // ========================================================================
    // STEP 3: Check baseline table counts
    // ========================================================================
    console.log("\n[TEST] STEP 3: Baseline table counts BEFORE import...")
    const beforeCounts = await getTableCounts()
    console.log(formatTableCounts(beforeCounts))

    // ========================================================================
    // STEP 4: Run the importer
    // ========================================================================
    console.log("\n[TEST] STEP 4: Running importCourseIntelligence()...")
    console.log("(Detailed logs from importer follow...)\n")
    const result = await importCourseIntelligence(undefined, prismaClient)
    console.log("\n(Importer logs complete)\n")

    // ========================================================================
    // STEP 5: Display import summary
    // ========================================================================
    console.log("[TEST] STEP 5: Import summary:")
    console.log(`  Job ID: ${result.jobId}`)
    console.log(`  Courses Considered: ${result.coursesConsidered}`)
    console.log(`  Courses Matched: ${result.coursesMatched}`)
    console.log(`  Courses Imported: ${result.coursesImported}`)
    console.log(`  Courses Updated: ${result.coursesUpdated}`)
    console.log(`  Holes Imported: ${result.holesImported}`)
    console.log(`  Tee Boxes Imported: ${result.teeBoxesImported}`)
    console.log(`  Duration: ${result.durationMs}ms`)
    if (result.failures && result.failures.length > 0) {
      console.log(`  Failures: ${result.failures.length}`)
      result.failures.slice(0, 3).forEach((f) => console.log(`    - ${f}`))
    }

    // ========================================================================
    // STEP 6: Check table counts AFTER import
    // ========================================================================
    console.log("\n[TEST] STEP 6: Table counts AFTER import...")
    const afterCounts = await getTableCounts()
    console.log(formatTableCounts(afterCounts))

    // ========================================================================
    // STEP 7: Display cascade validation
    // ========================================================================
    console.log("\n[TEST] STEP 7: Phase 13.1 Cascade Validation")
    console.log("═".repeat(60))

    const cascadeResults = []

    // Check Course
    const courseCount = afterCounts.course_details
    cascadeResults.push({
      name: "1. Course (course_details)",
      expected: courseCount > 0 ? "✓" : "✗",
      actual: courseCount,
    })

    // Check Address
    if (courseCount > 0) {
      const addressCount = afterCounts.course_addresses
      cascadeResults.push({
        name: "   ↓ CourseAddress (course_addresses)",
        expected: addressCount > 0 ? "✓" : "✗",
        actual: addressCount,
      })

      // Check Coordinates
      const coordCount = afterCounts.course_coordinates
      cascadeResults.push({
        name: "   ↓ CourseCoordinates (course_coordinates)",
        expected: coordCount > 0 ? "✓" : "✗",
        actual: coordCount,
      })

      // Check Specifications
      const specCount = afterCounts.course_specifications
      cascadeResults.push({
        name: "   ↓ CourseSpecifications (course_specifications)",
        expected: specCount > 0 ? "✓" : "✗",
        actual: specCount,
      })

      // Check Metadata
      const metaCount = afterCounts.course_metadata
      cascadeResults.push({
        name: "   ↓ CourseMetadata (course_metadata)",
        expected: metaCount > 0 ? "✓" : "✗",
        actual: metaCount,
      })

      // Check Playing Conditions
      const playingCount = afterCounts.playing_conditions
      cascadeResults.push({
        name: "   ↓ PlayingConditions (playing_conditions)",
        expected: playingCount > 0 ? "✓" : "✗",
        actual: playingCount,
      })

      // Check Holes (should be 18)
      const holeCount = afterCounts.course_holes
      cascadeResults.push({
        name: "   ↓ CourseHole (course_holes - should be 18)",
        expected: holeCount === 18 ? "✓" : holeCount > 0 ? "⚠" : "✗",
        actual: holeCount,
      })

      // Check Tees (usually 3-5)
      const teeCount = afterCounts.course_tees
      cascadeResults.push({
        name: "   ↓ CourseTee (course_tees - usually 3-5)",
        expected: teeCount >= 3 && teeCount <= 5 ? "✓" : teeCount > 0 ? "⚠" : "✗",
        actual: teeCount,
      })

      // Check Tee-Hole Yardages (should be holes × tees, typically 54+)
      const yardageCount = afterCounts.tee_hole_yardages
      cascadeResults.push({
        name: "   ↓ TeeHoleYardage (tee_hole_yardages - should be 54+)",
        expected: yardageCount >= 54 ? "✓" : yardageCount > 0 ? "⚠" : "✗",
        actual: yardageCount,
      })
    }

    cascadeResults.forEach((r) => {
      console.log(`${r.expected.padEnd(5)} ${r.name.padEnd(55)} ${String(r.actual).padStart(5)}`)
    })

    // ========================================================================
    // STEP 8: Final status
    // ========================================================================
    console.log("\n" + "═".repeat(60))
    const allPopulated = cascadeResults.every((r) => r.expected === "✓")
    if (allPopulated) {
      console.log("✅ ALL PHASE 13.1 NORMALIZED TABLES SUCCESSFULLY POPULATED!")
      console.log("✅ Data cascade validation PASSED")
    } else {
      console.log("⚠️  PARTIAL POPULATION - Check warnings/failures above")
    }

    console.log("\n")
  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  } finally {
    await prismaClient.$disconnect()
  }
}

async function getTableCounts() {
  return {
    course_details: await prismaClient.courseDetails.count(),
    course_addresses: await prismaClient.courseAddress.count(),
    course_coordinates: await prismaClient.courseCoordinates.count(),
    course_specifications: await prismaClient.courseSpecifications.count(),
    course_metadata: await prismaClient.courseMetadata.count(),
    playing_conditions: await prismaClient.playingConditions.count(),
    course_holes: await prismaClient.courseHole.count(),
    course_tees: await prismaClient.courseTee.count(),
    tee_hole_yardages: await prismaClient.teeHoleYardage.count(),
  }
}

function formatTableCounts(counts: Record<string, number>) {
  const lines = [
    "Table                          | Count",
    "─".repeat(40),
  ]
  Object.entries(counts).forEach(([table, count]) => {
    lines.push(`${table.padEnd(30)} | ${String(count).padStart(5)}`)
  })
  return lines.join("\n")
}

main().catch(console.error)
