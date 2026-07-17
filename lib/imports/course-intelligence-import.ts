import type { PrismaClient } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"
import { GolfCourseAPIClient, type GolfCourseDetail } from "@/lib/providers/golfcourseapi/client"
import { getCourseDetailsRepository, type CourseDetailsInput } from "@/lib/repositories/course-details-repository"
import { getCourseHoleRepository, type CourseHoleInput } from "@/lib/repositories/course-hole-repository"
import { getCourseTeeRepository, type CourseTeeInput } from "@/lib/repositories/course-tee-repository"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { getImportRunRepository } from "@/lib/repositories/import-run-repository"
import type { CourseImportSummary } from "@/lib/types/course-import"
import { generateImportJobId } from "@/lib/types/import-summary"
import { persistCourseIntelligence } from "@/lib/course-intelligence/service"
import { generateAndPersistInsights } from "@/lib/course-intelligence/insights"
import { generateAndPersistExplanations } from "@/lib/course-intelligence/explanations"

/**
 * Validate course data has required fields and structure.
 */
function validateCourseData(
  course: GolfCourseDetail,
  warnings: string[],
): { isValid: boolean; holeCount: number; teeCount: number } {
  let isValid = true
  const holeCount = course.holes?.length ?? 0
  const teeCount = course.tees?.length ?? 0

  // Validate holes
  if (holeCount === 0) {
    warnings.push(`Course ${course.name} has no holes`)
  } else if (holeCount !== 18) {
    warnings.push(`Course ${course.name} has ${holeCount} holes, expected 18`)
  }

  // Check for duplicate hole numbers
  if (course.holes) {
    const holeNumbers = new Set<number>()
    for (const hole of course.holes) {
      if (holeNumbers.has(hole.number)) {
        warnings.push(`Course ${course.name}: duplicate hole number ${hole.number}`)
      }
      holeNumbers.add(hole.number)
    }
  }

  // Check for duplicate tee names
  if (course.tees) {
    const teeNames = new Set<string>()
    for (const tee of course.tees) {
      if (teeNames.has(tee.name)) {
        warnings.push(`Course ${course.name}: duplicate tee name "${tee.name}"`)
      }
      teeNames.add(tee.name)
    }
  }

  if (teeCount === 0) {
    warnings.push(`Course ${course.name} has no tee boxes`)
  }

  return { isValid: true, holeCount, teeCount }
}

/**
 * Import course intelligence for all verified tournament course mappings.
 */
export async function importCourseIntelligence(
  client?: GolfCourseAPIClient,
  prisma: PrismaClient = prismaClient,
): Promise<CourseImportSummary> {
  const jobId = generateImportJobId("COURSE")
  const startedAt = new Date()
  const apiClient = client || new GolfCourseAPIClient()
  const mappingRepo = getTournamentCourseMappingRepository(prisma)
  const courseDetailsRepo = getCourseDetailsRepository(prisma)
  const courseHoleRepo = getCourseHoleRepository(prisma)
  const courseTeeRepo = getCourseTeeRepository(prisma)
  const importRunRepo = getImportRunRepository(prisma)

  let coursesConsidered = 0
  let coursesMatched = 0
  let coursesImported = 0
  let coursesUpdated = 0
  let coursesSkipped = 0
  let holesImported = 0
  let holesUpdated = 0
  let holesSkipped = 0
  let teeBoxesImported = 0
  let teeBoxesUpdated = 0
  let teeBoxesSkipped = 0
  let intelligenceAnalyzed = 0
  let intelligenceGenerated = 0
  let insightsGenerated = 0
  let explanationsGenerated = 0
  const warnings: string[] = []
  const failures: string[] = []

  console.log(`[v0] Starting course intelligence import: ${jobId}`)

  try {
    // =========================================================================
    // INVESTIGATION: TRACE ALL FILTERS AND COUNTS
    // =========================================================================
    console.log(`\n[v0] ╔════════════════════════════════════════════════════════╗`)
    console.log(`[v0] ║  COURSE INTELLIGENCE IMPORT - FILTERING PIPELINE TRACE  ║`)
    console.log(`[v0] ║  Job ID: ${jobId.padEnd(40)} ║`)
    console.log(`[v0] ╚════════════════════════════════════════════════════════╝\n`)

    // STEP 1: Query total tournament_course_mapping records (unfiltered)
    console.log(`[v0] STEP 1: Load all tournament_course_mappings (no filter)`)
    const allMappingsRaw = await prisma.tournamentCourseMapping.findMany()
    console.log(`[v0]   Count: ${allMappingsRaw.length} records`)
    console.log(`[v0]   SQL Equivalent: SELECT * FROM tournament_course_mapping`)
    if (allMappingsRaw.length > 0) {
      console.log(`[v0]   First 10 records:`)
      allMappingsRaw.slice(0, 10).forEach((m, i) => {
        console.log(`[v0]     [${i}] tournament=${m.tournamentId}, courseId=${m.golfCourseApiCourseId}, verified=${m.verified}, lastSynced=${m.lastSyncedAt}`)
      })
    }

    // STEP 2: Show the verified breakdown BEFORE filtering
    console.log(`\n[v0] STEP 2: Analyze verified status breakdown`)
    const verifiedRecords = allMappingsRaw.filter(m => m.verified === true)
    const unverifiedRecords = allMappingsRaw.filter(m => m.verified === false)
    const nullVerifiedRecords = allMappingsRaw.filter(m => m.verified === null)
    console.log(`[v0]   verified = true:  ${verifiedRecords.length} records`)
    console.log(`[v0]   verified = false: ${unverifiedRecords.length} records`)
    console.log(`[v0]   verified = null:  ${nullVerifiedRecords.length} records`)
    console.log(`[v0]   Total: ${verifiedRecords.length + unverifiedRecords.length + nullVerifiedRecords.length}`)

    if (unverifiedRecords.length > 0) {
      console.log(`[v0]   First 10 UNVERIFIED records (the ones being filtered OUT):`)
      unverifiedRecords.slice(0, 10).forEach((m, i) => {
        console.log(`[v0]     [${i}] tournament=${m.tournamentId}, courseId=${m.golfCourseApiCourseId}, verified=${m.verified}`)
      })
    }

    // STEP 3: Apply the verified filter (this is where records disappear)
    console.log(`\n[v0] STEP 3: Apply findVerified() filter`)
    console.log(`[v0]   Filter applied: WHERE verified = true`)
    const mappingsResult = await mappingRepo.findVerified()
    console.log(`[v0]   Records AFTER filter: ${mappingsResult.records?.length ?? 0}`)
    console.log(`[v0]   Outcome: ${mappingsResult.outcome}`)

    if (mappingsResult.records && mappingsResult.records.length > 0) {
      console.log(`[v0]   First 5 verified records returned:`)
      mappingsResult.records.slice(0, 5).forEach((m, i) => {
        console.log(`[v0]     [${i}] tournament=${m.tournamentId}, courseId=${m.golfCourseApiCourseId}, verified=${m.verified}`)
      })
    } else {
      console.log(`[v0]   ❌ NO RECORDS MATCHED THE VERIFIED FILTER`)
      console.log(`[v0]   Reason: All 205 mappings have verified=false, but findVerified() requires verified=true`)
    }

    // STEP 4: Check early return
    console.log(`\n[v0] STEP 4: Early return check`)
    if (mappingsResult.outcome !== "ok" || !mappingsResult.records || mappingsResult.records.length === 0) {
      console.log(`[v0] ❌ EARLY RETURN TRIGGERED`)
      console.log(`[v0]    Condition: mappingsResult.outcome !== "ok" OR !mappingsResult.records OR records.length === 0`)
      console.log(`[v0]    Outcome: ${mappingsResult.outcome}`)
      console.log(`[v0]    Has records: ${!!mappingsResult.records}`)
      console.log(`[v0]    Length: ${mappingsResult.records?.length ?? 0}`)
      console.log(`[v0]    → Returning with coursesConsidered: 0`)
      console.log(`[v0]\n[v0] ╔════════════════════════════════════════════════════════╗`)
      console.log(`[v0] ║  ROOT CAUSE IDENTIFIED                                  ║`)
      console.log(`[v0] ║  No verified mappings exist in database                  ║`)
      console.log(`[v0] ║  All 205 mappings have verified=false                    ║`)
      console.log(`[v0] ║  importCourseIntelligence requires verified=true         ║`)
      console.log(`[v0] ║  Result: coursesConsidered = 0                           ║`)
      console.log(`[v0] ╚════════════════════════════════════════════════════════╝\n`)
      const finishedAt = new Date()
      const durationMs = finishedAt.getTime() - startedAt.getTime()
      return {
        jobId,
        startedAt,
        completedAt: finishedAt,
        durationMs,
        coursesConsidered: 0,
        coursesMatched: 0,
        coursesImported: 0,
        coursesUpdated: 0,
        coursesSkipped: 0,
        holesImported: 0,
        holesUpdated: 0,
        holesSkipped: 0,
        teeBoxesImported: 0,
        teeBoxesUpdated: 0,
        teeBoxesSkipped: 0,
        intelligenceAnalyzed: 0,
        intelligenceGenerated: 0,
        insightsGenerated: 0,
        explanationsGenerated: 0,
        throughputPerSecond: 0,
        warnings,
        failures,
      }
    }

    const mappings = mappingsResult.records
    coursesConsidered = mappings.length
    coursesMatched = mappings.length

    // Process each mapping
    for (const mapping of mappings) {
      const golfCourseApiId = mapping.golfCourseApiCourseId

      try {
        // Fetch course details from GolfCourse API
        console.log(`[v0] Fetching course intelligence for GolfCourse API ID: ${golfCourseApiId}`)
        const courseDetail = await apiClient.fetchCourse(golfCourseApiId)

        if (!courseDetail) {
          const err = `Course not found for GolfCourse API ID ${golfCourseApiId}`
          failures.push(err)
          continue
        }

        // Validate course data
        const validation = validateCourseData(courseDetail, warnings)
        console.log(
          `[v0] Course ${courseDetail.name}: ${validation.holeCount} holes, ${validation.teeCount} tees`,
        )

        // Prepare course details input
        const courseDetailsInput: CourseDetailsInput = {
          externalCourseId: String(courseDetail.id),
          courseName: courseDetail.name,
          clubName: courseDetail.clubName,
          city: courseDetail.address?.city,
          state: courseDetail.address?.state,
          country: courseDetail.address?.country,
          latitude: courseDetail.coordinates?.latitude,
          longitude: courseDetail.coordinates?.longitude,
          website: courseDetail.contact?.website,
          phone: courseDetail.contact?.phone,
          par: courseDetail.specifications?.par,
          totalYardage: courseDetail.specifications?.totalYardage,
          courseRating: courseDetail.specifications?.courseRating,
          slopeRating: courseDetail.specifications?.slopeRating,
          architect: courseDetail.metadata?.architect,
          yearBuilt: courseDetail.metadata?.yearBuilt,
          courseStyle: courseDetail.metadata?.courseStyle,
          grassTypeFairway: courseDetail.playingConditions?.grassTypeFairway,
          grassTypeGreen: courseDetail.playingConditions?.grassTypeGreen,
          greenSize: courseDetail.playingConditions?.greenSize,
          greenSpeed: courseDetail.playingConditions?.greenSpeed,
          elevation: courseDetail.playingConditions?.elevation,
          drivingRange: courseDetail.facilities?.drivingRange,
          puttingGreen: courseDetail.facilities?.puttingGreen,
          shortGameArea: courseDetail.facilities?.shortGameArea,
        }

        // Upsert course details
        const courseResult = await courseDetailsRepo.upsert(courseDetailsInput)
        if (courseResult.outcome === "ok") {
          const isNew = courseResult.message === "inserted"
          if (isNew) {
            coursesImported++
            console.log(`[v0] Course imported: ${courseDetail.name}`)
          } else {
            coursesUpdated++
            console.log(`[v0] Course updated: ${courseDetail.name}`)
          }

          const courseId = courseResult.record?.id
          if (!courseId) {
            throw new Error("Course ID not returned from upsert")
          }

          // Delete existing holes and tees (for clean refresh)
          await courseHoleRepo.deleteForCourse(courseId)
          await courseTeeRepo.deleteForCourse(courseId)

          // Import holes
          if (courseDetail.holes && courseDetail.holes.length > 0) {
            const holes: CourseHoleInput[] = courseDetail.holes.map((hole) => ({
              courseId,
              holeNumber: hole.number,
              par: hole.par,
              yardage: hole.yardage,
              handicap: hole.handicap,
            }))

            const holesResult = await courseHoleRepo.bulkUpsert(holes)
            if (holesResult.outcome === "ok") {
              holesImported += holesResult.inserted
              holesUpdated += holesResult.updated
            } else {
              warnings.push(`Failed to import holes for ${courseDetail.name}`)
            }
          }

          // Import tees
          if (courseDetail.tees && courseDetail.tees.length > 0) {
            const tees: CourseTeeInput[] = courseDetail.tees.map((tee) => ({
              courseId,
              teeName: tee.name,
              teeColor: tee.color,
              gender: tee.gender,
              yardage: tee.yardage,
              rating: tee.rating,
              slope: tee.slope,
            }))

            const teesResult = await courseTeeRepo.bulkUpsert(tees)
            if (teesResult.outcome === "ok") {
              teeBoxesImported += teesResult.inserted
              teeBoxesUpdated += teesResult.updated
            } else {
              warnings.push(`Failed to import tees for ${courseDetail.name}`)
            }
          }

          // Generate and persist course intelligence
          try {
            intelligenceAnalyzed++
            const intelligence = await persistCourseIntelligence(courseId)
            if (intelligence) {
              intelligenceGenerated++
              console.log(`[v0] Course intelligence generated for ${courseDetail.name}`)

              // Generate and persist course insights
              try {
                const insights = await generateAndPersistInsights(courseId)
                if (insights.length > 0) {
                  insightsGenerated += insights.length
                  console.log(`[v0] Generated ${insights.length} insights for ${courseDetail.name}`)

                  // Generate and persist course metric explanations
                  try {
                    const explanations = await generateAndPersistExplanations(courseId)
                    if (explanations.length > 0) {
                      explanationsGenerated += explanations.length
                      console.log(`[v0] Generated ${explanations.length} explanations for ${courseDetail.name}`)
                    }
                  } catch (explanationError) {
                    const errorMsg = explanationError instanceof Error ? explanationError.message : String(explanationError)
                    warnings.push(`Failed to generate explanations for ${courseDetail.name}: ${errorMsg}`)
                  }
                }
              } catch (insightError) {
                const errorMsg = insightError instanceof Error ? insightError.message : String(insightError)
                warnings.push(`Failed to generate insights for ${courseDetail.name}: ${errorMsg}`)
              }
            } else {
              warnings.push(`Could not generate intelligence for ${courseDetail.name}`)
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            warnings.push(`Failed to generate intelligence for ${courseDetail.name}: ${errorMsg}`)
          }

          // Update mapping last synced time
          const updateResult = await mappingRepo.update(mapping.tournamentId, {
            lastSyncedAt: new Date(),
          })
          if (updateResult.outcome === "ok") {
            console.log(`[v0] Mapping updated for ${courseDetail.name}`)
          }
        } else {
          const err = courseResult.error?.message || "Unknown error"
          failures.push(`Failed to upsert GolfCourse API ID ${golfCourseApiId}: ${err}`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        failures.push(`GolfCourse API ID ${golfCourseApiId}: ${errorMsg}`)
      }
    }

    // Record import run
    const finishedAt = new Date()
    const durationMs = finishedAt.getTime() - startedAt.getTime()
    const throughputPerSecond = coursesMatched > 0 ? Number((coursesMatched / (durationMs / 1000)).toFixed(1)) : 0

    const importRunResult = await importRunRepo.create({
      entity: "course-intelligence",
      provider: "golfcourseapi",
      status: failures.length === 0 ? "success" : failures.length < coursesMatched ? "partial" : "failure",
      recordsProcessed: coursesMatched,
      recordsSucceeded: coursesMatched - failures.length,
      recordsFailed: failures.length,
      notes: [
        `Job ID: ${jobId}`,
        `Courses considered: ${coursesConsidered}`,
        `Courses matched: ${coursesMatched}`,
        `Courses imported: ${coursesImported}`,
        `Courses updated: ${coursesUpdated}`,
        `Courses skipped: ${coursesSkipped}`,
        `Holes imported: ${holesImported}`,
        `Holes updated: ${holesUpdated}`,
        `Holes skipped: ${holesSkipped}`,
        `Tee boxes imported: ${teeBoxesImported}`,
        `Tee boxes updated: ${teeBoxesUpdated}`,
        `Tee boxes skipped: ${teeBoxesSkipped}`,
        `Throughput: ${throughputPerSecond} courses/sec`,
        ...warnings,
      ].join("\n"),
    })

    console.log(`[v0] Import ${jobId} completed: ${failures.length === 0 ? "success" : "partial failure"} (${throughputPerSecond} courses/sec)`)

    return {
      jobId,
      startedAt,
      completedAt: finishedAt,
      durationMs,
      coursesConsidered,
      coursesMatched,
      coursesImported,
      coursesUpdated,
      coursesSkipped,
      holesImported,
      holesUpdated,
      holesSkipped,
      teeBoxesImported,
      teeBoxesUpdated,
      teeBoxesSkipped,
      intelligenceAnalyzed,
      intelligenceGenerated,
      insightsGenerated,
      explanationsGenerated,
      throughputPerSecond,
      warnings,
      failures,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    failures.push(`Import failed: ${errorMsg}`)

    const finishedAt = new Date()
    const durationMs = finishedAt.getTime() - startedAt.getTime()
    const throughputPerSecond = coursesMatched > 0 ? Number((coursesMatched / (durationMs / 1000)).toFixed(1)) : 0

    console.error(`[v0] Import ${jobId} failed: ${errorMsg}`)

    return {
      jobId,
      startedAt,
      completedAt: finishedAt,
      durationMs,
      coursesConsidered,
      coursesMatched,
      coursesImported,
      coursesUpdated,
      coursesSkipped,
      holesImported,
      holesUpdated,
      holesSkipped,
      teeBoxesImported,
      teeBoxesUpdated,
      teeBoxesSkipped,
      intelligenceAnalyzed,
      intelligenceGenerated,
      insightsGenerated,
      explanationsGenerated,
      throughputPerSecond,
      warnings,
      failures,
    }
  }
}
