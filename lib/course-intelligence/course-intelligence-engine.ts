/**
 * Course Intelligence Engine (server-only).
 *
 * Analyzes imported course data and generates deterministic, data-driven course characteristics.
 * All calculations are reproducible and require no AI/LLM involvement.
 *
 * Output is cached and reused throughout CaddieIQ.
 */

import "server-only"

import type { CourseAnalysisInput, CourseIntelligence } from "./types"
import { deriveMetrics } from "./utils"
import { calculateDifficulty } from "./difficulty"
import { calculateDrivingImportance } from "./driving"
import { calculateApproachImportance } from "./approach"
import { calculateShortGameImportance } from "./short-game"
import { calculatePuttingImportance } from "./putting"
import { calculateWindSensitivity } from "./wind"
import { calculateBirdiePotential } from "./birdie"
import { calculatePenaltySeverity } from "./penalty"
import { calculateScoringVolatility } from "./volatility"

/**
 * Analyze course data and generate course intelligence.
 *
 * @param input Course analysis input (course details, holes, tees)
 * @returns CourseIntelligence object with all metrics
 */
export function generateCourseIntelligence(input: CourseAnalysisInput): CourseIntelligence {
  // Derive metrics for easier calculation
  const metrics = deriveMetrics(input)

  // Get representative course and slope ratings
  // Use highest-rated tee (typically championship tee) for consistency
  const teeRatings = input.tees.filter((t) => t.rating !== undefined && t.slope !== undefined)
  const highestTee = teeRatings.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]
  const courseRating = highestTee?.rating ?? input.courseRating ?? 72
  const slopeRating = highestTee?.slope ?? input.slopeRating ?? 120

  // Calculate all metrics
  const intelligence: CourseIntelligence = {
    courseId: input.courseId,
    generatedAt: new Date(),

    // Primary difficulty metrics
    overallDifficulty: calculateDifficulty(metrics, slopeRating, courseRating),
    drivingImportance: calculateDrivingImportance(metrics),
    approachImportance: calculateApproachImportance(metrics),
    shortGameImportance: calculateShortGameImportance(metrics),
    puttingImportance: calculatePuttingImportance(metrics),

    // Environmental factors
    windSensitivity: calculateWindSensitivity(metrics),
    penaltySeverity: calculatePenaltySeverity(metrics, slopeRating),

    // Scoring environment
    birdiePotential: calculateBirdiePotential(metrics, courseRating, slopeRating),
    scoringVolatility: calculateScoringVolatility(metrics, slopeRating),
  }

  return intelligence
}

/**
 * Hash for course intelligence cache invalidation.
 *
 * Returns a deterministic hash of the input data.
 * If any input changes, hash changes, invalidating cache.
 */
export function getCourseIntelligenceHash(input: CourseAnalysisInput): string {
  // Create a deterministic string of all relevant data
  const parts = [
    input.courseId,
    input.par,
    input.totalYardage,
    input.courseRating,
    input.slopeRating,
    input.courseStyle,
    input.greenSize,
    input.greenSpeed,
    input.elevation,
    // Holes sorted by number
    ...input.holes
      .sort((a, b) => a.holeNumber - b.holeNumber)
      .map((h) => `${h.holeNumber}:${h.par}:${h.yardage}:${h.handicap}`),
    // Tees sorted by yardage desc
    ...input.tees
      .sort((a, b) => (b.yardage ?? 0) - (a.yardage ?? 0))
      .map((t) => `${t.teeName}:${t.yardage}:${t.rating}:${t.slope}`),
  ].join("|")

  // Simple hash: sum of character codes modulo 2^32
  let hash = 0
  for (let i = 0; i < parts.length; i++) {
    const char = parts.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return hash.toString(36)
}
