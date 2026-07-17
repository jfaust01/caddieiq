/**
 * Course Insights Service
 *
 * Entry point for generating and persisting course insights.
 */

import "server-only"

import prismaClient from "@/lib/prisma"
import { getCourseIntelligenceRepository } from "@/lib/repositories/course-intelligence-repository"
import { getCourseInsightRepository } from "@/lib/repositories/course-insight-repository"
import type { CourseInsightRecord } from "./types"
import { generateAllInsights } from "./insight-engine"

/**
 * Generate and persist insights for a course.
 *
 * Reads CourseIntelligence, generates insights, and persists them.
 * Deterministic: identical input produces identical output.
 *
 * @param courseId Course ID
 * @returns Array of persisted insights
 */
export async function generateAndPersistInsights(courseId: string): Promise<CourseInsightRecord[]> {
  try {
    const intelligenceRepo = getCourseIntelligenceRepository(prismaClient)
    const insightRepo = getCourseInsightRepository(prismaClient)

    // Find course intelligence
    const intelligence = await intelligenceRepo.findByCourseId(courseId)
    if (!intelligence) {
      console.warn(`[v0] No course intelligence found for courseId: ${courseId}`)
      return []
    }

    // Generate insights
    const rawInsights = generateAllInsights({
      courseIntelligenceId: intelligence.id,
      courseId: intelligence.courseId,
      overallDifficultyStars: intelligence.overallDifficultyStars,
      drivingImportanceStars: intelligence.drivingImportanceStars,
      approachImportanceStars: intelligence.approachImportanceStars,
      shortGameImportanceStars: intelligence.shortGameImportanceStars,
      puttingImportanceStars: intelligence.puttingImportanceStars,
      windSensitivityStars: intelligence.windSensitivityStars,
      penaltySeverityStars: intelligence.penaltySeverityStars,
      birdiePotentialStars: intelligence.birdiePotentialStars,
      scoringVolatilityStars: intelligence.scoringVolatilityStars,
    })

    // Delete existing insights
    const deletedCount = await insightRepo.deleteForCourseIntelligence(intelligence.id)
    console.log(`[v0] Deleted ${deletedCount} existing insights for courseId: ${courseId}`)

    // Persist new insights
    const persistedInsights = await insightRepo.upsertMany(
      rawInsights.map((insight) => ({
        courseIntelligenceId: intelligence.id,
        category: insight.category,
        title: insight.title,
        summary: insight.summary,
        importance: insight.importance,
        icon: insight.icon,
        displayOrder: insight.displayOrder,
      }))
    )

    console.log(`[v0] Generated and persisted ${persistedInsights.length} insights for courseId: ${courseId}`)

    return persistedInsights as CourseInsightRecord[]
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] generateAndPersistInsights failed for ${courseId}: ${errorMsg}`)
    return []
  }
}

/**
 * Get persisted insights for a course.
 *
 * Reads from database. Does NOT regenerate.
 *
 * @param courseId Course ID
 * @returns Array of persisted insights
 */
export async function getCourseInsights(courseId: string): Promise<CourseInsightRecord[]> {
  try {
    const intelligenceRepo = getCourseIntelligenceRepository(prismaClient)

    // Find course intelligence
    const intelligence = await intelligenceRepo.findByCourseId(courseId)
    if (!intelligence) {
      return []
    }

    // Get insights
    const insightRepo = getCourseInsightRepository(prismaClient)
    const insights = await insightRepo.findByCourseIntelligence(intelligence.id)

    return insights as CourseInsightRecord[]
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] getCourseInsights failed for ${courseId}: ${errorMsg}`)
    return []
  }
}

/**
 * Refresh insights for a course.
 *
 * Regenerates all insights by deleting and recreating.
 * Used after course data changes or algorithm updates.
 *
 * @param courseId Course ID
 * @returns Array of refreshed insights
 */
export async function refreshCourseInsights(courseId: string): Promise<CourseInsightRecord[]> {
  try {
    console.log(`[v0] Refreshing insights for courseId: ${courseId}`)
    return await generateAndPersistInsights(courseId)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] refreshCourseInsights failed for ${courseId}: ${errorMsg}`)
    return []
  }
}
