/**
 * Course Intelligence Metrics Engine
 * Orchestrates calculation of all 16+ metrics for a course
 * Returns deterministic, data-driven intelligence scores
 */

import {
  calculateDifficulty,
  calculateScoringDifficulty,
  calculateBogeyRisk,
  calculateVariance,
  calculateFairwayWidth,
  calculateIronDifficulty,
  calculatePuttingDifficulty,
  calculateWaterHazardRisk,
  calculateSandHazardRisk,
  calculateTreeRisk,
  calculateOutOfBoundsRisk,
  calculateHazardImpact,
  calculateElevationImpact,
  calculateWeatherFactor,
  calculatePlayability,
  calculateUniqueness,
  type CourseData,
  type MetricResult,
} from "./metrics"

export interface CalculatedMetrics {
  // Core difficulty metrics
  difficulty: MetricResult
  scoringDifficulty: MetricResult
  bogeyRisk: MetricResult
  variance: MetricResult

  // Fairway & approach metrics
  fairwayWidth: MetricResult
  ironDifficulty: MetricResult
  puttingDifficulty: MetricResult

  // Hazard metrics
  waterHazardRisk: MetricResult
  sandHazardRisk: MetricResult
  treeRisk: MetricResult
  outOfBoundsRisk: MetricResult
  hazardImpact: MetricResult

  // Characteristics
  elevationImpact: MetricResult
  weatherFactor: MetricResult
  playability: MetricResult
  uniqueness: MetricResult

  // Overall statistics
  dataCompleteness: number
}

export class CourseIntelligenceEngine {
  /**
   * Calculate all intelligence metrics for a course
   * Returns deterministic results from course data
   */
  static calculateMetrics(course: CourseData): CalculatedMetrics {
    console.log(`[v0] Calculating intelligence metrics for: ${course.name}`)

    // Calculate all metrics in parallel groups
    const metrics: CalculatedMetrics = {
      // Difficulty metrics
      difficulty: calculateDifficulty(course),
      scoringDifficulty: calculateScoringDifficulty(course),
      bogeyRisk: calculateBogeyRisk(course),
      variance: calculateVariance(course),

      // Fairway & approach metrics
      fairwayWidth: calculateFairwayWidth(course),
      ironDifficulty: calculateIronDifficulty(course),
      puttingDifficulty: calculatePuttingDifficulty(course),

      // Hazard metrics
      waterHazardRisk: calculateWaterHazardRisk(course),
      sandHazardRisk: calculateSandHazardRisk(course),
      treeRisk: calculateTreeRisk(course),
      outOfBoundsRisk: calculateOutOfBoundsRisk(course),
      hazardImpact: calculateHazardImpact(course),

      // Characteristics
      elevationImpact: calculateElevationImpact(course),
      weatherFactor: calculateWeatherFactor(course),
      playability: calculatePlayability(course),
      uniqueness: calculateUniqueness(course),

      // Data completeness
      dataCompleteness: this.calculateDataCompleteness(course),
    }

    console.log(`[v0] Metrics calculated. Overall difficulty: ${metrics.difficulty.score}/100`)

    return metrics
  }

  /**
   * Calculate data completeness percentage
   * Indicates confidence in the metrics (higher = more data available)
   */
  static calculateDataCompleteness(course: CourseData): number {
    let completeness = 0
    let maxCompleteness = 0

    // Course foundation (20 points)
    if (course.name) completeness += 5
    maxCompleteness += 5
    if (course.holes.length > 0) completeness += 5
    maxCompleteness += 5
    if (course.tees.length > 0) completeness += 5
    maxCompleteness += 5
    if (course.address) completeness += 5
    maxCompleteness += 5

    // Location data (20 points)
    if (course.coordinates) completeness += 10
    maxCompleteness += 10
    if (course.address?.elevation !== null && course.address?.elevation !== undefined) completeness += 10
    maxCompleteness += 10

    // Hole data (25 points)
    const holesWithPar = course.holes.filter((h) => h.par > 0).length
    const holesWithYardage = course.holes.filter((h) => h.yardage > 0).length
    const holesWithHandicap = course.holes.filter((h) => h.handicap > 0).length

    if (holesWithPar === course.holes.length) completeness += 8
    maxCompleteness += 8
    if (holesWithYardage === course.holes.length) completeness += 8
    maxCompleteness += 8
    if (holesWithHandicap === course.holes.length) completeness += 9
    maxCompleteness += 9

    // Tee data (20 points)
    const teesWithRating = course.tees.filter((t) => t.rating > 0).length
    const teesWithSlope = course.tees.filter((t) => t.slope > 0).length

    if (teesWithRating === course.tees.length) completeness += 10
    maxCompleteness += 10
    if (teesWithSlope === course.tees.length) completeness += 10
    maxCompleteness += 10

    // Hazard data (15 points)
    if (course.hazardCounts?.water !== undefined) completeness += 3
    maxCompleteness += 3
    if (course.hazardCounts?.sand !== undefined) completeness += 4
    maxCompleteness += 4
    if (course.hazardCounts?.trees !== undefined) completeness += 4
    maxCompleteness += 4
    if (course.hazardCounts?.outOfBounds !== undefined) completeness += 4
    maxCompleteness += 4

    return maxCompleteness > 0 ? Math.round((completeness / maxCompleteness) * 100) : 0
  }

  /**
   * Get average difficulty across all difficulty-related metrics
   */
  static getAverageDifficulty(metrics: CalculatedMetrics): number {
    const difficultyMetrics = [
      metrics.difficulty.score,
      metrics.scoringDifficulty.score,
      metrics.bogeyRisk.score,
      metrics.variance.score,
      metrics.fairwayWidth.score,
      metrics.ironDifficulty.score,
      metrics.puttingDifficulty.score,
    ]

    return Math.round(difficultyMetrics.reduce((a, b) => a + b, 0) / difficultyMetrics.length)
  }

  /**
   * Get average hazard difficulty
   */
  static getAverageHazardRisk(metrics: CalculatedMetrics): number {
    const hazardMetrics = [
      metrics.waterHazardRisk.score,
      metrics.sandHazardRisk.score,
      metrics.treeRisk.score,
      metrics.outOfBoundsRisk.score,
    ]

    return Math.round(hazardMetrics.reduce((a, b) => a + b, 0) / hazardMetrics.length)
  }

  /**
   * Get high-level difficulty summary (beginner-friendly through championship)
   */
  static getDifficultySummary(score: number): string {
    if (score < 20) return "Beginner-Friendly"
    if (score < 40) return "Easy"
    if (score < 60) return "Moderate"
    if (score < 80) return "Challenging"
    return "Championship"
  }

  /**
   * Get star rating from numeric score
   */
  static getStarRating(score: number): number {
    return Math.ceil((score / 100) * 5)
  }
}
