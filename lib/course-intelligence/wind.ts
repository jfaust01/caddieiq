/**
 * Wind sensitivity calculation.
 *
 * Factors: course style, elevation, open vs protected layout.
 */

import type { DerivedMetrics } from "./types"
import { clampScore, scoreToStars } from "./utils"

export function calculateWindSensitivity(metrics: DerivedMetrics): { stars: 1 | 2 | 3 | 4 | 5; score: number } {
  let score = 0

  // Links style courses are much more wind sensitive (max 30 points)
  if (metrics.isLinksStyle) {
    score += 30
  } else {
    score += 5 // Inland courses have baseline wind exposure
  }

  // High elevation courses are wind sensitive (max 25 points)
  // Thinner air = more distance variance = more wind impact
  if (metrics.isHighElevation) {
    score += 25
  }

  // Average hole length contribution (max 20 points)
  // Longer holes = more wind exposure
  if (metrics.avgHoleLength > 0) {
    score += Math.max(0, Math.min(20, (metrics.avgHoleLength - 350) / 5))
  }

  // Par 5 count contribution (max 15 points)
  // More Par 5s = longer shots = more wind-affected
  score += Math.min(15, (metrics.par5Count / 4) * 15)

  // Open fairway assumption via narrow fairway check (max 10 points)
  // Narrow fairways = trees = protection from wind
  if (!metrics.hasNarrowFairways) {
    score += 10
  }

  return {
    stars: scoreToStars(score),
    score: clampScore(score),
  }
}
