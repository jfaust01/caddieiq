/**
 * GolfCourse API import service.
 *
 * Downloads course data from GolfCourse API and persists it locally,
 * supporting incremental updates and avoiding duplicates.
 */

import type { PrismaClient } from "@/lib/generated/prisma/client"

import prismaClient from "@/lib/prisma"
import { GolfCourseAPIClient } from "@/lib/providers/golfcourseapi/client"
import { getCourseDetailsRepository } from "@/lib/repositories/course-details-repository"
import { getCourseHoleRepository } from "@/lib/repositories/course-hole-repository"
import { getCourseTeeRepository } from "@/lib/repositories/course-tee-repository"
import { getImportRunRepository } from "@/lib/repositories/import-run-repository"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { findBestMatch } from "@/lib/domain/course/matcher"
import type { CourseImportSummary } from "@/lib/types/course-import"

export interface TournamentCourseImportResult {
  status: "success" | "failure"
  tournamentId: string
  courseName: string
  golfCourseApiCourseId?: number
  mappingCreated: boolean
  mappingReused: boolean
  mappingConfidence?: number
  courseImported: boolean
  holesImported: number
  teesImported: number
  error?: string
}

/**
 * Import a tournament's course from GolfCourse API.
 * Uses the mapping layer to avoid duplicate searches and store course enrichment data.
 *
 * Flow:
 * 1. Check if mapping exists for this tournament
 * 2. If mapping exists and verified, use stored GolfCourse API ID
 * 3. If mapping doesn't exist, search GolfCourse API, select best match, create mapping
 * 4. Import course details, holes, and tees
 */
export async function importTournamentCourse(
  client: GolfCourseAPIClient,
  tournamentId: string,
  sportsDataIoCourseId: string | undefined,
  tournamentCourseName: string,
  sportsDataIoCourseData: {
    name?: string
    clubName?: string
    city?: string
    state?: string
    country?: string
  },
  prisma: PrismaClient = prismaClient,
): Promise<TournamentCourseImportResult> {
  const mappingRepo = getTournamentCourseMappingRepository(prisma)
  const courseDetailsRepo = getCourseDetailsRepository(prisma)
  const courseHoleRepo = getCourseHoleRepository(prisma)
  const courseTeeRepo = getCourseTeeRepository(prisma)

  try {
    // Step 1: Check for existing mapping
    const existingMappingResult = await mappingRepo.findByTournamentId(tournamentId)
    if (existingMappingResult.outcome === "ok" && existingMappingResult.record) {
      const mapping = existingMappingResult.record
      console.log(
        `[v0] Mapping reused for tournament ${tournamentId}: GolfCourse ID ${mapping.golfCourseApiCourseId} (confidence: ${mapping.matchConfidence}%)`,
      )

      // If verified, skip searching and use the mapped course
      if (mapping.verified) {
        console.log(`[v0] Mapping verified, importing course ${mapping.golfCourseApiCourseId}`)
        const importResult = await importGolfCourse(client, mapping.golfCourseApiCourseId, prisma)
        return {
          status: importResult.status === "failure" ? "failure" : "success",
          tournamentId,
          courseName: tournamentCourseName,
          golfCourseApiCourseId: mapping.golfCourseApiCourseId,
          mappingCreated: false,
          mappingReused: true,
          mappingConfidence: mapping.matchConfidence ?? undefined,
          courseImported: importResult.coursesImported > 0,
          holesImported: importResult.holesImported,
          teesImported: importResult.teesImported,
          error: importResult.errors.length > 0 ? importResult.errors[0].error : undefined,
        }
      }
    }

    // Step 2: If no mapping exists, search GolfCourse API
    console.log(`[v0] No mapping found for tournament ${tournamentId}, searching GolfCourse API`)
    const searchResults = await client.searchCourses(tournamentCourseName)

    if (!searchResults || searchResults.length === 0) {
      return {
        status: "failure",
        tournamentId,
        courseName: tournamentCourseName,
        mappingCreated: false,
        mappingReused: false,
        courseImported: false,
        holesImported: 0,
        teesImported: 0,
        error: `No courses found for "${tournamentCourseName}"`,
      }
    }

    // Step 3: Find best match using matcher
    const bestMatch = findBestMatch(sportsDataIoCourseData, searchResults)
    if (!bestMatch) {
      return {
        status: "failure",
        tournamentId,
        courseName: tournamentCourseName,
        mappingCreated: false,
        mappingReused: false,
        courseImported: false,
        holesImported: 0,
        teesImported: 0,
        error: `No suitable match found for "${tournamentCourseName}" (confidence threshold not met)`,
      }
    }

    // Step 4: Create mapping
    console.log(
      `[v0] New mapping created for tournament ${tournamentId}: GolfCourse ID ${bestMatch.courseId} (confidence: ${bestMatch.confidence}%)`,
    )
    await mappingRepo.create({
      tournamentId,
      sportsDataIoCourseId,
      golfCourseApiCourseId: bestMatch.courseId,
      tournamentCourseName,
      golfCourseCourseName: searchResults.find((c) => c.id === bestMatch.courseId)?.name,
      matchConfidence: bestMatch.confidence,
      matchedBy: bestMatch.matchedBy,
      verified: false, // Pending admin verification
    })

    // Step 5: Import course details
    const importResult = await importGolfCourse(client, bestMatch.courseId, prisma)

    return {
      status: importResult.status === "failure" ? "failure" : "success",
      tournamentId,
      courseName: tournamentCourseName,
      golfCourseApiCourseId: bestMatch.courseId,
      mappingCreated: true,
      mappingReused: false,
      mappingConfidence: bestMatch.confidence,
      courseImported: importResult.coursesImported > 0,
      holesImported: importResult.holesImported,
      teesImported: importResult.teesImported,
      error: importResult.errors.length > 0 ? importResult.errors[0].error : undefined,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] Tournament course import failed: ${errorMsg}`)

    return {
      status: "failure",
      tournamentId,
      courseName: tournamentCourseName,
      mappingCreated: false,
      mappingReused: false,
      courseImported: false,
      holesImported: 0,
      teesImported: 0,
      error: errorMsg,
    }
  }
}

/**
 * Import a single course from GolfCourse API.
 */
export async function importGolfCourse(
  client: GolfCourseAPIClient,
  courseId: number,
  prisma: PrismaClient = prismaClient,
): Promise<GolfCourseImportResult> {
  const startedAt = new Date()
  const errors: Array<{ courseId: number; error: string }> = []

  const courseDetailsRepo = getCourseDetailsRepository()
  const courseHoleRepo = getCourseHoleRepository()
  const courseTeeRepo = getCourseTeeRepository()

  try {
    console.log(`[v0] Starting import for GolfCourse ID: ${courseId}`)

    // Fetch course details from API
    const courseDetail = await client.getCourseDetails(courseId)
    if (!courseDetail) {
      const error = `Failed to fetch course details for GolfCourse ID: ${courseId}`
      console.error(`[v0] ${error}`)
      errors.push({ courseId, error })
      return {
        status: "failure",
        coursesProcessed: 1,
        coursesImported: 0,
        holesImported: 0,
        teesImported: 0,
        errors,
        startedAt,
        finishedAt: new Date(),
        durationMs: new Date().getTime() - startedAt.getTime(),
      }
    }

    // Upsert course details
    const address = courseDetail.address || {}
    const contact = courseDetail.contact || {}
    const specs = courseDetail.specifications || {}

    const courseDetailsResult = await courseDetailsRepo.upsert({
      externalCourseId: String(courseDetail.id),
      courseName: courseDetail.name,
      clubName: courseDetail.clubName,
      city: address.city,
      state: address.state,
      country: address.country,
      latitude: courseDetail.coordinates?.latitude,
      longitude: courseDetail.coordinates?.longitude,
      website: contact.website,
      phone: contact.phone,
      par: specs.par,
      totalYardage: specs.totalYardage,
      courseRating: specs.courseRating,
      slopeRating: specs.slopeRating,
    })

    if (courseDetailsResult.outcome === "failed") {
      const error = courseDetailsResult.error?.message || "Unknown error"
      console.error(`[v0] Failed to upsert course details: ${error}`)
      errors.push({ courseId, error })
      return {
        status: "failure",
        coursesProcessed: 1,
        coursesImported: 0,
        holesImported: 0,
        teesImported: 0,
        errors,
        startedAt,
        finishedAt: new Date(),
        durationMs: new Date().getTime() - startedAt.getTime(),
      }
    }

    const persistedCourseId = courseDetailsResult.record?.id
    if (!persistedCourseId) {
      const error = `Failed to retrieve persisted course ID for ${courseDetail.name}`
      console.error(`[v0] ${error}`)
      errors.push({ courseId, error })
      return {
        status: "failure",
        coursesProcessed: 1,
        coursesImported: 0,
        holesImported: 0,
        teesImported: 0,
        errors,
        startedAt,
        finishedAt: new Date(),
        durationMs: new Date().getTime() - startedAt.getTime(),
      }
    }

    // Delete existing holes and tees for this course (to handle updates)
    await courseHoleRepo.deleteForCourse(persistedCourseId)
    await courseTeeRepo.deleteForCourse(persistedCourseId)

    // Import holes
    let holesImported = 0
    if (courseDetail.holes && courseDetail.holes.length > 0) {
      const holesInput = courseDetail.holes.map((hole) => ({
        courseId: persistedCourseId,
        holeNumber: hole.number,
        par: hole.par,
        yardage: hole.yardage,
        handicap: hole.handicap,
      }))

      const holeResult = await courseHoleRepo.bulkUpsert(holesInput)
      holesImported = holeResult.inserted + holeResult.updated
      console.log(
        `[v0] Imported ${holeResult.inserted} new holes, updated ${holeResult.updated}, failed ${holeResult.failed}`,
      )
    }

    // Import tees
    let teesImported = 0
    if (courseDetail.tees && courseDetail.tees.length > 0) {
      const teesInput = courseDetail.tees.map((tee) => ({
        courseId: persistedCourseId,
        teeName: tee.name,
        teeColor: tee.color,
        gender: tee.gender,
        yardage: tee.yardage,
        rating: tee.rating,
        slope: tee.slope,
      }))

      const teeResult = await courseTeeRepo.bulkUpsert(teesInput)
      teesImported = teeResult.inserted + teeResult.updated
      console.log(
        `[v0] Imported ${teeResult.inserted} new tees, updated ${teeResult.updated}, failed ${teeResult.failed}`,
      )
    }

    const status = errors.length === 0 ? "success" : "partial"
    console.log(`[v0] Course import completed: ${courseDetail.name} (${status})`)

    return {
      status,
      coursesProcessed: 1,
      coursesImported: 1,
      holesImported,
      teesImported,
      errors,
      startedAt,
      finishedAt: new Date(),
      durationMs: new Date().getTime() - startedAt.getTime(),
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] GolfCourse import failed: ${errorMsg}`)
    errors.push({
      courseId,
      error: errorMsg,
    })

    return {
      status: "failure",
      coursesProcessed: 1,
      coursesImported: 0,
      holesImported: 0,
      teesImported: 0,
      errors,
      startedAt,
      finishedAt: new Date(),
      durationMs: new Date().getTime() - startedAt.getTime(),
    }
  }
}

/**
 * Import multiple courses from GolfCourse API.
 */
export async function importGolfCourses(
  client: GolfCourseAPIClient,
  courseIds: number[],
  prisma: PrismaClient = prismaClient,
): Promise<CourseImportSummary> {
  const startedAt = new Date()
  let coursesConsidered = courseIds.length
  let coursesMatched = 0
  let coursesImported = 0
  let coursesUpdated = 0
  let holesImported = 0
  let holesUpdated = 0
  let teeBoxesImported = 0
  let teeBoxesUpdated = 0
  const warnings: string[] = []
  const failures: string[] = []

  const importRunRepo = getImportRunRepository(prisma)

  for (const courseId of courseIds) {
    try {
      const result = await importGolfCourse(client, courseId, prisma)
      if (result.status !== "failure") {
        coursesMatched++
        coursesImported += result.coursesImported
        coursesUpdated += result.coursesUpdated
        holesImported += result.holesImported
        holesUpdated += result.holesUpdated
        teeBoxesImported += result.teesImported
        // Note: importGolfCourse doesn't track teeBoxesUpdated separately yet
      } else {
        failures.push(`Course ${courseId}: ${result.error || "Import failed"}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      failures.push(`Course ${courseId}: ${errorMsg}`)
    }
  }

  const finishedAt = new Date()
  const durationMs = finishedAt.getTime() - startedAt.getTime()

  // Record import run
  await importRunRepo.create({
    provider: "golfcourseapi",
    entity: "course-batch",
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
    durationMs,
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
