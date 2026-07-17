import type { PrismaClient } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"
import { GolfCourseAPIClient, type GolfCourseDetail } from "@/lib/providers/golfcourseapi/client"
import { getCourseDetailsRepository, type CourseDetailsInput } from "@/lib/repositories/course-details-repository"
import { getCourseHoleRepository, type CourseHoleInput } from "@/lib/repositories/course-hole-repository"
import { getCourseTeeRepository, type CourseTeeInput } from "@/lib/repositories/course-tee-repository"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { getImportRunRepository } from "@/lib/repositories/import-run-repository"
import type { CourseImportSummary } from "@/lib/types/course-import"

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
  let holesImported = 0
  let holesUpdated = 0
  let teeBoxesImported = 0
  let teeBoxesUpdated = 0
  const warnings: string[] = []
  const failures: string[] = []

  try {
    // Get all verified mappings
    const mappingsResult = await mappingRepo.findVerified()
    if (mappingsResult.outcome !== "ok" || !mappingsResult.records || mappingsResult.records.length === 0) {
      const finishedAt = new Date()
      return {
        startedAt,
        completedAt: finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        coursesConsidered: 0,
        coursesMatched: 0,
        coursesImported: 0,
        coursesUpdated: 0,
        holesImported: 0,
        holesUpdated: 0,
        teeBoxesImported: 0,
        teeBoxesUpdated: 0,
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
    const importRunResult = await importRunRepo.create({
      entity: "course-intelligence",
      provider: "golfcourseapi",
      status: failures.length === 0 ? "success" : failures.length < coursesMatched ? "partial" : "failure",
      recordsProcessed: coursesMatched,
      recordsSucceeded: coursesMatched - failures.length,
      recordsFailed: failures.length,
      notes: [
        `Courses considered: ${coursesConsidered}`,
        `Courses matched: ${coursesMatched}`,
        `Courses imported: ${coursesImported}`,
        `Courses updated: ${coursesUpdated}`,
        `Holes imported: ${holesImported}`,
        `Holes updated: ${holesUpdated}`,
        `Tee boxes imported: ${teeBoxesImported}`,
        `Tee boxes updated: ${teeBoxesUpdated}`,
        ...warnings,
      ].join("\n"),
    })

    return {
      startedAt,
      completedAt: finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      coursesConsidered,
      coursesMatched,
      coursesImported,
      coursesUpdated,
      holesImported,
      holesUpdated,
      teeBoxesImported,
      teeBoxesUpdated,
      warnings,
      failures,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    failures.push(`Import failed: ${errorMsg}`)

    const finishedAt = new Date()
    return {
      startedAt,
      completedAt: finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      coursesConsidered,
      coursesMatched,
      coursesImported,
      coursesUpdated,
      holesImported,
      holesUpdated,
      teeBoxesImported,
      teeBoxesUpdated,
      warnings,
      failures,
    }
  }
}
