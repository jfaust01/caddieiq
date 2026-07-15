/**
 * Client-safe Model Lab helpers.
 *
 * The ranking preview itself is a server action (see `preview-action.ts`) so it
 * can read the Analytics Engine; this module holds only the pure, presentation
 * helpers the client needs — currently the summary-card derivation. Keeping it
 * free of any server-only import lets the builder import it directly.
 */

import type { Model, ModelSummary } from '../types'
import {
  activeMetricCount,
  isOverweight,
  totalWeight,
} from '../utils/weights'
import { METRIC_GROUP_KEYS } from '../utils/metric-groups'

/** Derive the summary-card metrics for a model. */
export function buildModelSummary(model: Model): ModelSummary {
  const total = totalWeight(model.metrics)
  const active = activeMetricCount(model.metrics)

  // Coverage-based confidence: a model that spreads meaningful weight across
  // most pillars and sums near 100% is a more robust re-weighting than one that
  // leans on a single pillar. This describes the model's CONFIGURATION, not a
  // claim about any player's data.
  let confidence: ModelSummary['confidence'] = 'low'
  if (active >= 3 && total >= 80 && total <= 110) confidence = 'high'
  else if (active >= 2) confidence = 'medium'

  return {
    totalMetrics: METRIC_GROUP_KEYS.length,
    activeMetrics: active,
    totalWeight: total,
    overweight: isOverweight(model.metrics),
    confidence,
  }
}
