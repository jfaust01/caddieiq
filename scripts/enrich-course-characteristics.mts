#!/usr/bin/env node

/**
 * Enrich Course Characteristics table.
 *
 * Generates one CourseCharacteristic record per course using verified course data
 * and domain-derived values. Runs idempotently — safe to rerun without duplicates.
 *
 * Usage:
 *   npx tsx scripts/enrich-course-characteristics.mts [--dry-run]
 *
 * Options:
 *   --dry-run    Preview the enrichment without persisting to the database.
 *   --verbose    Log every course processed (default: summary only).
 */

import { PrismaClient } from "@/lib/generated/prisma/client"
import {
  enrichCourseCharacteristics,
  type CharacteristicsEnrichmentResult,
  type DerivedCharacteristics,
} from "@/lib/analytics/course-characteristics-engine"
import { CourseRepository } from "@/lib/repositories/course-repository"

const BATCH_SIZE = 500

interface Options {
  dryRun: boolean
  verbose: boolean
}

function parseArgs(): Options {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes("--dry-run"),
    verbose: args.includes("--verbose"),
  }
}

function log(message: string): void {
  console.log(`[enrich-courses] ${message}`)
}

function logError(message: string): void {
  console.error(`[enrich-courses] ERROR: ${message}`)
}

async function enrichCourseCharacteristicsTable(options: Options): Promise<CharacteristicsEnrichmentResult> {
  const prisma = new PrismaClient()
  const repository = new CourseRepository(prisma)

  const result: CharacteristicsEnrichmentResult = {
    totalCourses: 0,
    enrichedCount: 0,
    skippedCount: 0,
    createdCount: 0,
    updatedCount: 0,
    errors: [],
  }

  try {
    // Step 1: Fetch all non-deleted courses in batches.
    log(`Fetching courses from database...`)
    const allCourses = await prisma.course.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        par: true,
        yardage: true,
        altitudeFt: true,
      },
      orderBy: { name: "asc" },
    })

    result.totalCourses = allCourses.length
    log(`Found ${result.totalCourses} courses to process.`)

    if (result.totalCourses === 0) {
      log("No courses found. Exiting.")
      return result
    }

    // Step 2: Enrich in batches.
    const characteristicsToPersist: DerivedCharacteristics[] = []

    for (const course of allCourses) {
      try {
        const derived = enrichCourseCharacteristics(course as any)
        characteristicsToPersist.push(derived)
        result.enrichedCount++

        if (options.verbose) {
          log(
            `Enriched: ${course.name} (${course.id}) — ${derived.drivingImportance ? `driving=${derived.drivingImportance.toFixed(2)}` : "no weighting"}`,
          )
        }
      } catch (error) {
        result.skippedCount++
        result.errors.push({
          courseId: course.id,
          error: error instanceof Error ? error.message : String(error),
        })
        logError(`Failed to enrich ${course.name} (${course.id}): ${error}`)
      }
    }

    log(`Enriched ${result.enrichedCount} courses.`)

    if (result.skippedCount > 0) {
      logError(`Skipped ${result.skippedCount} courses due to errors.`)
    }

    // Step 3: Persist in batches (or dry-run log).
    if (options.dryRun) {
      log(`[DRY RUN] Would have persisted ${characteristicsToPersist.length} characteristic records.`)
      log(`Sample record: ${JSON.stringify(characteristicsToPersist[0], null, 2)}`)
    } else {
      log(`Persisting ${characteristicsToPersist.length} characteristic records...`)

      for (let i = 0; i < characteristicsToPersist.length; i += BATCH_SIZE) {
        const batch = characteristicsToPersist.slice(i, i + BATCH_SIZE)
        const batchResult = await repository.bulkUpsertCharacteristics(batch)

        result.createdCount += batchResult.inserted
        result.updatedCount += batchResult.updated

        if (batchResult.failed > 0) {
          result.errors.push(
            ...batchResult.errors.map((error) => ({
              courseId: error.courseId ?? "UNKNOWN",
              error: error.message ?? String(error),
            }))
          )

          logError(
            `Batch completed with ${batchResult.failed} failed writes.`
          )
        }

        log(
          `Persisted batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(characteristicsToPersist.length / BATCH_SIZE)}`
        )
      }
    }
  } finally {
    await prisma.$disconnect()
  }

  return result
}

async function main(): Promise<void> {
  const options = parseArgs()

  log(`Starting enrichment pipeline...`)
  log(`Options: dryRun=${options.dryRun}, verbose=${options.verbose}`)

  const result = await enrichCourseCharacteristicsTable(options)

  // Summary report.
  console.log("\n========== ENRICHMENT SUMMARY ==========")
  console.log(`Total courses:     ${result.totalCourses}`)
  console.log(`Enriched:          ${result.enrichedCount}`)
  console.log(`Skipped:           ${result.skippedCount}`)
  console.log(`Created records:   ${result.createdCount}`)
  console.log(`Updated records:   ${result.updatedCount}`)

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`)
    result.errors.slice(0, 5).forEach((err) => {
      console.log(`  - ${err.courseId}: ${err.error}`)
    })
    if (result.errors.length > 5) {
      console.log(`  ... and ${result.errors.length - 5} more`)
    }
  }

  console.log("=========================================\n")

  // Exit with error code if there were failures.
  const hasFailures = result.errors.length > 0 || result.skippedCount > 0
  process.exit(hasFailures ? 1 : 0)
}

main().catch((error) => {
  logError(`Fatal error: ${error}`)
  process.exit(1)
})
