/**
 * Course Intelligence types.
 *
 * Metrics represent both star ratings (1-5) and numeric scores (0-100).
 * All calculations are deterministic and data-driven.
 */

/**
 * Metric with both star rating and numeric score.
 */
export interface Metric {
  stars: 1 | 2 | 3 | 4 | 5
  score: number // 0-100
}

/**
 * Course Intelligence output.
 *
 * Analyzes imported course data and generates reusable characteristics.
 * Used throughout CaddieIQ for course context and player analysis.
 */
export interface CourseIntelligence {
  courseId: string
  generatedAt: Date

  // Primary difficulty metrics
  overallDifficulty: Metric
  drivingImportance: Metric
  approachImportance: Metric
  shortGameImportance: Metric
  puttingImportance: Metric

  // Environmental factors
  windSensitivity: Metric
  penaltySeverity: Metric

  // Scoring environment
  birdiePotential: Metric
  scoringVolatility: Metric
}

/**
 * Course data input for analysis.
 * Aggregated from CourseDetails, CourseHole[], and CourseTee[].
 */
export interface CourseAnalysisInput {
  courseId: string

  // Course specifications
  par?: number
  totalYardage?: number
  courseRating?: number
  slopeRating?: number

  // Playing conditions
  grassTypeFairway?: string
  grassTypeGreen?: string
  greenSize?: string
  greenSpeed?: string
  elevation?: number

  // Course characteristics
  courseStyle?: string
  architect?: string
  yearBuilt?: number

  // Hole details
  holes: HoleAnalysisData[]

  // Tee information
  tees: TeeAnalysisData[]
}

/**
 * Hole-level analysis data.
 */
export interface HoleAnalysisData {
  holeNumber: number
  par?: number
  yardage?: number
  handicap?: number
}

/**
 * Tee-level analysis data.
 */
export interface TeeAnalysisData {
  teeName: string
  yardage?: number
  rating?: number
  slope?: number
}

/**
 * Derived metrics for easier calculation.
 */
export interface DerivedMetrics {
  // Par distribution
  par3Count: number
  par4Count: number
  par5Count: number
  avgHoleLength: number
  frontNineYardage: number
  backNineYardage: number

  // Par 3 characteristics
  longPar3Count: number // > 200 yards
  avgPar3Length: number

  // Par 5 characteristics
  reachablePar5Count: number // < 540 yards
  avgPar5Length: number

  // Rating metrics
  avgSlope: number
  avgCourseRating: number
  ratingSpread: number // max - min

  // Course characteristics
  isLinksStyle: boolean
  isHighElevation: boolean // > 3000 ft
  hasFastGreens: boolean // Stimp 12+
  hasLargeGreens: boolean
  hasNarrowFairways: boolean

  // Handicap analysis
  avgHandicap: number
  handicapSpread: number
}
