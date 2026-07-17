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
import { getCourseIntelligenceRepository } from "@/lib/repositories/course-intelligence-repository"
import type { CourseAnalysisInput, CourseIntelligence } from "./types"
import { generateCourseIntelligence, getCourseIntelligenceHash } from "./course-intelligence-engine"
import { scoreToStars } from "./utils"

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
 * Generate and persist course intelligence.
 *
 * Calculates intelligence metrics and stores them in the database.
 * Returns the persisted record.
 *
 * @param courseId Course ID
 * @returns Persisted CourseIntelligence or null if course not found
 */
export async function persistCourseIntelligence(courseId: string): Promise<CourseIntelligence | null> {
  const intelligenceRepo = getCourseIntelligenceRepository(prismaClient)

  // Generate intelligence (calculates metrics)
  const intelligence = await getCourseIntelligence(courseId)
  if (!intelligence) {
    return null
  }

  // Persist to database
  const record = await intelligenceRepo.upsert({
    courseId,
    overallDifficultyScore: intelligence.overallDifficulty.score,
    overallDifficultyStars: intelligence.overallDifficulty.stars,
    drivingImportanceScore: intelligence.drivingImportance.score,
    drivingImportanceStars: intelligence.drivingImportance.stars,
    approachImportanceScore: intelligence.approachImportance.score,
    approachImportanceStars: intelligence.approachImportance.stars,
    shortGameImportanceScore: intelligence.shortGameImportance.score,
    shortGameImportanceStars: intelligence.shortGameImportance.stars,
    puttingImportanceScore: intelligence.puttingImportance.score,
    puttingImportanceStars: intelligence.puttingImportance.stars,
    windSensitivityScore: intelligence.windSensitivity.score,
    windSensitivityStars: intelligence.windSensitivity.stars,
    penaltySeverityScore: intelligence.penaltySeverity.score,
    penaltySeverityStars: intelligence.penaltySeverity.stars,
    birdiePotentialScore: intelligence.birdiePotential.score,
    birdiePotentialStars: intelligence.birdiePotential.stars,
    scoringVolatilityScore: intelligence.scoringVolatility.score,
    scoringVolatilityStars: intelligence.scoringVolatility.stars,
    calculationVersion: 'v1',
  })

  console.log(`[v0] Persisted course intelligence for courseId: ${courseId}`)

  return intelligence
}

/**
 * Read persisted course intelligence from database.
 *
 * Does NOT recalculate. Only returns stored values.
 *
 * @param courseId Course ID
 * @returns Persisted CourseIntelligence or null if not found
 */
export async function getPersistedCourseIntelligence(courseId: string): Promise<CourseIntelligence | null> {
  try {
    const intelligenceRepo = getCourseIntelligenceRepository(prismaClient)
    const record = await intelligenceRepo.findByCourseId(courseId)

    if (!record) {
      return null
    }

    return {
      courseId: record.courseId,
      generatedAt: record.calculatedAt,
      overallDifficulty: {
        stars: record.overallDifficultyStars,
        score: record.overallDifficultyScore,
      },
      drivingImportance: {
        stars: record.drivingImportanceStars,
        score: record.drivingImportanceScore,
      },
      approachImportance: {
        stars: record.approachImportanceStars,
        score: record.approachImportanceScore,
      },
      shortGameImportance: {
        stars: record.shortGameImportanceStars,
        score: record.shortGameImportanceScore,
      },
      puttingImportance: {
        stars: record.puttingImportanceStars,
        score: record.puttingImportanceScore,
      },
      windSensitivity: {
        stars: record.windSensitivityStars,
        score: record.windSensitivityScore,
      },
      penaltySeverity: {
        stars: record.penaltySeverityStars,
        score: record.penaltySeverityScore,
      },
      birdiePotential: {
        stars: record.birdiePotentialStars,
        score: record.birdiePotentialScore,
      },
      scoringVolatility: {
        stars: record.scoringVolatilityStars,
        score: record.scoringVolatilityScore,
      },
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`[v0] getPersistedCourseIntelligence failed for ${courseId}: ${errorMsg}`)
    return null
  }
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
  try {
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

    // Try to get persisted intelligence first
    const persisted = await getPersistedCourseIntelligence(courseResult.record.id)
    if (persisted) {
      return persisted
    }

    // Fall back to calculating if not persisted
    return getCourseIntelligence(courseResult.record.id)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`[v0] getTournamentCourseIntelligence failed for ${tournamentId}: ${errorMsg}`)
    return null
  }
}
