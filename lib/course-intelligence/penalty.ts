/**
 * Penalty severity calculation.
 *
 * Factors: handicap spread, water hazards, slope rating.
 */

import type { DerivedMetrics } from "./types"
import { clampScore, scoreToStars } from "./utils"

export function calculatePenaltySeverity(metrics: DerivedMetrics, slopeRating?: number): { stars: 1 | 2 | 3 | 4 | 5; score: number } {
  let score = 0

  // Handicap spread is proxy for hazard density and severity (max 40 points)
  // Wide spread (close to 18) = many hazard variations = high penalty
  score += Math.min(40, (metrics.handicapSpread / 18) * 40)

  // Slope rating contribution (max 35 points)
  // Higher slope = more variation = steeper penalties
  // 90 = 0 points, 130 = 24 points, 150+ = 35 points
  if (slopeRating) {
    score += Math.max(0, Math.min(35, (slopeRating - 90) / 1.71))
  }

  // Par 3 count consideration (max 15 points)
  // Long Par 3s with tight greens = severe penalties
  const longPar3Percentage = metrics.longPar3Count > 0 ? (metrics.longPar3Count / 4) * 100 : 0
  score += (longPar3Percentage / 100) * 15

  // High-difficulty course indication (max 10 points)
  // High course rating = more complex hazard layout
  if (metrics.avgCourseRating > 74) {
    score += 10
  } else if (metrics.avgCourseRating > 72) {
    score += 5
  }

  return {
    stars: scoreToStars(score),
    score: clampScore(score),
  }
}
