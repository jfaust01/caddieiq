/**
 * Standardized Feature Sources
 * Every feature must reference one of these sources
 */
export enum FeatureSource {
  SPORTSDATAIO = 'sportsdataio',
  GOLFCOURSEAPI = 'golfcourseapi',
  DERIVED = 'derived',
  HISTORICAL = 'historical',
  SIMULATION = 'simulation',
  MANUAL = 'manual',
}

/**
 * Confidence Level Thresholds
 * Based on data point count and quality
 */
export const CONFIDENCE_THRESHOLDS = {
  // Tournament count thresholds
  TOURNAMENT_COUNT: {
    LOW: { min: 0, max: 3 },
    MEDIUM: { min: 4, max: 12 },
    HIGH: { min: 13, max: Infinity },
  },
  // General data sufficiency ratios
  DATA_POINT_RATIO: {
    LOW: 0.25, // < 25% of possible data points
    MEDIUM: 0.5, // 25-50% of possible data points
    HIGH: 0.75, // 50-75% of possible data points
    EXCELLENT: 0.9, // > 90% of possible data points
  },
} as const

/**
 * Calculate confidence level based on tournament count
 */
export function calculateTournamentConfidence(count: number): number {
  if (count <= CONFIDENCE_THRESHOLDS.TOURNAMENT_COUNT.LOW.max) {
    return 40 // LOW confidence for very few tournaments
  }
  if (count <= CONFIDENCE_THRESHOLDS.TOURNAMENT_COUNT.MEDIUM.max) {
    return 70 // MEDIUM confidence
  }
  return 90 // HIGH confidence for 13+ tournaments
}

/**
 * Calculate confidence based on data completeness ratio
 */
export function calculateDataRatioConfidence(validDataPoints: number, totalPossible: number): number {
  if (totalPossible === 0) return 0
  const ratio = validDataPoints / totalPossible
  
  if (ratio < CONFIDENCE_THRESHOLDS.DATA_POINT_RATIO.LOW) return 30
  if (ratio < CONFIDENCE_THRESHOLDS.DATA_POINT_RATIO.MEDIUM) return 50
  if (ratio < CONFIDENCE_THRESHOLDS.DATA_POINT_RATIO.HIGH) return 70
  return 90
}
