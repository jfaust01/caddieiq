/**
 * Core contracts for the CaddieIQ Ranking Engine.
 *
 * The ranking layer is the single source of truth for every ranking surfaced in
 * the product (player rankings, course-fit boards, value boards, model output).
 * It sits *above* the analytics framework: analytics modules produce per-player
 * {@link AnalyticsResult}s, and the ranking engine blends those into ordered,
 * typed ranking results.
 *
 * This file defines shape only — no runtime behavior. Concrete numeric logic is
 * intentionally absent; the current pipeline/service return realistic,
 * deterministic mock values, and the real inputs will arrive from the analytics
 * layer (fed by SportsDataIO et al.) once that data platform is wired up.
 */

import type {
  AnalyticsModuleKey,
  AnalyticsResult,
  ConfidenceLevel,
  ModuleWeights,
} from "@/lib/analytics/shared/types"

/**
 * The kinds of ranking CaddieIQ can produce. Each maps to a weight profile in
 * the ranking registry. `model` is the seam for future user-defined custom
 * models.
 */
export type RankingType =
  | "overall"
  | "course-fit"
  | "recent-form"
  | "value"
  | "momentum"
  | "wind"
  | "model"

/**
 * Relative per-module weights used when blending analytics results into a
 * ranking score. Re-exported from the analytics layer so the two frameworks
 * share one weighting vocabulary; the engine normalizes them to sum to 1.
 */
export type RankingWeights = ModuleWeights

/** Direction a player has moved since the previous ranking snapshot. */
export type RankingMovement = "up" | "down" | "flat"

/**
 * Scope narrows what population a ranking is computed over. A global player
 * ranking has no ids; a tournament board sets `tournamentId`, etc.
 */
export interface RankingScope {
  tournamentId?: string
  courseId?: string
  seasonId?: string
  /** Optional human-friendly label for logs and headers. */
  label?: string
}

/**
 * A single player handed to the engine. Deliberately minimal and
 * provider-agnostic — ids are opaque strings matching the domain model.
 *
 * TODO(analytics): the engine will pair each input with the player's
 * {@link AnalyticsResult}s; today those are synthesized as mock values.
 */
export interface RankingPlayerInput {
  playerId: string
  label?: string
  /** Current OWGR position, when known — used only for mock realism. */
  worldRanking?: number
}

/**
 * One weighted contribution to a player's composite ranking score. Each metric
 * corresponds to an analytics module, so the breakdown is fully explainable.
 */
export interface RankingMetric {
  /** The analytics module this contribution came from. */
  module: AnalyticsModuleKey
  label: string
  /** Normalized module score on a 0–100 scale. */
  value: number
  /** Normalized weight in [0, 1] applied to `value`. */
  weight: number
  /** `value * weight`, i.e. the points this metric added to the composite. */
  contribution: number
}

/**
 * The composite score behind a player's rank. `overall` is the weighted blend
 * of `metrics`; both are on a 0–100 scale.
 */
export interface RankingScore {
  overall: number
  confidence: ConfidenceLevel
  metrics: RankingMetric[]
}

/**
 * Placeholder for an AI-generated rationale explaining why a player ranks where
 * they do. Populated by the AI layer later.
 *
 * TODO(ai): generate `summary`/`bullets` from the weighted breakdown and the
 * underlying analytics narratives; `mock` stays true until then.
 */
export interface RankingExplanation {
  summary: string
  bullets: string[]
  /** The model/version that produced the explanation, once real. */
  model?: string
  generatedAt: Date
  mock: boolean
}

/**
 * A single player's position within a ranking — the atomic row the UI renders.
 */
export interface PlayerRankingResult {
  rank: number
  /** Rank in the previous snapshot, when available. */
  previousRank: number | null
  movement: RankingMovement
  /** Positions gained (+) or lost (−) since the previous snapshot. */
  delta: number
  playerId: string
  label: string
  score: RankingScore
  /** Optional AI rationale; absent until the AI layer runs. */
  explanation?: RankingExplanation
}

/** Names of the ordered stages the ranking pipeline executes. */
export type RankingStageName =
  | "load-players"
  | "load-analytics"
  | "normalize-scores"
  | "apply-weights"
  | "calculate-ranking"
  | "generate-explanation"
  | "return-results"

/** Lightweight per-stage diagnostics captured during a pipeline run. */
export interface RankingStageResult {
  stage: RankingStageName
  /** How many entities the stage processed (players, results, …). */
  count: number
  durationMs: number
  /** Optional note, e.g. "mock analytics synthesized". */
  note?: string
}

/**
 * Input assembled by a caller (engine, service, scheduler) for a ranking run.
 * Callers may pre-attach analytics outputs; when omitted the pipeline
 * synthesizes deterministic mock results.
 */
export interface RankingContext<TParams = Record<string, unknown>> {
  type: RankingType
  scope?: RankingScope
  players: RankingPlayerInput[]
  /**
   * Analytics results keyed by `playerId`. The engine "accepts analytics
   * outputs" here.
   *
   * TODO(analytics): populate from `AnalyticsEngine.run()` per player; until
   * then the pipeline generates mock module scores.
   */
  analytics?: Record<string, AnalyticsResult[]>
  /** Weight overrides merged over the ranking type's registry defaults. */
  weights?: RankingWeights
  /** Arbitrary run parameters (limit, snapshot date, model id, …). */
  params?: TParams
}

/**
 * The full, typed output of a ranking run: the ordered results plus the applied
 * weights and per-stage diagnostics.
 */
export interface RankingPipelineResult {
  type: RankingType
  scope?: RankingScope
  results: PlayerRankingResult[]
  /** The weights actually applied (normalized to sum to 1). */
  weights: RankingWeights
  /** Ordered stage diagnostics, useful for observability and tests. */
  stages: RankingStageResult[]
  generatedAt: Date
  durationMs: number
  /** `true` while any part of the run used placeholder values. */
  mock: boolean
}

/**
 * A named weight profile for a {@link RankingType}. The registry seeds one per
 * built-in type, and future custom models register their own.
 */
export interface RankingTypeDefinition {
  type: RankingType
  label: string
  description: string
  /** Default relative weights; normalized by the engine at run time. */
  defaultWeights: RankingWeights
  /** Marks types that are scaffolded but not yet backed by real logic. */
  comingSoon?: boolean
}

/**
 * Descriptor for a future user-defined ranking model. Kept here so the engine
 * and registry share the shape even before custom models are buildable.
 */
export interface RankingModelDefinition {
  id: string
  label: string
  description?: string
  weights: RankingWeights
}
