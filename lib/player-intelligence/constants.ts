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
 * 
 * Explicit boundaries:
 * - count = 0: 0% confidence
 * - count 1–3: 40% confidence (LOW)
 * - count 4–12: 70% confidence (MEDIUM)
 * - count 13+: 90% confidence (HIGH)
 */
export function calculateTournamentConfidence(count: number): number {
  if (count === 0) return 0
  if (count >= 1 && count <= 3) return 40
  if (count >= 4 && count <= 12) return 70
  if (count >= 13) return 90
  return 0 // unreachable but safe default
}

/**
 * Calculate confidence based on data completeness ratio
 * 
 * Explicit boundaries:
 * - ratio = 0: 0% confidence
 * - ratio >0 and <25%: 30% confidence
 * - ratio 25% through <50%: 50% confidence
 * - ratio 50% through <75%: 70% confidence
 * - ratio 75%+: 90% confidence
 */
export function calculateDataRatioConfidence(validDataPoints: number, totalPossible: number): number {
  if (totalPossible === 0) return 0
  const ratio = validDataPoints / totalPossible
  
  if (ratio === 0) return 0
  if (ratio > 0 && ratio < 0.25) return 30
  if (ratio >= 0.25 && ratio < 0.5) return 50
  if (ratio >= 0.5 && ratio < 0.75) return 70
  if (ratio >= 0.75) return 90
  return 0 // unreachable but safe default
}
