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

export interface GolfCourseImportResult {
  status: "success" | "partial" | "failure"
  coursesProcessed: number
  coursesImported: number
  holesImported: number
  teesImported: number
  errors: Array<{ courseId: number; error: string }>
  startedAt: Date
  finishedAt: Date
  durationMs: number
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
): Promise<GolfCourseImportResult> {
  const startedAt = new Date()
  let totalCoursesProcessed = 0
  let totalCoursesImported = 0
  let totalHolesImported = 0
  let totalTeesImported = 0
  const allErrors: Array<{ courseId: number; error: string }> = []

  const importRunRepo = getImportRunRepository()

  console.log(`[v0] Starting GolfCourse import for ${courseIds.length} courses`)

  for (const courseId of courseIds) {
    const result = await importGolfCourse(client, courseId, prisma)
    totalCoursesProcessed += result.coursesProcessed
    totalCoursesImported += result.coursesImported
    totalHolesImported += result.holesImported
    totalTeesImported += result.teesImported
    allErrors.push(...result.errors)
  }

  const finishedAt = new Date()
  const durationMs = finishedAt.getTime() - startedAt.getTime()
  const status = allErrors.length === 0 ? "success" : allErrors.length < courseIds.length ? "partial" : "failure"

  // Record import run
  await importRunRepo.create({
    provider: "golfcourseapi",
    entity: "course",
    status,
    startedAt,
    finishedAt,
    durationMs,
    processed: totalCoursesProcessed,
    inserted: totalCoursesImported,
    updated: 0,
    skipped: 0,
    failed: allErrors.length,
    warnings: 0,
    summary: `Imported ${totalCoursesImported}/${totalCoursesProcessed} courses, ${totalHolesImported} holes, ${totalTeesImported} tees`,
    error: allErrors.length > 0 ? allErrors[0].error : null,
  })

  console.log(
    `[v0] GolfCourse import complete: ${totalCoursesImported}/${totalCoursesProcessed} courses, ${totalHolesImported} holes, ${totalTeesImported} tees`,
  )

  return {
    status,
    coursesProcessed: totalCoursesProcessed,
    coursesImported: totalCoursesImported,
    holesImported: totalHolesImported,
    teesImported: totalTeesImported,
    errors: allErrors,
    startedAt,
    finishedAt,
    durationMs,
  }
}
