/**
 * Course Intelligence Metrics - Central Index
 * Exports all 20+ metric calculators for use in the main engine
 */

export type { MetricResult, CourseHoleStats, CourseTeeStats, CourseData, CourseInsightTag } from "./types"

// Difficulty Metrics
export {
  calculateDifficulty,
  calculateScoringDifficulty,
  calculateBogeyRisk,
  calculateVariance,
} from "./difficulty"

// Fairway & Iron Metrics
export {
  calculateFairwayWidth,
  calculateIronDifficulty,
  calculatePuttingDifficulty,
} from "./fairway-iron"

// Hazard Metrics
export {
  calculateWaterHazardRisk,
  calculateSandHazardRisk,
  calculateTreeRisk,
  calculateOutOfBoundsRisk,
  calculateHazardImpact,
} from "./hazards"

// Characteristics Metrics
export {
  calculateElevationImpact,
  calculateWeatherFactor,
  calculatePlayability,
  calculateUniqueness,
} from "./characteristics"

/**
 * All metric calculations (16 deterministic metrics)
 * Each returns MetricResult { score 0-100, stars 1-5, confidence 0-100, explanation, dataPoints }
 */
export const ALL_METRICS = [
  "difficulty",
  "scoringDifficulty",
  "bogeyRisk",
  "variance",
  "fairwayWidth",
  "ironDifficulty",
  "puttingDifficulty",
  "waterHazardRisk",
  "sandHazardRisk",
  "treeRisk",
  "outOfBoundsRisk",
  "hazardImpact",
  "elevationImpact",
  "weatherFactor",
  "playability",
  "uniqueness",
] as const

export type MetricName = (typeof ALL_METRICS)[number]
