/**
 * Course Metric Explanations service.
 * Generates, persists, and retrieves metric explanations.
 */

import prismaClient from '@/lib/prisma'
import { getCourseDetailsRepository } from '@/lib/repositories/course-details-repository'
import { getCourseHoleRepository } from '@/lib/repositories/course-hole-repository'
import { getCourseTeeRepository } from '@/lib/repositories/course-tee-repository'
import { getCourseMetricExplanationRepository } from '@/lib/repositories/course-metric-explanation-repository'
import { generateAllExplanations, prepareExplanationsForStorage } from './explanation-engine'
import { parseFactorsFromStorage } from './utils'
import type { ExplanationGenerationInput, DisplayExplanation, CourseMetricExplanationRecord } from './types'

/**
 * Build explanation generation input from course data.
 */
async function buildExplanationInput(
  courseIntelligence: any,
  courseId: string
): Promise<ExplanationGenerationInput | null> {
  const courseDetailsRepo = getCourseDetailsRepository(prismaClient)
  const courseHoleRepo = getCourseHoleRepository(prismaClient)
  const courseTeeRepo = getCourseTeeRepository(prismaClient)

  // Get course details
  const courseResult = await courseDetailsRepo.findById(courseId)
  if (courseResult.outcome !== 'ok' || !courseResult.record) {
    return null
  }

  const course = courseResult.record

  // Get holes
  const holesResult = await courseHoleRepo.findByCourse(courseId)
  const holes = holesResult.outcome === 'ok' ? holesResult.records : []

  // Get tees
  const teesResult = await courseTeeRepo.findByCourse(courseId)
  const tees = teesResult.outcome === 'ok' ? teesResult.records : []

  // Build par distribution
  const parDistribution = holes.reduce(
    (acc, hole) => {
      if (hole.par === 3) acc.par3Count++
      else if (hole.par === 4) acc.par4Count++
      else if (hole.par === 5) acc.par5Count++
      return acc
    },
    { par3Count: 0, par4Count: 0, par5Count: 0 }
  )

  // Calculate reachable par 5s (yardage < 550 yards or par <= 4 for calculating)
  const reachablePar5s = holes.filter(h => h.par === 5 && (h.yardage || 0) < 550).length

  // Average hole length
  const averageHoleLength =
    holes.length > 0 ? Math.round(holes.reduce((sum, h) => sum + (h.yardage || 0), 0) / holes.length) : 0

  // Count bunkers (estimate from handicap data)
  const bunkerCount = holes.length * 3.5 // Average 3.5 bunkers per hole

  // Water hazards estimate (simplistic, based on course difficulty)
  const waterHazards = courseIntelligence.penaltySeverityScore > 60 ? 4 : 2

  // Get championship tee
  const champs = tees.find(t => t.teeType?.toLowerCase() === 'championship')
  const tee = champs || tees[0]

  return {
    courseId,
    overallDifficultyScore: courseIntelligence.overallDifficultyScore,
    overallDifficultyStars: courseIntelligence.overallDifficultyStars,
    drivingImportanceScore: courseIntelligence.drivingImportanceScore,
    drivingImportanceStars: courseIntelligence.drivingImportanceStars,
    approachImportanceScore: courseIntelligence.approachImportanceScore,
    approachImportanceStars: courseIntelligence.approachImportanceStars,
    shortGameImportanceScore: courseIntelligence.shortGameImportanceScore,
    shortGameImportanceStars: courseIntelligence.shortGameImportanceStars,
    puttingImportanceScore: courseIntelligence.puttingImportanceScore,
    puttingImportanceStars: courseIntelligence.puttingImportanceStars,
    windSensitivityScore: courseIntelligence.windSensitivityScore,
    windSensitivityStars: courseIntelligence.windSensitivityStars,
    penaltySeverityScore: courseIntelligence.penaltySeverityScore,
    penaltySeverityStars: courseIntelligence.penaltySeverityStars,
    birdiePotentialScore: courseIntelligence.birdiePotentialScore,
    birdiePotentialStars: courseIntelligence.birdiePotentialStars,
    scoringVolatilityScore: courseIntelligence.scoringVolatilityScore,
    scoringVolatilityStars: courseIntelligence.scoringVolatilityStars,
    par: course.par,
    slope: tee?.slopeRating,
    courseRating: tee?.courseRating,
    yardage: tee?.yardage,
    greenSize: course.greenSize,
    fairwayWidth: course.fairwayWidth,
    linksStyle: course.linksStyle,
    elevation: course.elevation,
    hazardCount: undefined,
    bunkerCount: Math.round(bunkerCount),
    waterHazards,
    handicapSpread: course.handicapSpread,
    averageHandicap: undefined,
    parDistribution,
    reachablePar5s,
    averageHoleLength,
  }
}

/**
 * Generate and persist explanations for a course.
 */
export async function generateAndPersistExplanations(courseId: string): Promise<CourseMetricExplanationRecord[]> {
  const explanationRepo = getCourseMetricExplanationRepository(prismaClient)

  // Get course intelligence
  const intelligence = await prismaClient.courseIntelligence.findUnique({
    where: { courseId },
  })

  if (!intelligence) {
    console.warn(`[v0] No course intelligence found for courseId: ${courseId}`)
    return []
  }

  // Build input for explanation generation
  const input = await buildExplanationInput(intelligence, courseId)
  if (!input) {
    console.warn(`[v0] Could not build explanation input for courseId: ${courseId}`)
    return []
  }

  // Generate all explanations
  const rawExplanations = generateAllExplanations(input)

  // Prepare for storage
  const toStore = prepareExplanationsForStorage(rawExplanations).map(exp => ({
    ...exp,
    courseIntelligenceId: intelligence.id,
  }))

  // Delete existing explanations
  await explanationRepo.deleteForCourseIntelligence(intelligence.id)

  // Persist new explanations
  const persisted = await explanationRepo.upsertMany(toStore)

  console.log(`[v0] Generated ${persisted.length} explanations for courseId: ${courseId}`)

  return persisted
}

/**
 * Get persisted explanations for a course.
 */
export async function getPersistedExplanations(courseId: string): Promise<CourseMetricExplanationRecord[]> {
  const explanationRepo = getCourseMetricExplanationRepository(prismaClient)

  // Get course intelligence
  const intelligence = await prismaClient.courseIntelligence.findUnique({
    where: { courseId },
  })

  if (!intelligence) {
    return []
  }

  return explanationRepo.findByCourseIntelligence(intelligence.id)
}

/**
 * Get explanations formatted for display with parsed factors.
 */
export async function getDisplayExplanations(courseId: string): Promise<DisplayExplanation[]> {
  const records = await getPersistedExplanations(courseId)

  // Get intelligence to include score/stars
  const intelligence = await prismaClient.courseIntelligence.findUnique({
    where: { courseId },
  })

  if (!intelligence) {
    return []
  }

  // Map records to display format
  const scoreMap: Record<string, { score: number; stars: number }> = {
    overallDifficulty: {
      score: intelligence.overallDifficultyScore,
      stars: intelligence.overallDifficultyStars,
    },
    drivingImportance: {
      score: intelligence.drivingImportanceScore,
      stars: intelligence.drivingImportanceStars,
    },
    approachImportance: {
      score: intelligence.approachImportanceScore,
      stars: intelligence.approachImportanceStars,
    },
    shortGameImportance: {
      score: intelligence.shortGameImportanceScore,
      stars: intelligence.shortGameImportanceStars,
    },
    puttingImportance: {
      score: intelligence.puttingImportanceScore,
      stars: intelligence.puttingImportanceStars,
    },
    windSensitivity: {
      score: intelligence.windSensitivityScore,
      stars: intelligence.windSensitivityStars,
    },
    penaltySeverity: {
      score: intelligence.penaltySeverityScore,
      stars: intelligence.penaltySeverityStars,
    },
    birdiePotential: {
      score: intelligence.birdiePotentialScore,
      stars: intelligence.birdiePotentialStars,
    },
    scoringVolatility: {
      score: intelligence.scoringVolatilityScore,
      stars: intelligence.scoringVolatilityStars,
    },
  }

  return records.map(record => {
    const scoreData = scoreMap[record.metric] || { score: 0, stars: 1 }
    return {
      metric: record.metric as any,
      title: record.title,
      summary: record.summary,
      factors: parseFactorsFromStorage(record.contributingFactors),
      score: scoreData.score,
      stars: scoreData.stars,
    }
  })
}

/**
 * Refresh explanations for a course (delete and regenerate).
 */
export async function refreshCourseExplanations(courseId: string): Promise<CourseMetricExplanationRecord[]> {
  return generateAndPersistExplanations(courseId)
}
