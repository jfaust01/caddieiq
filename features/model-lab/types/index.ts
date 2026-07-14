/**
 * View-model types for the Model Lab.
 *
 * Model Lab lets users compose a custom ranking model from ten metric groups,
 * tune each group's weight, and preview a mock ranking produced by the shared
 * Ranking Engine (`@/lib/ranking`). These types describe the shape of a model,
 * its versions, and the workspace state — presentation only, no persistence.
 *
 * TODO(data): models are held in in-memory client state for v1. Persist them
 * per user (see prisma `Model`/`ModelVersion`) once the Model Lab milestone
 * wires up the database.
 */

import type { AnalyticsModuleKey } from '@/lib/analytics/shared/types'
import type { RankingWeights } from '@/lib/ranking'

/**
 * The ten metric groups a model can weight. Seven map 1:1 to analytics modules;
 * `driving`, `putting`, and `scrambling` are finer-grained groups that fold into
 * the `strokes-gained` module when the model is handed to the Ranking Engine.
 */
export type MetricGroupKey =
  | 'recent-form'
  | 'course-fit'
  | 'strokes-gained'
  | 'driving'
  | 'putting'
  | 'scrambling'
  | 'wind'
  | 'consistency'
  | 'momentum'
  | 'value'

/** Static descriptor for a metric group, shown in the builder. */
export interface MetricGroupDefinition {
  key: MetricGroupKey
  label: string
  description: string
  /** The analytics module this group contributes to in the Ranking Engine. */
  module: AnalyticsModuleKey
  /** Short category label for grouping in the UI. */
  category: 'Form' | 'Fit' | 'Skill' | 'Conditions' | 'Market'
}

/** A single metric group's tunable state within a model. */
export interface ModelMetric {
  key: MetricGroupKey
  /** Whether the group contributes to the model. */
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

/** One row in the mock ranking preview. */
export interface ModelPreviewRow {
  rank: number
  playerId: string
  name: string
  /** Composite 0–100 score behind the rank. */
  score: number
  movement: 'up' | 'down' | 'flat'
  /** Positions gained (+) / lost (−) since the previous snapshot. */
  delta: number
}

/** The result of running a model through the Ranking Engine. */
export interface ModelPreview {
  rows: ModelPreviewRow[]
  /** Normalized weights the engine applied. */
  weights: RankingWeights
  generatedAt: Date
  /** `true` while the run used placeholder values (always true in v1). */
  mock: boolean
}

/** Derived summary metrics for the model summary cards. */
export interface ModelSummary {
  totalMetrics: number
  activeMetrics: number
  /** Sum of enabled weights as a percentage. */
  totalWeight: number
  /** `true` when the total weight exceeds 100%. */
  overweight: boolean
  /** Placeholder confidence band. */
  confidence: 'low' | 'medium' | 'high'
}

/** A single entry in the "Recent Changes" activity feed. */
export interface ModelChange {
  id: string
  label: string
  detail?: string
  at: string
}
