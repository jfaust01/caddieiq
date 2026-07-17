/**
 * Short game importance calculation (scrambling).
 *
 * Factors: green size, par distribution, bunker density (via handicap).
 */

import type { DerivedMetrics } from "./types"
import { clampScore, scoreToStars } from "./utils"

export function calculateShortGameImportance(metrics: DerivedMetrics): { stars: 1 | 2 | 3 | 4 | 5; score: number } {
  let score = 0

  // Green size contribution (max 35 points)
  // Smaller greens = more scrambling needed
  // Large = 5 points, Small = 35 points
  if (metrics.hasLargeGreens) {
    score += 5
  } else {
    score += 20 // Assume medium by default
  }

  // Par 3 count contribution (max 25 points)
  // More Par 3s = shorter approach shots = more scrambling
  const par3Percentage = (metrics.par3Count / 18) * 100
  score += (par3Percentage / 100) * 25

  // Long Par 3 count bonus (max 15 points)
  // Long Par 3s emphasize short game (long shots to small greens)
  score += Math.min(15, (metrics.longPar3Count / 4) * 15)

  // Average hole length consideration (max 15 points)
  // Longer courses = tougher scrambling scenarios
  if (metrics.avgHoleLength > 0) {
    score += Math.min(15, (metrics.avgHoleLength - 350) / 6.67)
  }

  // Hazard density via handicap spread (max 10 points)
  // High handicap variance indicates complex hazard patterns
  score += Math.min(10, (metrics.handicapSpread / 18) * 10)

  return {
    stars: scoreToStars(score),
    score: clampScore(score),
  }
}
