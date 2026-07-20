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
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { findBestMatch } from "@/lib/domain/course/matcher"
import type { PrismaClient } from "@/lib/generated/prisma/client"

export interface TournamentCourseMappingOrchestrationResult {
  ok: boolean
  tournamentCoursesProcessed: number
  mappingRowsCreated: number
  golfCourseApiMatchesFound: number
  golfCourseApiUnmatched: number
  mappingsUpdated: number
  mappingsReused: number
  skippedTournaments: number
  totalErrors: number
  durationMs: number
  results: TournamentCourseMappingOrchestrationItem[]
  summary: string
  firstErrorMessage?: string
  firstErrorCause?: string
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
  let tournamentCoursesProcessed = 0
  let mappingRowsCreated = 0
  let golfCourseApiMatchesFound = 0
  let golfCourseApiUnmatched = 0
  let mappingsUpdated = 0
  let mappingsReused = 0
  let skippedTournaments = 0
  let totalErrors = 0
  let firstErrorMessage: string | undefined
  let firstErrorCause: string | undefined

  console.log("[v0] ╔════════════════════════════════════════════════════════╗")
  console.log(
    "[v0] ║  TOURNAMENT → COURSE MAPPING ORCHESTRATION STARTING      ║",
  )
  console.log("[v0] ╚════════════════════════════════════════════════════════╝")
  console.log("[v0] Tournament Course Orchestration Started")

  try {
    // Step 1: Query all tournament courses (not just tournaments with host courses)
    console.log("[v0] Step 1: Fetching all tournament courses...")
    console.log("[v0] START: prisma.tournamentCourse.findMany")

    const allTournamentCourses = await prisma.tournamentCourse.findMany({
      where: {
        tournament: { active: true },
        hostCourse: true,
      },
      include: {
        tournament: true,
        course: true,
      },
      orderBy: { tournament: { name: "asc" } },
    })

    console.log("[v0] END: prisma.tournamentCourse.findMany")
    tournamentCoursesProcessed = allTournamentCourses.length
    console.log(`[v0] Found ${tournamentCoursesProcessed} active tournament courses`)

    // Initialize repositories and client
    const mappingRepo = getTournamentCourseMappingRepository(prisma)
    const apiKey = process.env.GOLFCOURSE_API_KEY
    if (!apiKey) {
      throw new Error("GOLFCOURSE_API_KEY not set")
    }
    const client = new GolfCourseAPIClient(apiKey)

    // Step 2: Process each tournament course
    console.log("[v0] Step 2: Creating/updating mappings for all tournament courses...")

    for (let i = 0; i < allTournamentCourses.length; i++) {
      const tournamentCourse = allTournamentCourses[i]
      const tournament = tournamentCourse.tournament
      const course = tournamentCourse.course

      console.log(`[v0] LOOP ITERATION ${i + 1}/${allTournamentCourses.length}: ${tournament.name}`)

      if (!course) {
        console.log(`[v0] Skipping tournament ${tournament.name}: no course found`)
        skippedTournaments++
        continue
      }

      try {
        console.log(
          `[v0] Processing ${tournament.name} → ${course.name} (tournament ${tournament.id})...`,
        )

        // Check if mapping already exists
        console.log(`[v0] START: mappingRepo.findByTournamentId(${tournament.id})`)
        const existingMappingResult = await mappingRepo.findByTournamentId(tournament.id)
        console.log(`[v0] END: mappingRepo.findByTournamentId(${tournament.id})`)
        const existingMapping = existingMappingResult.outcome === "ok" ? existingMappingResult.record : null

        if (existingMapping) {
          if (existingMapping.verified) {
            // Reuse verified mapping
            mappingsReused++
            results.push({
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              courseName: course.name,
              status: "success",
              mappingReused: true,
              confidence: existingMapping.matchConfidence ?? 0,
            })
            console.log(
              `[v0] ✓ ${tournament.name}: reused verified mapping (confidence=${existingMapping.matchConfidence}%)`,
            )
            continue
          } else {
            // Mapping exists but unverified, will update it below
            console.log(`[v0] Mapping exists but unverified for ${tournament.name}, will update`)
          }
        }

        // Try to find GolfCourse API match
        const sportsDataCourseData = {
          name: course.name,
          clubName: course.name,
          city: course.city || undefined,
          state: course.stateProvince || undefined,
          country: course.country || undefined,
        }

        let golfCourseApiCourseId: number | null = null
        let confidence = 0
        let matchedBy = "manual"

        try {
          console.log(`[v0] START: GolfCourseAPI.searchCourses("${course.name}")`)
          const searchResults = await client.searchCourses(course.name)
          console.log(`[v0] END: GolfCourseAPI.searchCourses("${course.name}") - ${searchResults?.length || 0} results`)

          if (searchResults && searchResults.length > 0) {
            const bestMatch = findBestMatch(sportsDataCourseData, searchResults)
            if (bestMatch) {
              golfCourseApiCourseId = bestMatch.courseId
              confidence = bestMatch.confidence
              matchedBy = bestMatch.matchedBy
              golfCourseApiMatchesFound++
              console.log(
                `[v0] Found GolfCourseAPI match: ${course.name} → courseId ${golfCourseApiCourseId} (confidence=${confidence}%)`,
              )
            } else {
              golfCourseApiUnmatched++
              console.log(
                `[v0] No suitable GolfCourseAPI match for ${course.name} (confidence threshold not met)`,
              )
            }
          } else {
            golfCourseApiUnmatched++
            console.log(`[v0] No GolfCourseAPI courses found for search: "${course.name}"`)
          }
        } catch (searchError) {
          golfCourseApiUnmatched++
          const searchErrorMsg = searchError instanceof Error ? searchError.message : "unknown error"
          const searchErrorStack = searchError instanceof Error ? searchError.stack : ""
          console.log(
            `[v0] Error searching GolfCourseAPI for ${course.name} (tournament ${tournament.id}): ${searchErrorMsg}`,
          )
          console.log(`[v0] Search error stack: ${searchErrorStack}`)
        }

        // Create or update mapping (regardless of whether GolfCourseAPI match was found)
        if (existingMapping) {
          // Update existing unverified mapping
          console.log(`[v0] START: mappingRepo.update(${tournament.id})`)
          
          // Auto-verify if confidence >= 95% (for updates that weren't previously verified)
          const shouldAutoVerify = !existingMapping.verified && confidence >= 95
          console.log(`[v0] Confidence: ${confidence}% - Auto-verify: ${shouldAutoVerify ? "YES" : "NO"}`)
          
          const updateResult = await mappingRepo.update(tournament.id, {
            golfCourseApiCourseId: golfCourseApiCourseId || undefined,
            tournamentCourseName: course.name,
            golfCourseCourseName: course.name,
            matchConfidence: confidence,
            matchedBy,
            verified: shouldAutoVerify ? true : false,
            autoVerified: shouldAutoVerify,
          })
          console.log(`[v0] END: mappingRepo.update(${tournament.id}) - outcome: ${updateResult.outcome}`)

          if (updateResult.outcome === "ok") {
            mappingsUpdated++
            console.log(
              `[v0] ✓ Updated mapping for ${tournament.name} (golfCourseApiId=${golfCourseApiCourseId || "null"})`,
            )
          } else {
            totalErrors++
            console.log(`[v0] ✗ Failed to update mapping for ${tournament.name}: ${updateResult.error.message}`)
          }
        } else {
          // Create new mapping
          console.log(`[v0] START: mappingRepo.create(${tournament.id})`)
          
          // Auto-verify if confidence >= 95%
          const shouldAutoVerify = confidence >= 95
          console.log(`[v0] Confidence: ${confidence}% - Auto-verify: ${shouldAutoVerify ? "YES" : "NO"}`)
          
          const createResult = await mappingRepo.create({
            tournamentId: tournament.id,
            sportsDataIoCourseId: undefined,
            golfCourseApiCourseId: golfCourseApiCourseId || null, // Only populate if match found; null otherwise
            tournamentCourseName: course.name,
            golfCourseCourseName: course.name,
            matchConfidence: confidence,
            matchedBy,
            verified: shouldAutoVerify,
            autoVerified: shouldAutoVerify,
          })
          console.log(`[v0] END: mappingRepo.create(${tournament.id}) - outcome: ${createResult.outcome}`)

          if (createResult.outcome === "ok") {
            mappingRowsCreated++
            console.log(
              `[v0] ✓ Created mapping for ${tournament.name} (golfCourseApiId=${golfCourseApiCourseId || "null"})`,
            )
          } else {
            totalErrors++
            console.log(`[v0] ✗ Failed to create mapping for ${tournament.name}: ${createResult.error.message}`)
          }
        }

        results.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          courseName: course.name,
          status: "success",
          mappingCreated: !existingMapping,
          confidence,
        })
      } catch (error) {
        totalErrors++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        const errorStack = error instanceof Error ? error.stack : ""

        // Capture first error for UI reporting
        if (!firstErrorMessage) {
          firstErrorMessage = errorMessage
          firstErrorCause = errorStack
        }

        results.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          courseName: course.name,
          status: "error",
          error: errorMessage,
        })

        console.log(
          `[v0] ✗ ${tournament.name} (id: ${tournament.id}): Exception - ${errorMessage}`,
        )
        console.log(`[v0] ✗ Stack trace: ${errorStack}`)
      }
    }

    // Step 3: Generate summary
    console.log("[v0] LOOP COMPLETED - All tournament courses processed")
    const durationMs = Date.now() - startTime
    const ok = totalErrors === 0

    const summary =
      `Processed ${tournamentCoursesProcessed} tournament courses, ` +
      `created ${mappingRowsCreated} mapping rows, ` +
      `found ${golfCourseApiMatchesFound} GolfCourseAPI matches, ` +
      `unmatched ${golfCourseApiUnmatched}, ` +
      `reused ${mappingsReused} verified, ` +
      `updated ${mappingsUpdated}, ` +
      `errors ${totalErrors}`

    console.log("[v0] ╔════════════════════════════════════════════════════════╗")
    console.log("[v0] ║  TOURNAMENT → COURSE MAPPING ORCHESTRATION COMPLETE    ║")
    console.log("[v0] ╠════════════════════════════════════════════════════════╣")
    console.log(`[v0] ║ Duration: ${durationMs}ms`)
    console.log(
      `[v0] ║ Status: ${ok ? "✓ SUCCESS" : "⚠ COMPLETED WITH ERRORS"}`,
    )
    console.log(
      "[v0] ├────────────────────────────────────────────────────────┤",
    )
    console.log(`[v0] ║ Tournament courses processed:  ${tournamentCoursesProcessed}`)
    console.log(`[v0] ║ Mapping rows created:          ${mappingRowsCreated}`)
    console.log(`[v0] ║ GolfCourseAPI matches found:   ${golfCourseApiMatchesFound}`)
    console.log(`[v0] ║ GolfCourseAPI unmatched:       ${golfCourseApiUnmatched}`)
    console.log(`[v0] ║ Mappings reused (verified):    ${mappingsReused}`)
    console.log(`[v0] ║ Mappings updated:              ${mappingsUpdated}`)
    console.log(`[v0] ║ Total errors:                  ${totalErrors}`)
    console.log("[v0] ╚════════════════════════════════════════════════════════╝")

    return {
      ok,
      tournamentCoursesProcessed,
      mappingRowsCreated,
      golfCourseApiMatchesFound,
      golfCourseApiUnmatched,
      mappingsUpdated,
      mappingsReused,
      skippedTournaments,
      totalErrors,
      durationMs,
      results,
      summary,
      firstErrorMessage,
      firstErrorCause,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : ""
    const durationMs = Date.now() - startTime

    console.log("[v0] ╔════════════════════════════════════════════════════════╗")
    console.log("[v0] ║  ORCHESTRATION FAILED                                 ║")
    console.log(`[v0] ║ Error: ${errorMessage}`)
    console.log(`[v0] ║ Stack: ${errorStack}`)
    console.log("[v0] ╚════════════════════════════════════════════════════════╝")

    return {
      ok: false,
      tournamentCoursesProcessed,
      mappingRowsCreated,
      golfCourseApiMatchesFound,
      golfCourseApiUnmatched,
      mappingsUpdated,
      mappingsReused,
      skippedTournaments,
      totalErrors: 1,
      durationMs,
      results,
      summary: `Orchestration failed: ${errorMessage}`,
      firstErrorMessage: errorMessage,
      firstErrorCause: errorStack,
    }
  }
}
