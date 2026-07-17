/**
 * Approach importance calculation.
 *
 * Factors: green size, par distribution, average approach shot distance.
 */

import type { DerivedMetrics } from "./types"
import { clampScore, scoreToStars } from "./utils"

export function calculateApproachImportance(metrics: DerivedMetrics): { stars: 1 | 2 | 3 | 4 | 5; score: number } {
  let score = 0

  // Green size contribution (max 30 points)
  // Smaller greens = more critical approach
  // Large = 0 points, Medium = 15 points, Small = 30 points
  if (metrics.hasLargeGreens) {
    score += 0
  } else {
    score += 15 // Assume medium by default
  }

  // Par 4 count contribution (max 35 points)
  // More Par 4s = more critical approach play
  const par4Percentage = (metrics.par4Count / 18) * 100
  score += (par4Percentage / 100) * 35

  // Average hole length contribution (max 20 points)
  // Longer holes = more approach shots
  if (metrics.avgHoleLength > 0) {
    score += Math.max(0, Math.min(20, (metrics.avgHoleLength - 350) / 5))
  }

  // Par 3 count consideration (max 15 points)
  // More Par 3s = less approach play but requires accuracy
  // We penalize Par 3 count slightly
  const par3Percentage = (metrics.par3Count / 18) * 100
  score -= (par3Percentage / 100) * 5

  return {
    stars: scoreToStars(score),
    score: clampScore(score),
  }
}
