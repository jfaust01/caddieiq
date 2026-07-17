/**
 * Course Metric Explanation types.
 * Provides transparent, deterministic explanations for each intelligence metric.
 */

/**
 * Metric identifiers that can be explained.
 */
export type ExplainableMetric =
  | 'overallDifficulty'
  | 'drivingImportance'
  | 'approachImportance'
  | 'shortGameImportance'
  | 'puttingImportance'
  | 'windSensitivity'
  | 'penaltySeverity'
  | 'birdiePotential'
  | 'scoringVolatility'

/**
 * Raw explanation before persistence.
 */
export interface RawExplanation {
  metric: ExplainableMetric
  title: string
  summary: string
  contributingFactors: string[] // Array of bullet points
}

/**
 * Persisted explanation record from database.
 */
export interface CourseMetricExplanationRecord {
  id: string
  courseIntelligenceId: string
  metric: string
  title: string
  summary: string
  contributingFactors: string
  calculationVersion: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Input for explanation generation.
 * Contains both scores/stars and source data for factor identification.
 */
export interface ExplanationGenerationInput {
  courseId: string
  
  // Current metric values
  overallDifficultyScore: number
  overallDifficultyStars: number
  
  drivingImportanceScore: number
  drivingImportanceStars: number
  
  approachImportanceScore: number
  approachImportanceStars: number
  
  shortGameImportanceScore: number
  shortGameImportanceStars: number
  
  puttingImportanceScore: number
  puttingImportanceStars: number
  
  windSensitivityScore: number
  windSensitivityStars: number
  
  penaltySeverityScore: number
  penaltySeverityStars: number
  
  birdiePotentialScore: number
  birdiePotentialStars: number
  
  scoringVolatilityScore: number
  scoringVolatilityStars: number
  
  // Source data for factor identification
  par?: number
  slope?: number
  courseRating?: number
  yardage?: number
  greenSize?: string
  fairwayWidth?: string
  linksStyle?: boolean
  elevation?: string
  hazardCount?: number
  bunkerCount?: number
  waterHazards?: number
  handicapSpread?: number
  averageHandicap?: number
  parDistribution?: {
    par3Count: number
    par4Count: number
    par5Count: number
  }
  reachablePar5s?: number
  averageHoleLength?: number
}

/**
 * Collection of explanations for a course.
 */
export interface GeneratedExplanations {
  courseIntelligenceId: string
  explanations: RawExplanation[]
}

/**
 * Explanation with contributing factors parsed for display.
 */
export interface DisplayExplanation {
  metric: ExplainableMetric
  title: string
  summary: string
  factors: string[]
  score: number
  stars: number
}
