/**
 * Course Intelligence Service (server-only).
 *
 * Entry point for querying course intelligence.
 * Handles data aggregation, caching, and generation.
 */

import "server-only"

import prismaClient from "@/lib/prisma"
import { getCourseDetailsRepository } from "@/lib/repositories/course-details-repository"
import { getCourseHoleRepository } from "@/lib/repositories/course-hole-repository"
import { getCourseTeeRepository } from "@/lib/repositories/course-tee-repository"
import type { CourseAnalysisInput, CourseIntelligence } from "./types"
import { generateCourseIntelligence, getCourseIntelligenceHash } from "./course-intelligence-engine"

/**
 * Get or generate course intelligence for a course.
 *
 * Aggregates course data from repositories and generates intelligence metrics.
 * Deterministic: identical input produces identical output.
 *
 * @param courseId Course ID
 * @returns CourseIntelligence or null if course not found
 */
export async function getCourseIntelligence(courseId: string): Promise<CourseIntelligence | null> {
  const courseDetailsRepo = getCourseDetailsRepository(prismaClient)
  const courseHoleRepo = getCourseHoleRepository(prismaClient)
  const courseTeeRepo = getCourseTeeRepository(prismaClient)

  // Fetch course details
  const courseResult = await courseDetailsRepo.findById(courseId)
  if (courseResult.outcome !== "ok" || !courseResult.record) {
    return null
  }

  const course = courseResult.record

  // Fetch holes
  const holesResult = await courseHoleRepo.findByCourseId(courseId)
  const holes = holesResult.outcome === "ok" ? holesResult.records ?? [] : []

  // Fetch tees
  const teesResult = await courseTeeRepo.findByCourseId(courseId)
  const tees = teesResult.outcome === "ok" ? teesResult.records ?? [] : []

  // If no holes or tees, cannot generate intelligence
  if (holes.length === 0 || tees.length === 0) {
    return null
  }

  // Aggregate course analysis input
  const input: CourseAnalysisInput = {
    courseId,
    par: course.par,
    totalYardage: course.totalYardage,
    courseRating: course.courseRating,
    slopeRating: course.slopeRating,
    grassTypeFairway: course.grassTypeFairway,
    grassTypeGreen: course.grassTypeGreen,
    greenSize: course.greenSize,
    greenSpeed: course.greenSpeed,
    elevation: course.elevation,
    courseStyle: course.courseStyle,
    architect: course.architect,
    yearBuilt: course.yearBuilt,
    holes: holes.map((h) => ({
      holeNumber: h.holeNumber,
      par: h.par,
      yardage: h.yardage,
      handicap: h.handicap,
    })),
    tees: tees.map((t) => ({
      teeName: t.teeName,
      yardage: t.yardage,
      rating: t.rating,
      slope: t.slope,
    })),
  }

  // Generate course intelligence
  const intelligence = generateCourseIntelligence(input)

  return intelligence
}

/**
 * Get course intelligence for a tournament course.
 *
 * Convenience method that resolves course ID from tournament mapping.
 *
 * @param tournamentId Tournament ID
 * @returns CourseIntelligence or null if mapping or course not found
 */
export async function getTournamentCourseIntelligence(tournamentId: string): Promise<CourseIntelligence | null> {
  // Find tournament-course mapping
  const mapping = await prismaClient.tournamentCourseMapping.findUnique({
    where: { tournamentId },
    select: { golfCourseApiCourseId: true },
  })

  if (!mapping) {
    return null
  }

  // Find course details by external ID
  const courseDetailsRepo = getCourseDetailsRepository(prismaClient)
  const courseResult = await courseDetailsRepo.findByExternalId(mapping.golfCourseApiCourseId.toString())

  if (courseResult.outcome !== "ok" || !courseResult.record) {
    return null
  }

  // Get intelligence for this course
  return getCourseIntelligence(courseResult.record.id)
}
