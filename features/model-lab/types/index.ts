/**
 * View-model types for the Model Lab.
 *
 * Model Lab lets users compose a custom "overall" rating by weighting the four
 * analytics pillars the platform actually computes, then preview the global
 * player ranking those weights produce. The preview is backed by the real
 * Analytics Engine (`analyticsService.getPopulationAnalytics`) via a server
 * action — there are no fabricated scores anywhere in this feature.
 *
 * TODO(data): models are held in in-memory client state for v1. Persist them
 * per user (see prisma `Model`/`ModelVersion`) once the Model Lab milestone
 * wires up the database.
 */

import type { AnalyticsMetricKey } from '@/lib/analytics/types'

/**
 * The metric pillars a model can weight. These are exactly the four scores the
 * Analytics Engine produces per player, so a model is an honest re-weighting of
 * real analytics rather than a parallel set of invented factors. The key values
 * are identical to {@link AnalyticsMetricKey} so a model weight maps directly to
 * a player's analytics score with no translation table.
 */
export type MetricGroupKey = Extract<
  AnalyticsMetricKey,
  'seasonPerformance' | 'recentForm' | 'fantasyProduction' | 'consistency'
>

/** Grouping label for the builder — one pillar per category. */
export type MetricCategory = 'Season' | 'Form' | 'Fantasy' | 'Reliability'

/** Static descriptor for a metric pillar, shown in the builder. */
export interface MetricGroupDefinition {
  key: MetricGroupKey
  label: string
  description: string
  /** The analytics metric this pillar weights (identical to `key`). */
  metricKey: AnalyticsMetricKey
  /** Short category label for grouping in the UI. */
  category: MetricCategory
}

/** A single metric pillar's tunable state within a model. */
export interface ModelMetric {
  key: MetricGroupKey
  /** Whether the pillar contributes to the model. */
  enabled: boolean
  /** Weight as a whole-number percentage (0–100). */
  weight: number
}

/** A saved snapshot of a model's metric configuration. */
export interface ModelVersion {
  id: string
  /** Sequential label, e.g. "v3". */
  label: string
  /** Optional note describing what changed in this version. */
  note?: string
  metrics: ModelMetric[]
  createdAt: string
}

/** The origin of a model — a built-in template or a user creation. */
export type ModelOrigin = 'template' | 'custom'

/** A complete, tunable ranking model. */
export interface Model {
  id: string
  name: string
  description: string
  origin: ModelOrigin
  /** For template-derived models, the template key it was created from. */
  templateKey?: string
  favorite: boolean
  metrics: ModelMetric[]
  versions: ModelVersion[]
  createdAt: string
  updatedAt: string
}

/** A read-only built-in model template. */
export interface ModelTemplate {
  key: string
  name: string
  description: string
  /** Default metric configuration seeded when the template is instantiated. */
  metrics: ModelMetric[]
}

/** Normalized weights (fractions summing to 1) the preview blended, by pillar. */
export type ModelWeightMap = Partial<Record<MetricGroupKey, number>>

/** One row in the ranking preview — a real player from the season population. */
export interface ModelPreviewRow {
  rank: number
  playerId: string
  name: string
  /** ISO country code, when known, for the flag chip. */
  countryCode: string | null
  /** Composite 0–100 score from the model's weighted blend of real analytics. */
  score: number
  /** Letter grade mapped from `score` (shared with the Ranking Engine). */
  grade: string
}

/** The result of running a model against the real season population. */
export interface ModelPreview {
  rows: ModelPreviewRow[]
  /** Normalized weights the preview applied, by pillar. */
  weights: ModelWeightMap
  /** The season the analytics were normalized against, or null when none. */
  season: number | null
  /** How many players had enough data to receive a composite score. */
  ratedPlayers: number
  generatedAt: string
}

/** Derived summary metrics for the model summary cards. */
export interface ModelSummary {
  totalMetrics: number
  activeMetrics: number
  /** Sum of enabled weights as a percentage. */
  totalWeight: number
  /** `true` when the total weight exceeds 100%. */
  overweight: boolean
  /** Coverage-based confidence in the model's configuration. */
  confidence: 'low' | 'medium' | 'high'
}

/** A single entry in the "Recent Changes" activity feed. */
export interface ModelChange {
  id: string
  label: string
  detail?: string
  at: string
}
