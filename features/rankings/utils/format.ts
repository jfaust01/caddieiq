/**
 * Presentation helpers for the Rankings feature. Pure functions only — safe on
 * both server and client.
 */

import type {
  AnalyticsModuleKey,
  ConfidenceLevel,
} from '@/lib/analytics/shared/types'
import type { RankingMovement, RankingWeights } from '@/lib/ranking'

import type { RankingModuleScores, RankingRow } from '../types'

export type Tone = 'success' | 'warning' | 'muted' | 'default' | 'destructive'

/** A prepared per-module contribution row for the detail breakdown. */
export interface MetricRow {
  key: AnalyticsModuleKey
  label: string
  value: number
  weight: number
}

/** Maps the flat module-score keys back to analytics module keys + labels. */
const MODULE_META: Record<
  keyof RankingModuleScores,
  { key: AnalyticsModuleKey; label: string }
> = {
  recentForm: { key: 'recent-form', label: 'Recent Form' },
  courseFit: { key: 'course-fit', label: 'Course Fit' },
  value: { key: 'value', label: 'Value' },
  momentum: { key: 'momentum', label: 'Momentum' },
  wind: { key: 'wind', label: 'Wind Performance' },
  strokesGained: { key: 'strokes-gained', label: 'Strokes Gained' },
  consistency: { key: 'consistency', label: 'Consistency' },
}

/**
 * Combine a row's flat module scores with the ranking type's weights into a
 * sorted (by weight, then score) list for the detail breakdown panel.
 */
export function buildMetricRows(
  scores: RankingModuleScores,
  weights: RankingWeights,
): MetricRow[] {
  return (
    Object.entries(scores) as [keyof RankingModuleScores, number][]
  )
    .map(([scoreKey, value]) => {
      const meta = MODULE_META[scoreKey]
      return {
        key: meta.key,
        label: meta.label,
        value,
        weight: weights[meta.key] ?? 0,
      }
    })
    .sort((a, b) => b.weight - a.weight || b.value - a.value)
}

/** Display a 0–100 score as a rounded integer. */
export function formatScore(value: number): string {
  return `${Math.round(value)}`
}

/** Signed integer, e.g. 4 -> "+4", -2 -> "-2", 0 -> "0". */
export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`
  return `${delta}`
}

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
}

export function confidenceLabel(level: ConfidenceLevel): string {
  return CONFIDENCE_LABELS[level]
}

export function confidenceTone(level: ConfidenceLevel): Tone {
  switch (level) {
    case 'high':
      return 'success'
    case 'medium':
      return 'warning'
    case 'low':
      return 'muted'
  }
}

/** Accessible description of a rank movement. */
export function movementLabel(movement: RankingMovement, delta: number): string {
  switch (movement) {
    case 'up':
      return `Up ${Math.abs(delta)}`
    case 'down':
      return `Down ${Math.abs(delta)}`
    case 'flat':
      return 'No change'
  }
}

/** Tone for a 0–100 score chip. */
export function scoreTone(value: number): Tone {
  if (value >= 75) return 'success'
  if (value >= 55) return 'default'
  if (value >= 40) return 'warning'
  return 'muted'
}

/** Human phrase for each analytics module, used to compose explanations. */
const MODULE_PHRASES: Record<keyof RankingRow['moduleScores'], string> = {
  recentForm: 'strong recent form',
  strokesGained: 'elite ball-striking',
  courseFit: 'above-average course fit',
  consistency: 'week-to-week consistency',
  momentum: 'surging momentum',
  value: 'strong market value',
  wind: 'comfort in the wind',
}

/**
 * Compose a readable, placeholder explanation from a row's strongest module
 * scores. Mirrors the tone of the future AI-generated rationale.
 *
 * TODO(ai): replace with the engine's AI-generated explanation once live.
 */
export function buildExplanation(row: RankingRow): string {
  const drivers = (
    Object.entries(row.moduleScores) as [
      keyof RankingRow['moduleScores'],
      number,
    ][]
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => MODULE_PHRASES[key])

  if (drivers.length === 0) {
    return 'This player ranks based on a balanced blend of analytics signals.'
  }

  const last = drivers.pop()
  const list =
    drivers.length > 0 ? `${drivers.join(', ')}, and ${last}` : last
  return `This player ranks highly due to ${list}.`
}
