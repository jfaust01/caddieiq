/**
 * Weight math for the Model Lab.
 *
 * Weights are edited as whole-number percentages per pillar. When a model runs,
 * `toModelWeights` collapses the enabled pillars into normalized fractions that
 * sum to 1, keyed by analytics metric — exactly what the preview calculator
 * blends against each player's real analytics scores. Disabled or zero-weight
 * pillars are omitted.
 */

import type { MetricGroupKey, ModelMetric, ModelWeightMap } from '../types'
import { METRIC_GROUP_BY_KEY } from './metric-groups'

/** Total weight of the enabled metrics, as a percentage. */
export function totalWeight(metrics: ModelMetric[]): number {
  return metrics.reduce(
    (sum, metric) => (metric.enabled ? sum + metric.weight : sum),
    0,
  )
}

/** Count of enabled metrics carrying a non-zero weight. */
export function activeMetricCount(metrics: ModelMetric[]): number {
  return metrics.filter((metric) => metric.enabled && metric.weight > 0).length
}

/** Whether the enabled weights sum to more than 100%. */
export function isOverweight(metrics: ModelMetric[]): boolean {
  return totalWeight(metrics) > 100
}

/**
 * Scale enabled weights so they sum to 100% (rounded to whole numbers, with any
 * rounding remainder folded into the largest weight). Disabled metrics keep a
 * weight of 0. If nothing is enabled, the metrics are returned unchanged.
 */
export function normalizeWeights(metrics: ModelMetric[]): ModelMetric[] {
  const total = totalWeight(metrics)
  if (total === 0) return metrics

  let running = 0
  let largestIndex = -1
  let largestValue = -1

  const scaled = metrics.map((metric, index) => {
    if (!metric.enabled || metric.weight === 0) {
      return { ...metric, weight: metric.enabled ? metric.weight : 0 }
    }
    const value = Math.round((metric.weight / total) * 100)
    running += value
    if (metric.weight > largestValue) {
      largestValue = metric.weight
      largestIndex = index
    }
    return { ...metric, weight: value }
  })

  // Fold the rounding remainder into the largest contributor.
  const remainder = 100 - running
  if (remainder !== 0 && largestIndex >= 0) {
    scaled[largestIndex] = {
      ...scaled[largestIndex],
      weight: Math.max(0, scaled[largestIndex].weight + remainder),
    }
  }

  return scaled
}

/**
 * Collapse a model's metric weights into normalized fractions (summing to 1)
 * keyed by analytics metric. Disabled or zero-weight pillars are omitted. The
 * preview calculator renormalizes per player over whichever of these metrics
 * that player actually has data for, so the raw percentages only need to be
 * relative — but returning fractions keeps the blended score on the 0–100
 * scale.
 */
export function toModelWeights(metrics: ModelMetric[]): ModelWeightMap {
  const raw: ModelWeightMap = {}
  let total = 0

  for (const metric of metrics) {
    if (!metric.enabled || metric.weight <= 0) continue
    const { key } = METRIC_GROUP_BY_KEY[metric.key]
    raw[key] = (raw[key] ?? 0) + metric.weight
    total += metric.weight
  }

  if (total === 0) return {}

  const normalized: ModelWeightMap = {}
  for (const key of Object.keys(raw) as MetricGroupKey[]) {
    normalized[key] = (raw[key] as number) / total
  }
  return normalized
}

/** Build a full metric list from a partial weight map (used by templates). */
export function buildMetrics(
  weights: Partial<Record<MetricGroupKey, number>>,
): ModelMetric[] {
  return (Object.keys(METRIC_GROUP_BY_KEY) as MetricGroupKey[]).map((key) => {
    const weight = weights[key] ?? 0
    return { key, enabled: weight > 0, weight }
  })
}
