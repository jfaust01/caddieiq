/**
 * Overall course difficulty calculation.
 *
 * Factors: slope rating, course rating, yardage, par distribution, handicap spread.
 */

import type { DerivedMetrics } from "./types"
import { clampScore, scoreToStars } from "./utils"

export function calculateDifficulty(metrics: DerivedMetrics, slopeRating?: number, courseRating?: number): { stars: 1 | 2 | 3 | 4 | 5; score: number } {
  let score = 0

  // Slope rating contribution (max 40 points)
  // Slope ranges typically 90-150
  if (slopeRating) {
    // 90 = 0 points, 130 = 20 points, 150 = 40 points
    score += Math.max(0, Math.min(40, (slopeRating - 90) / 1.5))
  }

  // Course rating contribution (max 30 points)
  // Rating ranges typically 60-80
  if (courseRating) {
    // 60 = 0 points, 72 = 20 points, 80 = 30 points
    score += Math.max(0, Math.min(30, (courseRating - 60) * 3.75))
  }

  // Yardage contribution (max 20 points)
  // 5500 yards = 0 points, 6500 yards = 10 points, 7200+ yards = 20 points
  if (metrics.avgHoleLength > 0) {
    const totalYardage = metrics.avgHoleLength * 18
    score += Math.max(0, Math.min(20, (totalYardage - 5500) / 35))
  }

  // Handicap spread contribution (max 10 points)
  // Wide spread (close to 18) = more difficulty variance = higher difficulty
  score += Math.min(10, (metrics.handicapSpread / 18) * 10)

  return {
    stars: scoreToStars(score),
    score: clampScore(score),
  }
}
