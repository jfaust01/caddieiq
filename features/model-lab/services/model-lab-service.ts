/**
 * Model Lab service — the seam between a user-built {@link Model} and the shared
 * Ranking Engine (`@/lib/ranking`).
 *
 * `runModelPreview` maps a model's metric weights into the engine's module
 * weights and runs a `"model"` ranking. The engine returns realistic,
 * deterministic **mock** rankings — no real calculations, no database, and no
 * external APIs. The math is pure, so this safely runs on the client for a live
 * preview as weights change.
 *
 * TODO(data): once the data platform lands, feed real players and live
 * analytics into the engine instead of the built-in mock roster.
 */

import { rankingService } from '@/lib/ranking'

import type { Model, ModelPreview, ModelSummary } from '../types'
import {
  activeMetricCount,
  isOverweight,
  toRankingWeights,
  totalWeight,
} from '../utils/weights'
import { METRIC_GROUP_KEYS } from '../utils/metric-groups'

export interface RunModelOptions {
  /** Cap the number of preview rows (e.g. Top 10). */
  limit?: number
}

/**
 * Run a model through the Ranking Engine and return a preview. Async to mirror
 * the future live-data API even though the underlying values are synchronous
 * mock output.
 */
export async function runModelPreview(
  model: Model,
  options: RunModelOptions = {},
): Promise<ModelPreview> {
  const weights = toRankingWeights(model.metrics)

  // TODO(model): persist the model and resolve it by id so the engine can read
  // its weights from the registry; for now we pass weights inline.
  const result = await rankingService.getRanking('model', {
    weights,
    limit: options.limit,
    scope: { label: model.name },
  })

  return {
    rows: result.results.map((row) => ({
      rank: row.rank,
      playerId: row.playerId,
      name: row.label,
      score: Math.round(row.score.overall),
      movement: row.movement,
      delta: row.delta,
    })),
    weights: result.weights,
    generatedAt: result.generatedAt,
    mock: result.mock,
  }
}

/** Derive the summary-card metrics for a model. */
export function buildModelSummary(model: Model): ModelSummary {
  const total = totalWeight(model.metrics)
  const active = activeMetricCount(model.metrics)

  // Placeholder confidence heuristic based on coverage and balance.
  // TODO(ai): replace with a real confidence estimate from backtesting.
  let confidence: ModelSummary['confidence'] = 'low'
  if (active >= 5 && total >= 80 && total <= 110) confidence = 'high'
  else if (active >= 3) confidence = 'medium'

  return {
    totalMetrics: METRIC_GROUP_KEYS.length,
    activeMetrics: active,
    totalWeight: total,
    overweight: isOverweight(model.metrics),
    confidence,
  }
}
