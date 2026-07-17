/**
 * Utility functions for course intelligence calculations.
 */

import type { CourseAnalysisInput, DerivedMetrics } from "./types"

/**
 * Convert numeric score (0-100) to star rating (1-5).
 */
export function scoreToStars(score: number): 1 | 2 | 3 | 4 | 5 {
  const clamped = Math.max(0, Math.min(100, score))
  if (clamped <= 20) return 1
  if (clamped <= 40) return 2
  if (clamped <= 60) return 3
  if (clamped <= 80) return 4
  return 5
}

/**
 * Clamp score to 0-100 range.
 */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score))
}

/**
 * Derive metrics from course analysis input.
 */
export function deriveMetrics(input: CourseAnalysisInput): DerivedMetrics {
  // Par distribution
  const par3Count = input.holes.filter((h) => h.par === 3).length
  const par4Count = input.holes.filter((h) => h.par === 4).length
  const par5Count = input.holes.filter((h) => h.par === 5).length

  const totalYardage = input.holes.reduce((sum, h) => sum + (h.yardage ?? 0), 0)
  const avgHoleLength = input.holes.length > 0 ? totalYardage / input.holes.length : 0

  // Front and back nine
  const frontNine = input.holes.filter((h) => h.holeNumber <= 9)
  const backNine = input.holes.filter((h) => h.holeNumber >= 10)

  const frontNineYardage = frontNine.reduce((sum, h) => sum + (h.yardage ?? 0), 0)
  const backNineYardage = backNine.reduce((sum, h) => sum + (h.yardage ?? 0), 0)

  // Par 3 analysis
  const par3Holes = input.holes.filter((h) => h.par === 3)
  const longPar3Count = par3Holes.filter((h) => (h.yardage ?? 0) > 200).length
  const avgPar3Length = par3Holes.length > 0 ? par3Holes.reduce((sum, h) => sum + (h.yardage ?? 0), 0) / par3Holes.length : 0

  // Par 5 analysis
  const par5Holes = input.holes.filter((h) => h.par === 5)
  const reachablePar5Count = par5Holes.filter((h) => (h.yardage ?? 0) < 540).length
  const avgPar5Length = par5Holes.length > 0 ? par5Holes.reduce((sum, h) => sum + (h.yardage ?? 0), 0) / par5Holes.length : 0

  // Rating metrics
  const teeRatings = input.tees.filter((t) => t.rating !== undefined).map((t) => t.rating!)
  const teeSlopes = input.tees.filter((t) => t.slope !== undefined).map((t) => t.slope!)
  const avgCourseRating = teeRatings.length > 0 ? teeRatings.reduce((a, b) => a + b, 0) / teeRatings.length : 0
  const avgSlope = teeSlopes.length > 0 ? teeSlopes.reduce((a, b) => a + b, 0) / teeSlopes.length : 0
  const ratingSpread = teeRatings.length > 0 ? Math.max(...teeRatings) - Math.min(...teeRatings) : 0

  // Course characteristics
  const isLinksStyle = input.courseStyle?.toLowerCase().includes("links") ?? false
  const isHighElevation = (input.elevation ?? 0) > 3000
  const hasFastGreens = input.greenSpeed?.toLowerCase().includes("12") || input.greenSpeed?.toLowerCase().includes("13") || input.greenSpeed?.toLowerCase().includes("14") || false
  const hasLargeGreens = input.greenSize?.toLowerCase().includes("large") ?? false
  const hasNarrowFairways = input.grassTypeFairway?.toLowerCase().includes("narrow") ?? false

  // Handicap analysis
  const handicaps = input.holes.filter((h) => h.handicap !== undefined).map((h) => h.handicap!)
  const avgHandicap = handicaps.length > 0 ? handicaps.reduce((a, b) => a + b, 0) / handicaps.length : 9
  const handicapSpread = handicaps.length > 0 ? Math.max(...handicaps) - Math.min(...handicaps) : 17

  return {
    par3Count,
    par4Count,
    par5Count,
    avgHoleLength,
    frontNineYardage,
    backNineYardage,
    longPar3Count,
    avgPar3Length,
    reachablePar5Count,
    avgPar5Length,
    avgSlope,
    avgCourseRating,
    ratingSpread,
    isLinksStyle,
    isHighElevation,
    hasFastGreens,
    hasLargeGreens,
    hasNarrowFairways,
    avgHandicap,
    handicapSpread,
  }
}
