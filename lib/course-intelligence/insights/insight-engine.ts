/**
 * Course Insight Engine
 *
 * Generates deterministic insights from CourseIntelligence metrics.
 * No randomness, no LLMs. Pure rule-based generation.
 */

import type { RawInsight, InsightGenerationInput } from './types'
import {
  generateDifficultyInsight,
  generateDrivingInsight,
  generateApproachInsight,
  generateShortGameInsight,
  generatePuttingInsight,
  generateBirdieInsight,
  generateWindInsight,
  generatePenaltyInsight,
} from './generators'

/**
 * Generate all insights for a course.
 *
 * Returns insights sorted by importance (descending) then displayOrder.
 *
 * @param input Course intelligence metrics
 * @returns Array of generated insights
 */
export function generateAllInsights(input: InsightGenerationInput): RawInsight[] {
  const insights: RawInsight[] = [
    // Generate insights in order of importance
    generateDifficultyInsight(input, 1),
    generateDrivingInsight(input, 2),
    generateApproachInsight(input, 3),
    generateShortGameInsight(input, 4),
    generatePuttingInsight(input, 5),
    generateBirdieInsight(input, 6),
    generateWindInsight(input, 7),
    generatePenaltyInsight(input, 8),
  ]

  // Sort by importance (desc) then displayOrder (asc)
  return insights.sort((a, b) => {
    const importanceDiff = b.importance - a.importance
    if (importanceDiff !== 0) return importanceDiff
    return a.displayOrder - b.displayOrder
  })
}

/**
 * Generate a single insight by category.
 *
 * @param input Course intelligence metrics
 * @param category Insight category
 * @returns Generated insight or null
 */
export function generateInsightByCategory(
  input: InsightGenerationInput,
  category: string
): RawInsight | null {
  const displayOrderMap: Record<string, number> = {
    difficulty: 1,
    driving: 2,
    approach: 3,
    shortGame: 4,
    putting: 5,
    birdie: 6,
    wind: 7,
    penalties: 8,
  }

  const displayOrder = displayOrderMap[category] || 0

  switch (category) {
    case 'difficulty':
      return generateDifficultyInsight(input, displayOrder)
    case 'driving':
      return generateDrivingInsight(input, displayOrder)
    case 'approach':
      return generateApproachInsight(input, displayOrder)
    case 'shortGame':
      return generateShortGameInsight(input, displayOrder)
    case 'putting':
      return generatePuttingInsight(input, displayOrder)
    case 'birdie':
      return generateBirdieInsight(input, displayOrder)
    case 'wind':
      return generateWindInsight(input, displayOrder)
    case 'penalties':
      return generatePenaltyInsight(input, displayOrder)
    default:
      return null
  }
}

/**
 * Get all insight categories.
 */
export function getAllCategories(): string[] {
  return ['difficulty', 'driving', 'approach', 'shortGame', 'putting', 'birdie', 'wind', 'penalties']
}
