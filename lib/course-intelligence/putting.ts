/**
 * Putting importance calculation.
 *
 * Factors: green speed, green size, course scoring environment.
 */

import type { DerivedMetrics } from "./types"
import { clampScore, scoreToStars } from "./utils"

export function calculatePuttingImportance(metrics: DerivedMetrics): { stars: 1 | 2 | 3 | 4 | 5; score: number } {
  let score = 0

  // Green speed contribution (max 35 points)
  // Faster greens = more critical putting
  // Normal/Stimp 11 = 10 points, Fast/Stimp 12+ = 35 points
  if (metrics.hasFastGreens) {
    score += 35
  } else {
    score += 10 // Assume normal speed
  }

  // Green size contribution (max 25 points)
  // Smaller greens = fewer make opportunities = more putting
  if (metrics.hasLargeGreens) {
    score += 25
  } else {
    score += 15 // Assume medium by default
  }

  // Par 3 count contribution (max 20 points)
  // More Par 3s = more 1-putts opportunity = higher putting importance
  const par3Percentage = (metrics.par3Count / 18) * 100
  score += (par3Percentage / 100) * 20

  // Par 5 reachability consideration (max 10 points)
  // Reachable Par 5s = more eagle putts possible = putting matters
  score += Math.min(10, (metrics.reachablePar5Count / 4) * 10)

  // Course rating contribution (max 10 points)
  // Higher rated courses = tougher greens = more putting difficulty
  if (metrics.avgCourseRating > 0) {
    score += Math.min(10, (metrics.avgCourseRating - 65) * 2)
  }

  return {
    stars: scoreToStars(score),
    score: clampScore(score),
  }
}
