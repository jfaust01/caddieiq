/**
 * Tournament → Course Mapping Orchestration
 *
 * After tournaments are imported from SportsDataIO, this module automatically
 * matches them to GolfCourse API courses and populates tournament_course_mappings.
 *
 * Flow:
 * 1. Query all tournaments with host courses (TournamentCourse where hostCourse=true)
 * 2. For each tournament's course, fetch course data (name, location, etc.)
 * 3. Call importTournamentCourse() to search GolfCourse API and create mapping
 * 4. Track results: created, updated, unmatched, skipped
 * 5. Report comprehensive statistics and any errors
 *
 * Idempotent: Safe to run multiple times. Reuses existing mappings if verified.
 */

import prismaClient from "@/lib/prisma"
import { GolfCourseAPIClient } from "@/lib/providers/golfcourseapi/client"
import { importTournamentCourse } from "./golfcourse-import"
import type { PrismaClient } from "@/lib/generated/prisma/client"

export interface TournamentCourseMappingOrchestrationResult {
  ok: boolean
  tournamentsScanned: number
  tournamentsWithCourses: number
  mappingsCreated: number
  mappingsUpdated: number
  mappingsReused: number
  unmatchedCourses: number
  skippedTournaments: number
  totalErrors: number
  durationMs: number
  results: TournamentCourseMappingOrchestrationItem[]
  summary: string
}

export interface TournamentCourseMappingOrchestrationItem {
  tournamentId: string
  tournamentName: string
  courseName: string
  status: "success" | "skipped" | "error"
  mappingCreated?: boolean
  mappingReused?: boolean
  confidence?: number
  error?: string
}

/**
 * Run the tournament → course mapping orchestration.
 * Called automatically after runTournamentImport() completes.
 */
export async function orchestrateTournamentCourseMapping(
  prisma: PrismaClient = prismaClient,
): Promise<TournamentCourseMappingOrchestrationResult> {
  const startTime = Date.now()
  const results: TournamentCourseMappingOrchestrationItem[] = []
  let tournamentsScanned = 0
  let tournamentsWithCourses = 0
  let mappingsCreated = 0
  let mappingsUpdated = 0
  let mappingsReused = 0
  let unmatchedCourses = 0
  let skippedTournaments = 0
  let totalErrors = 0

  console.log("[v0] ╔════════════════════════════════════════════════════════╗")
  console.log(
    "[v0] ║  TOURNAMENT → COURSE MAPPING ORCHESTRATION STARTING      ║",
  )
  console.log("[v0] ╚════════════════════════════════════════════════════════╝")
  console.log("[v0] Tournament Course Orchestration Started")

  try {
    // Step 1: Query all tournaments with host courses
    console.log("[v0] Step 1: Fetching active tournaments with host courses...")

    const tournamentsWithHostCourses = await prisma.tournament.findMany({
      where: { active: true },
      include: {
        tournamentCourses: {
          where: { hostCourse: true },
          include: { course: true },
        },
      },
      orderBy: { name: "asc" },
    })

    tournamentsScanned = tournamentsWithHostCourses.length
    console.log(`[v0] Found ${tournamentsScanned} active tournaments`)

    // Step 2: Filter to tournaments that have a host course
    const tournamentsToProcess = tournamentsWithHostCourses.filter(
      (t) => t.tournamentCourses.length > 0,
    )
    tournamentsWithCourses = tournamentsToProcess.length
    console.log(`[v0] ${tournamentsWithCourses} tournaments have host courses`)

    skippedTournaments = tournamentsScanned - tournamentsWithCourses
    if (skippedTournaments > 0) {
      console.log(`[v0] Skipped ${skippedTournaments} tournaments without host courses`)
    }

    // Step 3: Initialize GolfCourseAPI client
    const apiKey = process.env.GOLFCOURSE_API_KEY
    if (!apiKey) {
      throw new Error("GOLFCOURSE_API_KEY not set")
    }
    const client = new GolfCourseAPIClient(apiKey)

    // Step 4: Process each tournament's course
    console.log("[v0] Step 2: Processing tournaments for GolfCourse API mapping...")

    for (const tournament of tournamentsToProcess) {
      // Get the host course
      const hostCourseLink = tournament.tournamentCourses[0]
      if (!hostCourseLink || !hostCourseLink.course) {
        console.log(`[v0] Skipping ${tournament.name}: no host course found`)
        skippedTournaments++
        results.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          courseName: "Unknown",
          status: "skipped",
          error: "No host course found",
        })
        continue
      }

      const course = hostCourseLink.course

      try {
        // Query SportsDataIO course data from tournament for context
        const sportsDataCourseData = {
          name: course.name,
          clubName: course.name,
          city: course.city || undefined,
          state: course.stateProvince || undefined,
          country: course.country || undefined,
        }

        console.log(
          `[v0] Processing ${tournament.name} → ${course.name} (tournament ${tournament.id})...`,
        )

        // Call importTournamentCourse to match and create mapping
        const importResult = await importTournamentCourse(
          client,
          tournament.id,
          undefined, // sportsDataIoCourseId not available here
          course.name,
          sportsDataCourseData,
          prisma,
        )

        // Track result
        if (importResult.status === "success") {
          if (importResult.mappingCreated) {
            mappingsCreated++
          } else if (importResult.mappingReused) {
            mappingsReused++
          } else {
            mappingsUpdated++
          }

          results.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            courseName: course.name,
            status: "success",
            mappingCreated: importResult.mappingCreated,
            mappingReused: importResult.mappingReused,
            confidence: importResult.mappingConfidence,
          })

          console.log(
            `[v0] ✓ ${tournament.name}: confidence=${importResult.mappingConfidence}%, ` +
              `${importResult.mappingCreated ? "created" : importResult.mappingReused ? "reused" : "updated"} mapping`,
          )
        } else {
          unmatchedCourses++
          totalErrors++

          results.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            courseName: course.name,
            status: "error",
            error: importResult.error,
          })

          console.log(
            `[v0] ✗ ${tournament.name}: ${importResult.error || "Unknown error"}`,
          )
        }
      } catch (error) {
        totalErrors++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"

        results.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          courseName: hostCourseLink.course.name,
          status: "error",
          error: errorMessage,
        })

        console.log(
          `[v0] ✗ ${tournament.name}: Exception - ${errorMessage}`,
        )
      }
    }

    // Step 5: Generate summary
    const durationMs = Date.now() - startTime
    const successCount = mappingsCreated + mappingsReused + mappingsUpdated
    const failureCount = unmatchedCourses
    const ok = failureCount === 0

    const summary =
      `Scanned ${tournamentsScanned} tournaments, ` +
      `${tournamentsWithCourses} had courses, ` +
      `created ${mappingsCreated} new mappings, ` +
      `reused ${mappingsReused} verified, ` +
      `updated ${mappingsUpdated}, ` +
      `unmatched ${unmatchedCourses}, ` +
      `errors ${totalErrors}`

    console.log("[v0] ╔════════════════════════════════════════════════════════╗")
    console.log("[v0] ║  TOURNAMENT → COURSE MAPPING ORCHESTRATION COMPLETE    ║")
    console.log("[v0] ╠════════════════════════════════════════════════════════╣")
    console.log(`[v0] ║ Duration: ${durationMs}ms`)
    console.log(
      `[v0] ║ Status: ${ok ? "✓ SUCCESS (no unmatched courses)" : "⚠ COMPLETED WITH ERRORS"}`,
    )
    console.log(
      "[v0] ├────────────────────────────────────────────────────────┤",
    )
    console.log(`[v0] ║ Tournaments scanned:      ${tournamentsScanned}`)
    console.log(`[v0] ║ With host courses:        ${tournamentsWithCourses}`)
    console.log(`[v0] ║ Skipped (no course):      ${skippedTournaments}`)
    console.log(
      "[v0] ├────────────────────────────────────────────────────────┤",
    )
    console.log(`[v0] ║ Mappings created:         ${mappingsCreated}`)
    console.log(`[v0] ║ Mappings reused:          ${mappingsReused}`)
    console.log(`[v0] ║ Mappings updated:         ${mappingsUpdated}`)
    console.log(`[v0] ║ Unmatched courses:        ${unmatchedCourses}`)
    console.log(`[v0] ║ Total errors:             ${totalErrors}`)
    console.log("[v0] ╚════════════════════════════════════════════════════════╝")

    return {
      ok,
      tournamentsScanned,
      tournamentsWithCourses,
      mappingsCreated,
      mappingsUpdated,
      mappingsReused,
      unmatchedCourses,
      skippedTournaments,
      totalErrors,
      durationMs,
      results,
      summary,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const durationMs = Date.now() - startTime

    console.log("[v0] ╔════════════════════════════════════════════════════════╗")
    console.log("[v0] ║  ORCHESTRATION FAILED                                 ║")
    console.log(`[v0] ║ Error: ${errorMessage}`)
    console.log("[v0] ╚════════════════════════════════════════════════════════╝")

    return {
      ok: false,
      tournamentsScanned,
      tournamentsWithCourses,
      mappingsCreated,
      mappingsUpdated,
      mappingsReused,
      unmatchedCourses,
      skippedTournaments,
      totalErrors: 1,
      durationMs,
      results,
      summary: `Orchestration failed: ${errorMessage}`,
    }
  }
}
