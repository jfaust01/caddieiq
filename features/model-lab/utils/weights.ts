/**
 * Weight math for the Model Lab.
 *
 * Weights are edited as whole-number percentages per metric group. When a model
 * is run, `toRankingWeights` collapses the ten groups into the seven analytics
 * modules the Ranking Engine understands (the three strokes-gained sub-groups
 * sum into `strokes-gained`). The engine normalizes the result, so these values
 * only need to be relative.
 */

import type { AnalyticsModuleKey } from '@/lib/analytics/shared/types'
import type { RankingWeights } from '@/lib/ranking'

import type { MetricGroupKey, ModelMetric } from '../types'
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
 * Collapse a model's metric weights into the seven analytics module weights the
 * Ranking Engine consumes. Disabled or zero-weight groups are omitted; the
 * strokes-gained sub-groups accumulate into `strokes-gained`.
 */
export function toRankingWeights(metrics: ModelMetric[]): RankingWeights {
  const weights: Partial<Record<AnalyticsModuleKey, number>> = {}

  for (const metric of metrics) {
    if (!metric.enabled || metric.weight <= 0) continue
    const { module } = METRIC_GROUP_BY_KEY[metric.key]
    weights[module] = (weights[module] ?? 0) + metric.weight
  }

  return weights
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
