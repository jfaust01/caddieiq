/**
 * Scoring volatility calculation.
 *
 * Factors: par distribution variance, eagle holes, penalty severity, risk-reward design.
 */

import type { DerivedMetrics } from "./types"
import { clampScore, scoreToStars } from "./utils"

export function calculateScoringVolatility(metrics: DerivedMetrics, slopeRating?: number): { stars: 1 | 2 | 3 | 4 | 5; score: number } {
  let score = 0

  // Par distribution variance (max 25 points)
  // Courses with many Par 5s and few Par 3s have high volatility
  const parVariance = Math.abs(metrics.par5Count - 4) + Math.abs(metrics.par4Count - 10) + Math.abs(metrics.par3Count - 4)
  score += Math.min(25, parVariance * 2.5)

  // Reachable Par 5 count (max 20 points)
  // More reachable Par 5s = more eagle potential = higher volatility
  score += Math.min(20, (metrics.reachablePar5Count / 4) * 20)

  // Handicap spread contribution (max 25 points)
  // High handicap variance = risk-reward holes = volatile scoring
  score += Math.min(25, (metrics.handicapSpread / 18) * 25)

  // Slope rating contribution (max 15 points)
  // High slope = difficulty variance = score variance
  if (slopeRating) {
    score += Math.max(0, Math.min(15, (slopeRating - 110) / 2.67))
  }

  // Long Par 3 count (max 15 points)
  // Long Par 3s increase score variance
  score += Math.min(15, (metrics.longPar3Count / 4) * 15)

  return {
    stars: scoreToStars(score),
    score: clampScore(score),
  }
}
