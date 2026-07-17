/**
 * Driving importance calculation.
 *
 * Factors: average hole length, fairway width, yardage, doglegs/handicap spread.
 */

import type { DerivedMetrics } from "./types"
import { clampScore, scoreToStars } from "./utils"

export function calculateDrivingImportance(metrics: DerivedMetrics): { stars: 1 | 2 | 3 | 4 | 5; score: number } {
  let score = 0

  // Average hole length contribution (max 35 points)
  // Longer holes = more critical driving
  // 350 yards avg = 0 points, 400 yards = 17.5 points, 450+ = 35 points
  if (metrics.avgHoleLength > 0) {
    score += Math.max(0, Math.min(35, (metrics.avgHoleLength - 350) / 2.86))
  }

  // Par 4 and Par 5 count contribution (max 30 points)
  // Courses with more Par 4s and Par 5s emphasize driving
  const drivingHoles = metrics.par4Count + metrics.par5Count
  const drivingPercentage = (drivingHoles / 18) * 100
  score += (drivingPercentage / 100) * 30

  // Handicap spread contribution (max 20 points)
  // High variance in handicap = challenging hole-to-hole = driving more critical
  score += Math.min(20, (metrics.handicapSpread / 18) * 20)

  // Par 5 count bonus (max 15 points)
  // More Par 5s = more driving importance
  score += Math.min(15, (metrics.par5Count / 4) * 15)

  // Narrow fairways bonus (max 10 points)
  if (metrics.hasNarrowFairways) {
    score += 10
  }

  return {
    stars: scoreToStars(score),
    score: clampScore(score),
  }
}
