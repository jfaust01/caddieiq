/**
 * Admin GolfCourse import service.
 * Provides transparency into the import pipeline for QA/debugging.
 */

import { GolfCourseAPIClient } from "@/lib/providers/golfcourseapi/client"
import { getCourseDetailsRepository } from "@/lib/repositories/course-details-repository"
import { importGolfCourse } from "@/lib/imports/golfcourse-import"
import prismaClient from "@/lib/prisma"
import type { GolfCourseImportResult, CourseFieldValue } from "./golfcourse-import-types"

const TRACKED_FIELDS = [
  'courseName',
  'architect',
  'yearBuilt',
  'courseStyle',
  'grassTypeFairway',
  'grassTypeGreen',
  'greenSize',
  'greenSpeed',
  'elevation',
  'drivingRange',
  'puttingGreen',
  'shortGameArea',
  'website',
  'phone',
  'par',
  'totalYardage',
  'courseRating',
  'slopeRating',
]

/**
 * Perform a detailed GolfCourse import with full transparency.
 * Compares before/after, tracks which fields changed, and returns the raw API response.
 */
export async function performAdminGolfCourseImport(
  courseId: string,
  forceRefresh: boolean = false,
): Promise<GolfCourseImportResult> {
  const startTime = Date.now()

  try {
    const courseDetailsRepo = getCourseDetailsRepository(prismaClient)

    // Get current state
    const currentResult = await courseDetailsRepo.findById(courseId)
    if (currentResult.outcome !== 'ok' || !currentResult.record) {
      throw new Error('Course not found')
    }

    const before = {
      courseName: currentResult.record.courseName,
      architect: currentResult.record.architect,
      yearBuilt: currentResult.record.yearBuilt,
      courseStyle: currentResult.record.courseStyle,
      grassTypeFairway: currentResult.record.grassTypeFairway,
      grassTypeGreen: currentResult.record.grassTypeGreen,
      greenSize: currentResult.record.greenSize,
      greenSpeed: currentResult.record.greenSpeed,
      elevation: currentResult.record.elevation,
      drivingRange: currentResult.record.drivingRange,
      puttingGreen: currentResult.record.puttingGreen,
      shortGameArea: currentResult.record.shortGameArea,
      website: currentResult.record.website,
      phone: currentResult.record.phone,
      par: currentResult.record.par,
      totalYardage: currentResult.record.totalYardage,
      courseRating: currentResult.record.courseRating,
      slopeRating: currentResult.record.slopeRating,
    }

    // Fetch fresh data from API
    const client = new GolfCourseAPIClient(
      process.env.GOLFCOURSEAPI_API_KEY || '',
      forceRefresh ? 0 : undefined,
    )

    let rawResponse: any = null
    if (currentResult.record.externalCourseId) {
      try {
        const courseDetail = await client.getCourseDetail(
          parseInt(currentResult.record.externalCourseId, 10),
        )
        rawResponse = courseDetail
        
        // Import the course (reuses existing import logic)
        await importGolfCourse(client, parseInt(currentResult.record.externalCourseId, 10), prismaClient)
      } catch (error) {
        console.error('[v0] Failed to fetch from GolfCourseAPI:', error)
        throw new Error(`Failed to fetch from GolfCourseAPI: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      throw new Error('Course does not have a GolfCourseAPI ID')
    }

    // Get updated state
    const updatedResult = await courseDetailsRepo.findById(courseId)
    if (updatedResult.outcome !== 'ok' || !updatedResult.record) {
      throw new Error('Course disappeared after import')
    }

    const after = {
      courseName: updatedResult.record.courseName,
      architect: updatedResult.record.architect,
      yearBuilt: updatedResult.record.yearBuilt,
      courseStyle: updatedResult.record.courseStyle,
      grassTypeFairway: updatedResult.record.grassTypeFairway,
      grassTypeGreen: updatedResult.record.grassTypeGreen,
      greenSize: updatedResult.record.greenSize,
      greenSpeed: updatedResult.record.greenSpeed,
      elevation: updatedResult.record.elevation,
      drivingRange: updatedResult.record.drivingRange,
      puttingGreen: updatedResult.record.puttingGreen,
      shortGameArea: updatedResult.record.shortGameArea,
      website: updatedResult.record.website,
      phone: updatedResult.record.phone,
      par: updatedResult.record.par,
      totalYardage: updatedResult.record.totalYardage,
      courseRating: updatedResult.record.courseRating,
      slopeRating: updatedResult.record.slopeRating,
    }

    // Calculate diffs
    const updatedFields: Record<string, CourseFieldValue> = {}
    const skippedFields: Record<string, { reason: string }> = {}

    for (const field of TRACKED_FIELDS) {
      const beforeVal = before[field as keyof typeof before]
      const afterVal = after[field as keyof typeof after]

      if (beforeVal !== afterVal) {
        updatedFields[field] = {
          before: beforeVal,
          after: afterVal,
          changed: true,
        }
      } else if (afterVal === null) {
        // Field is still null - likely not provided by API
        skippedFields[field] = {
          reason: 'Provider returned null',
        }
      }
    }

    const duration = Date.now() - startTime

    return {
      success: true,
      courseId,
      courseName: updatedResult.record.courseName || 'Unknown',
      duration,
      updatedFields,
      skippedFields,
      warnings: [],
      errors: [],
      before,
      after,
      rawResponse: rawResponse || {},
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      courseId,
      courseName: 'Unknown',
      duration,
      updatedFields: {},
      skippedFields: {},
      warnings: [],
      errors: [message],
      before: {},
      after: {},
      rawResponse: {},
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Search for courses by name, city, or state.
 * Reuses existing course data - no GolfCourseAPI call.
 */
export async function searchCourses(query: string, limit: number = 10) {
  if (!query || query.length < 2) {
    return []
  }

  const normalizedQuery = query.toLowerCase()

  try {
    const results = await prismaClient.courseDetails.findMany({
      where: {
        OR: [
          { courseName: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        courseName: true,
        city: true,
        state: true,
        country: true,
        externalCourseId: true,
        architect: true,
        yearBuilt: true,
        courseStyle: true,
      },
      take: limit,
    })

    return results
  } catch (error) {
    console.error('[v0] Course search failed:', error)
    return []
  }
}

/**
 * Get data coverage for a single course.
 */
export async function getCourseCoverage(courseId: string) {
  const courseDetailsRepo = getCourseDetailsRepository(prismaClient)
  const result = await courseDetailsRepo.findById(courseId)

  if (result.outcome !== 'ok' || !result.record) {
    throw new Error('Course not found')
  }

  const course = result.record

  const categories = {
    identity: [
      { field: 'Course Name', available: !!course.courseName, value: course.courseName },
      { field: 'City', available: !!course.city, value: course.city },
      { field: 'State', available: !!course.state, value: course.state },
      { field: 'Country', available: !!course.country, value: course.country },
      { field: 'GolfCourseAPI ID', available: !!course.externalCourseId, value: course.externalCourseId },
    ],
    metadata: [
      { field: 'Architect', available: !!course.architect, value: course.architect },
      { field: 'Year Built', available: !!course.yearBuilt, value: course.yearBuilt },
      { field: 'Course Style', available: !!course.courseStyle, value: course.courseStyle },
    ],
    playingConditions: [
      { field: 'Fairway Grass', available: !!course.grassTypeFairway, value: course.grassTypeFairway },
      { field: 'Green Grass', available: !!course.grassTypeGreen, value: course.grassTypeGreen },
      { field: 'Green Speed', available: !!course.greenSpeed, value: course.greenSpeed },
      { field: 'Average Green Size', available: !!course.greenSize, value: course.greenSize },
      { field: 'Elevation', available: !!course.elevation, value: course.elevation },
    ],
    facilities: [
      { field: 'Driving Range', available: !!course.drivingRange, value: course.drivingRange ? 'Yes' : 'No' },
      { field: 'Putting Green', available: !!course.puttingGreen, value: course.puttingGreen ? 'Yes' : 'No' },
      { field: 'Short Game Area', available: !!course.shortGameArea, value: course.shortGameArea ? 'Yes' : 'No' },
    ],
  }

  const results = Object.entries(categories).map(([category, items]) => {
    const available = items.filter(i => i.available).length
    const coverage = Math.round((available / items.length) * 100)

    return {
      category,
      items,
      coverage,
    }
  })

  return results
}
