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
import { enrichCourseCharacteristicsTable } from "@/lib/services/course-enrichment-service"

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

async function runEnrichment(options: Options) {
  const prisma = new PrismaClient()

  try {
    log(`Fetching courses from database...`)
    
    const result = await enrichCourseCharacteristicsTable(prisma, {
      dryRun: options.dryRun,
      onProgress: (progress) => {
        if (options.verbose) {
          log(`Processed ${progress.processedCourses}/${progress.totalCourses} courses...`)
        }
      },
    })

    log(`Enriched ${result.enrichedCount} courses.`)

    if (result.skippedCount > 0) {
      logError(`Skipped ${result.skippedCount} courses due to errors.`)
    }

    if (options.dryRun) {
      log(`[DRY RUN] Would have created ${result.createdCount} and updated ${result.updatedCount} records.`)
    }

    return result
  } finally {
    await prisma.$disconnect()
  }
}

async function main(): Promise<void> {
  const options = parseArgs()

  log(`Starting enrichment pipeline...`)
  log(`Options: dryRun=${options.dryRun}, verbose=${options.verbose}`)

  const result = await runEnrichment(options)

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
