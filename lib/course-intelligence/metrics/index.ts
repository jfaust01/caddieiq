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

// Strategy Metrics (game emphasis)
export {
  calculateDrivingImportance,
  calculateApproachImportance,
  calculateShortGameImportance,
  calculatePuttingImportance,
} from "./strategy"

// Environmental & Scoring Metrics
export {
  calculateWindSensitivity,
  calculatePenaltySeverity,
  calculateBirdiePotential,
  calculateScoringVolatility,
} from "./environmental"

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
 * All metric calculations (20+ deterministic metrics)
 * Each returns MetricResult { score 0-100, stars 1-5, confidence 0-100, explanation, dataPoints }
 */
export const ALL_METRICS = [
  // Difficulty Metrics
  "difficulty",
  "scoringDifficulty",
  "bogeyRisk",
  "variance",
  
  // Strategy Metrics
  "drivingImportance",
  "approachImportance",
  "shortGameImportance",
  "puttingImportance",
  
  // Environmental & Scoring
  "windSensitivity",
  "penaltySeverity",
  "birdiePotential",
  "scoringVolatility",
  
  // Fairway & Iron
  "fairwayWidth",
  "ironDifficulty",
  "puttingDifficulty",
  
  // Hazards
  "waterHazardRisk",
  "sandHazardRisk",
  "treeRisk",
  "outOfBoundsRisk",
  "hazardImpact",
  
  // Characteristics
  "elevationImpact",
  "weatherFactor",
  "playability",
  "uniqueness",
] as const

export type MetricName = (typeof ALL_METRICS)[number]
