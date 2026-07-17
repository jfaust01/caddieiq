/**
 * Utilities for explanation generation and formatting.
 */

import type { RawExplanation } from './types'

/**
 * Format contributing factors array as bullet-list string.
 * Used for database persistence.
 */
export function formatFactorsForStorage(factors: string[]): string {
  return factors.map(f => `• ${f}`).join('\n')
}

/**
 * Parse contributing factors string into array.
 * Used when reading from database for display.
 */
export function parseFactorsFromStorage(stored: string): string[] {
  return stored
    .split('\n')
    .map(line => line.replace(/^• /, '').trim())
    .filter(line => line.length > 0)
}

/**
 * Get all explainable metric identifiers.
 */
export function getAllExplainableMetrics(): string[] {
  return [
    'overallDifficulty',
    'drivingImportance',
    'approachImportance',
    'shortGameImportance',
    'puttingImportance',
    'windSensitivity',
    'penaltySeverity',
    'birdiePotential',
    'scoringVolatility',
  ]
}

/**
 * Get human-readable metric label.
 */
export function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    overallDifficulty: 'Overall Difficulty',
    drivingImportance: 'Driving Importance',
    approachImportance: 'Approach Importance',
    shortGameImportance: 'Short Game Importance',
    puttingImportance: 'Putting Importance',
    windSensitivity: 'Wind Sensitivity',
    penaltySeverity: 'Penalty Severity',
    birdiePotential: 'Birdie Potential',
    scoringVolatility: 'Scoring Volatility',
  }
  return labels[metric] || metric
}

/**
 * Identify key factors based on score thresholds.
 * Returns array of factor descriptions.
 */
export function identifyKeyFactors(
  score: number,
  factors: Record<string, number | boolean | string | undefined>,
  thresholds: Record<string, { high: number; low: number }>
): string[] {
  const identified: string[] = []

  // Check each factor against thresholds
  for (const [factor, value] of Object.entries(factors)) {
    if (value === undefined || value === null) continue

    const threshold = thresholds[factor]
    if (!threshold) continue

    if (typeof value === 'number') {
      if (value >= threshold.high) {
        identified.push(`High ${factor}`)
      } else if (value <= threshold.low) {
        identified.push(`Low ${factor}`)
      }
    } else if (typeof value === 'boolean' && value === true) {
      identified.push(`${factor} present`)
    }
  }

  return identified
}

/**
 * Sort explanations by importance and metric order.
 */
export function sortExplanations(explanations: RawExplanation[]): RawExplanation[] {
  const metricOrder: Record<string, number> = {
    overallDifficulty: 0,
    drivingImportance: 1,
    approachImportance: 2,
    shortGameImportance: 3,
    puttingImportance: 4,
    windSensitivity: 5,
    penaltySeverity: 6,
    birdiePotential: 7,
    scoringVolatility: 8,
  }

  return [...explanations].sort(
    (a, b) => (metricOrder[a.metric] ?? 999) - (metricOrder[b.metric] ?? 999)
  )
}
