import type { PrismaClient } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"
import { GolfCourseAPIClient, type GolfCourseDetail } from "@/lib/providers/golfcourseapi/client"
import { getCourseDetailsRepository, type CourseDetailsInput } from "@/lib/repositories/course-details-repository"
import { getCourseHoleRepository, type CourseHoleInput } from "@/lib/repositories/course-hole-repository"
import { getCourseTeeRepository, type CourseTeeInput } from "@/lib/repositories/course-tee-repository"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { getImportRunRepository } from "@/lib/repositories/import-run-repository"
import { getCourseAddressRepository, type CourseAddressInput } from "@/lib/repositories/course-address-repository"
import { getCourseCoordinatesRepository, type CourseCoordinatesInput } from "@/lib/repositories/course-coordinates-repository"
import { getCourseSpecificationsRepository, type CourseSpecificationsInput } from "@/lib/repositories/course-specifications-repository"
import { getCourseMetadataRepository, type CourseMetadataInput } from "@/lib/repositories/course-metadata-repository"
import { getPlayingConditionsRepository, type PlayingConditionsInput } from "@/lib/repositories/playing-conditions-repository"
import { getTeeHoleYardageRepository, type TeeHoleYardageInput } from "@/lib/repositories/tee-hole-yardage-repository"
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
  // Phase 13.1: Normalized entities
  const courseAddressRepo = getCourseAddressRepository(prisma)
  const courseCoordinatesRepo = getCourseCoordinatesRepository(prisma)
  const courseSpecificationsRepo = getCourseSpecificationsRepository(prisma)
  const courseMetadataRepo = getCourseMetadataRepository(prisma)
  const playingConditionsRepo = getPlayingConditionsRepository(prisma)
  const teeHoleYardageRepo = getTeeHoleYardageRepository(prisma)

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
  // Phase 13.1: Normalized entities
  let addressesImported = 0
  let addressesUpdated = 0
  let coordinatesImported = 0
  let coordinatesUpdated = 0
  let specificationsImported = 0
  let specificationsUpdated = 0
  let metadataImported = 0
  let metadataUpdated = 0
  let playingConditionsImported = 0
  let teeHoleYardagesImported = 0
  let intelligenceAnalyzed = 0
  let intelligenceGenerated = 0
  let insightsGenerated = 0
  let explanationsGenerated = 0
  const warnings: string[] = []
  const failures: string[] = []

  console.log(`[v0] Starting course intelligence import: ${jobId}`)

  try {
    // =========================================================================
    // Fetch verified mappings (throws RepositoryError on database failure)
    let mappings: TournamentCourseMapping[]
    try {
      mappings = await mappingRepo.findVerified()
    } catch (error) {
      logger.error("Failed to fetch verified mappings", { error: String(error) })
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

    // Early return if no verified mappings found
    if (mappings.length === 0) {
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

        // Phase 13.1: Prepare normalized course details (only basic info)
        const courseDetailsInput: CourseDetailsInput = {
          externalCourseId: String(courseDetail.id),
          courseName: courseDetail.name,
          clubName: courseDetail.clubName,
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

          // Phase 13.1: Import normalized entities
          
          // Import CourseAddress
          if (courseDetail.address) {
            const addressInput: CourseAddressInput = {
              courseId,
              city: courseDetail.address.city,
              state: courseDetail.address.state,
              country: courseDetail.address.country,
              website: courseDetail.contact?.website,
              phone: courseDetail.contact?.phone,
            }
            const addressResult = await courseAddressRepo.upsert(addressInput)
            if (addressResult.outcome === "ok") {
              if (addressResult.message === "inserted") addressesImported++
              else addressesUpdated++
            } else {
              warnings.push(`Failed to import address for ${courseDetail.name}`)
            }
          }

          // Import CourseCoordinates
          if (courseDetail.coordinates) {
            const coordinatesInput: CourseCoordinatesInput = {
              courseId,
              latitude: courseDetail.coordinates.latitude,
              longitude: courseDetail.coordinates.longitude,
              elevation: courseDetail.playingConditions?.elevation,
            }
            const coordResult = await courseCoordinatesRepo.upsert(coordinatesInput)
            if (coordResult.outcome === "ok") {
              if (coordResult.message === "inserted") coordinatesImported++
              else coordinatesUpdated++
            } else {
              warnings.push(`Failed to import coordinates for ${courseDetail.name}`)
            }
          }

          // Import CourseSpecifications
          if (courseDetail.specifications) {
            const specsInput: CourseSpecificationsInput = {
              courseId,
              par: courseDetail.specifications.par,
              totalYardage: courseDetail.specifications.totalYardage,
              courseRating: courseDetail.specifications.courseRating,
              slopeRating: courseDetail.specifications.slopeRating,
            }
            const specsResult = await courseSpecificationsRepo.upsert(specsInput)
            if (specsResult.outcome === "ok") {
              if (specsResult.message === "inserted") specificationsImported++
              else specificationsUpdated++
            } else {
              warnings.push(`Failed to import specifications for ${courseDetail.name}`)
            }
          }

          // Import CourseMetadata
          if (courseDetail.metadata) {
            const metaInput: CourseMetadataInput = {
              courseId,
              architect: courseDetail.metadata.architect,
              yearBuilt: courseDetail.metadata.yearBuilt,
              courseStyle: courseDetail.metadata.courseStyle,
              drivingRange: courseDetail.facilities?.drivingRange,
              puttingGreen: courseDetail.facilities?.puttingGreen,
              shortGameArea: courseDetail.facilities?.shortGameArea,
            }
            const metaResult = await courseMetadataRepo.upsert(metaInput)
            if (metaResult.outcome === "ok") {
              if (metaResult.message === "inserted") metadataImported++
              else metadataUpdated++
            } else {
              warnings.push(`Failed to import metadata for ${courseDetail.name}`)
            }
          }

          // Import PlayingConditions (may have multiple historical records)
          if (courseDetail.playingConditions) {
            const playingInput: PlayingConditionsInput = {
              courseId,
              grassTypeFairway: courseDetail.playingConditions.grassTypeFairway,
              grassTypeGreen: courseDetail.playingConditions.grassTypeGreen,
              greenSize: courseDetail.playingConditions.greenSize,
              greenSpeed: courseDetail.playingConditions.greenSpeed,
            }
            const playingResult = await playingConditionsRepo.create(playingInput)
            if (playingResult.outcome === "ok") {
              playingConditionsImported++
            } else {
              warnings.push(`Failed to import playing conditions for ${courseDetail.name}`)
            }
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

              // Phase 13.1: Import TeeHoleYardage (per-tee yardages for each hole)
              // Each tee has per-hole yardage data
              for (const tee of courseDetail.tees) {
                const teeRecord = await courseTeeRepo.findByTeeName(courseId, tee.name)
                if (teeRecord && tee.holes && tee.holes.length > 0) {
                  const yardages: TeeHoleYardageInput[] = tee.holes.map((holeYardage) => ({
                    teeId: teeRecord.id,
                    holeId: "", // Will be filled by hole lookup
                    courseId,
                    yardage: holeYardage.yardage,
                    handicap: holeYardage.handicap,
                  }))

                  // Match holes to hole IDs
                  const holesForCourse = await courseHoleRepo.findByCourseId(courseId)
                  const yardagesWithHoleIds = yardages.map((y) => ({
                    ...y,
                    holeId:
                      holesForCourse.find((h) => h.holeNumber === (tee.holes?.indexOf(tee.holes[yardages.indexOf(y)]) ?? 0) + 1)?.id || "",
                  }))

                  const yardageResult = await teeHoleYardageRepo.bulkUpsert(yardagesWithHoleIds)
                  if (yardageResult.outcome === "ok") {
                    teeHoleYardagesImported += yardageResult.inserted
                  }
                }
              }
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
