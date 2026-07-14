/**
 * RankingsService — the feature-level read API that turns raw Ranking Engine
 * output into enriched, render-ready {@link RankingView}s and insight cards.
 *
 * It calls the shared {@link rankingService} (from `@/lib/ranking`) twice:
 *   1. for the requested type — to get ordering, composite score, movement, and
 *      the placeholder explanation, and
 *   2. for the `overall` type — whose breakdown always contains every module,
 *      so the table's fixed columns (Recent Form / Course Fit / Value, plus the
 *      insight metrics) populate regardless of the active ranking's weighting.
 *
 * No real analytics, no database, no external APIs — the engine returns
 * deterministic mock values.
 * TODO(data): drop the `overall` reference pass and read real per-module scores
 * once live analytics feed the engine.
 */

import type { AnalyticsModuleKey } from '@/lib/analytics/shared/types'
import { rankingService, type PlayerRankingResult, type RankingType } from '@/lib/ranking'

import {
  RANKING_PLAYER_METADATA,
  fallbackMetadata,
} from './ranking-metadata'
import type {
  RankingInsight,
  RankingModuleScores,
  RankingRow,
  RankingView,
} from '../types'

/** Extract a module→value (0–100) map from a result's weighted breakdown. */
function moduleScoresFromResult(
  result: PlayerRankingResult,
): Partial<Record<AnalyticsModuleKey, number>> {
  const scores: Partial<Record<AnalyticsModuleKey, number>> = {}
  for (const metric of result.score.metrics) {
    scores[metric.module] = metric.value
  }
  return scores
}

/** Flatten a partial module map into the fixed {@link RankingModuleScores}. */
function toModuleScores(
  partial: Partial<Record<AnalyticsModuleKey, number>>,
): RankingModuleScores {
  return {
    recentForm: partial['recent-form'] ?? 0,
    courseFit: partial['course-fit'] ?? 0,
    value: partial.value ?? 0,
    momentum: partial.momentum ?? 0,
    wind: partial.wind ?? 0,
    strokesGained: partial['strokes-gained'] ?? 0,
    consistency: partial.consistency ?? 0,
  }
}

/**
 * Fetch a fully enriched ranking view for a type. Async to mirror the future
 * live data API, even though the underlying values are synchronous mock output.
 */
export async function getRankingView(type: RankingType): Promise<RankingView> {
  const [primary, reference] = await Promise.all([
    rankingService.getRanking(type),
    rankingService.getRanking('overall'),
  ])

  // Reference (overall) always includes every module — use it for the columns.
  const referenceScores = new Map<string, RankingModuleScores>()
  for (const result of reference.results) {
    referenceScores.set(
      result.playerId,
      toModuleScores(moduleScoresFromResult(result)),
    )
  }

  const results: RankingRow[] = primary.results.map((result) => {
    const meta =
      RANKING_PLAYER_METADATA[result.playerId] ??
      fallbackMetadata(result.playerId, result.label)
    const moduleScores =
      referenceScores.get(result.playerId) ??
      toModuleScores(moduleScoresFromResult(result))

    return {
      rank: result.rank,
      previousRank: result.previousRank,
      movement: result.movement,
      delta: result.delta,
      playerId: result.playerId,
      name: meta.name,
      nationality: meta.nationality,
      tour: meta.tour,
      events: meta.events,
      headshotUrl: meta.headshotUrl,
      recentForm: meta.recentForm,
      overallScore: result.score.overall,
      confidence: result.score.confidence,
      moduleScores,
      explanation: result.explanation,
    }
  })

  return {
    type: primary.type,
    results,
    weights: primary.weights,
    generatedAt: primary.generatedAt,
    mock: primary.mock,
  }
}

/** Top-N helper that maps rows into insight entries with a formatted metric. */
function topEntries(
  rows: RankingRow[],
  sortValue: (row: RankingRow) => number,
  format: (row: RankingRow) => string,
  detail?: (row: RankingRow) => string,
  limit = 3,
) {
  return [...rows]
    .sort((a, b) => sortValue(b) - sortValue(a))
    .slice(0, limit)
    .map((row) => ({
      playerId: row.playerId,
      name: row.name,
      nationality: row.nationality,
      value: format(row),
      detail: detail?.(row),
    }))
}

/**
 * Derive the insight-panel cards from the full (unfiltered) result set so they
 * stay stable as the user filters the table.
 */
export function buildInsights(rows: RankingRow[]): RankingInsight[] {
  if (rows.length === 0) return []

  const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`)
  const score = (n: number) => `${Math.round(n)}`

  return [
    {
      kind: 'risers',
      title: 'Biggest Risers',
      description: 'Largest jumps since the previous snapshot.',
      entries: topEntries(
        rows.filter((row) => row.delta > 0),
        (row) => row.delta,
        (row) => signed(row.delta),
        (row) => `Now #${row.rank}`,
      ),
    },
    {
      kind: 'fallers',
      title: 'Biggest Fallers',
      description: 'Largest drops since the previous snapshot.',
      entries: topEntries(
        rows.filter((row) => row.delta < 0),
        (row) => -row.delta,
        (row) => signed(row.delta),
        (row) => `Now #${row.rank}`,
      ),
    },
    {
      kind: 'value',
      title: 'Best Value',
      description: 'Model strength outpacing market price.',
      entries: topEntries(
        rows,
        (row) => row.moduleScores.value,
        (row) => score(row.moduleScores.value),
        () => 'Value score',
      ),
    },
    {
      kind: 'form',
      title: 'Strongest Recent Form',
      description: 'Hottest players over their last several starts.',
      entries: topEntries(
        rows,
        (row) => row.moduleScores.recentForm,
        (row) => score(row.moduleScores.recentForm),
        () => 'Form score',
      ),
    },
    {
      kind: 'course',
      title: 'Course Specialists',
      description: 'Best fit for the current venue profile.',
      entries: topEntries(
        rows,
        (row) => row.moduleScores.courseFit,
        (row) => score(row.moduleScores.courseFit),
        () => 'Course-fit score',
      ),
    },
    {
      kind: 'wind',
      title: 'Wind Specialists',
      description: 'Expected to hold up best in windy conditions.',
      entries: topEntries(
        rows,
        (row) => row.moduleScores.wind,
        (row) => score(row.moduleScores.wind),
        () => 'Wind score',
      ),
    },
  ]
}
