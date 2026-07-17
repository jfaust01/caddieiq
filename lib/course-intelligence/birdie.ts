/**
 * Birdie potential calculation.
 *
 * Factors: Par 5 count, reachable Par 5s, average yardage, overall difficulty.
 */

import type { DerivedMetrics } from "./types"
import { clampScore, scoreToStars } from "./utils"

export function calculateBirdiePotential(metrics: DerivedMetrics, courseRating?: number, slopeRating?: number): { stars: 1 | 2 | 3 | 4 | 5; score: number } {
  let score = 100 // Start at max, subtract for difficulty

  // Par 5 count contribution (max 20 points added)
  // More Par 5s = more birdie opportunities
  score -= Math.max(0, 20 - (metrics.par5Count / 5) * 20)

  // Reachable Par 5s contribution (max 20 points added)
  // Reachable Par 5s are eagle/birdie opportunities
  score -= Math.max(0, 20 - (metrics.reachablePar5Count / 4) * 20)

  // Average hole length contribution (up to -20 points)
  // Shorter courses = easier birdies
  // 400+ yards avg = -20 points, 350 yards = 0 points
  if (metrics.avgHoleLength > 350) {
    score -= Math.min(20, (metrics.avgHoleLength - 350) / 2.5)
  }

  // Par 4 difficulty consideration (up to -15 points)
  // Shorter Par 4s = more birdie chances
  const avgPar4Yardage = metrics.avgHoleLength // Rough proxy
  if (avgPar4Yardage > 400) {
    score -= Math.min(15, (avgPar4Yardage - 400) / 2)
  }

  // Course difficulty penalty (up to -25 points)
  // High slope/rating = harder course = fewer birdies
  if (slopeRating && slopeRating > 120) {
    score -= Math.min(25, (slopeRating - 120) / 1.2)
  }

  if (courseRating && courseRating > 72) {
    score -= Math.min(15, (courseRating - 72) * 2)
  }

  return {
    stars: scoreToStars(score),
    score: clampScore(score),
  }
}
