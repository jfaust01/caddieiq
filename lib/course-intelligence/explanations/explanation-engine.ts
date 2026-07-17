/**
 * Explanation Engine — generates transparent explanations for each course intelligence metric.
 * Deterministic: identical input produces identical explanations.
 * No LLMs: pure rule-based templates and factor identification.
 */

import type { ExplainableMetric, RawExplanation, ExplanationGenerationInput, GeneratedExplanations } from './types'
import { formatFactorsForStorage, getAllExplainableMetrics, sortExplanations } from './utils'
import {
  generateDifficultyExplanation,
  generateDrivingExplanation,
  generateApproachExplanation,
  generateShortGameExplanation,
  generatePuttingExplanation,
  generateWindExplanation,
  generatePenaltyExplanation,
  generateBirdieExplanation,
  generateVolatilityExplanation,
} from './generators'

/**
 * Generate all explanations for a course.
 * @param input Explanation generation input with metrics and source data
 * @returns All 9 explanations sorted by metric order
 */
export function generateAllExplanations(input: ExplanationGenerationInput): RawExplanation[] {
  const explanations: RawExplanation[] = [
    generateDifficultyExplanation(input),
    generateDrivingExplanation(input),
    generateApproachExplanation(input),
    generateShortGameExplanation(input),
    generatePuttingExplanation(input),
    generateWindExplanation(input),
    generatePenaltyExplanation(input),
    generateBirdieExplanation(input),
    generateVolatilityExplanation(input),
  ]

  return sortExplanations(explanations)
}

/**
 * Generate explanation for a specific metric.
 * @param input Explanation generation input
 * @param metric Metric to explain
 * @returns Explanation or null if metric unknown
 */
export function generateExplanationForMetric(
  input: ExplanationGenerationInput,
  metric: ExplainableMetric
): RawExplanation | null {
  switch (metric) {
    case 'overallDifficulty':
      return generateDifficultyExplanation(input)
    case 'drivingImportance':
      return generateDrivingExplanation(input)
    case 'approachImportance':
      return generateApproachExplanation(input)
    case 'shortGameImportance':
      return generateShortGameExplanation(input)
    case 'puttingImportance':
      return generatePuttingExplanation(input)
    case 'windSensitivity':
      return generateWindExplanation(input)
    case 'penaltySeverity':
      return generatePenaltyExplanation(input)
    case 'birdiePotential':
      return generateBirdieExplanation(input)
    case 'scoringVolatility':
      return generateVolatilityExplanation(input)
    default:
      return null
  }
}

/**
 * Get list of all explainable metrics.
 */
export function getExplainableMetrics(): ExplainableMetric[] {
  return getAllExplainableMetrics() as ExplainableMetric[]
}

/**
 * Convert generated explanations for persistence.
 * Formats contributing factors as bullet-list strings.
 */
export function prepareExplanationsForStorage(explanations: RawExplanation[]): Array<{
  metric: string
  title: string
  summary: string
  contributingFactors: string
}> {
  return explanations.map(exp => ({
    metric: exp.metric,
    title: exp.title,
    summary: exp.summary,
    contributingFactors: formatFactorsForStorage(exp.contributingFactors),
  }))
}

/**
 * Validate that all required metrics have explanations.
 */
export function validateExplanations(explanations: RawExplanation[]): { valid: boolean; missing: string[] } {
  const requiredMetrics = getAllExplainableMetrics()
  const providedMetrics = explanations.map(e => e.metric)
  const missing = requiredMetrics.filter(m => !providedMetrics.includes(m))

  return {
    valid: missing.length === 0,
    missing,
  }
}
