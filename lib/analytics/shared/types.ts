/**
 * Core contracts for the Golf Intelligence analytics framework.
 *
 * This file defines *shape* only — there is no runtime behavior here. Every
 * ranking, model, AI explanation, and tournament insight in CaddieIQ is built
 * on these types. Concrete numeric logic is intentionally absent; the current
 * modules return realistic mock values (see each module's `compute()`), and the
 * real inputs will arrive from the normalized data model once the data platform
 * (SportsDataIO et al.) is wired up.
 */

import type { ValidationIssue } from "./errors"

/** Stable identifier for each analytics module. */
export type AnalyticsModuleKey =
  | "recent-form"
  | "course-fit"
  | "strokes-gained"
  | "wind"
  | "consistency"
  | "value"
  | "momentum"

/** The kind of entity an analytics run is about. */
export type AnalyticsSubjectKind = "player" | "tournament" | "course"

/**
 * Points at the entity an analytics module should evaluate. Ids are opaque
 * strings (cuids) matching the domain model; the framework never assumes a
 * particular persistence layer.
 */
export interface AnalyticsSubject {
  kind: AnalyticsSubjectKind
  /** Primary entity id (e.g. a player id). */
  id: string
  /** Optional human-friendly label for logs and summaries. */
  label?: string
  /** Optional related ids that give a metric context. */
  tournamentId?: string
  courseId?: string
  seasonId?: string
}

/**
 * Input handed to a module's `calculate()`. A caller (engine, service, or
 * scheduler) assembles the context; modules never decide their own subject.
 *
 * TODO(sportsdataio): attach the normalized provider payloads a module needs
 * here (e.g. `rounds`, `rankings`, `weather`) once the data platform lands.
 * Until then modules ignore `data` and emit deterministic mock scores.
 */
export interface AnalyticsContext<TParams = Record<string, unknown>> {
  subject: AnalyticsSubject
  /** Arbitrary run parameters (window size, weighting overrides, …). */
  params?: TParams
  /**
   * Placeholder for normalized source data. Deliberately untyped for now; each
   * module will narrow this to its required inputs when real data is available.
   */
  data?: Record<string, unknown>
}

/** Qualitative confidence in a produced score. */
export type ConfidenceLevel = "low" | "medium" | "high"

/** Direction of a metric relative to a subject's baseline. */
export type MetricTrend = "up" | "down" | "flat"

/**
 * A single scored metric. This is the atomic unit every module produces and the
 * engine aggregates. `value` is normalized to a 0–100 scale so heterogeneous
 * metrics (strokes gained, wind exposure, price value) can be weighted together.
 */
export interface MetricScore {
  /** Which module produced this score. */
  module: AnalyticsModuleKey
  /** Stable metric identifier, e.g. "sg-approach". */
  key: string
  /** Human-friendly label, e.g. "SG: Approach". */
  label: string
  /** Normalized score on a 0–100 scale. */
  value: number
  /** The un-normalized value in its natural unit, when meaningful. */
  rawValue?: number
  /** Unit for `rawValue` (e.g. "strokes", "mph", "%"). */
  unit?: string
  /** Percentile within the comparison field (0–100), when known. */
  percentile?: number
  /** Trend versus the subject's recent baseline. */
  trend?: MetricTrend
  /** How much to trust this score. */
  confidence: ConfidenceLevel
  /** Short explanation suitable for tooltips or AI grounding. */
  description?: string
}

/**
 * The outcome of running a single analytics module for a subject. The engine
 * collects many of these and aggregates them into an insight.
 */
export interface AnalyticsResult {
  module: AnalyticsModuleKey
  subject: AnalyticsSubject
  /** The headline score for this module. */
  score: MetricScore
  /** Supporting sub-metrics that roll up into `score`. */
  metrics: MetricScore[]
  /** One-line, human-readable interpretation of the result. */
  summary: string
  /** Overall confidence for the module run. */
  confidence: ConfidenceLevel
  /** When the result was generated. */
  generatedAt: Date
  /** Wall-clock duration of the run in milliseconds. */
  durationMs: number
  /**
   * `true` while the module returns placeholder values. Consumers (and the AI
   * layer) can surface this so mock output is never mistaken for real analysis.
   */
  mock: boolean
}

/** Result of validating an {@link AnalyticsContext} before a run. */
export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
}

/**
 * The interface every analytics module implements. See {@link BaseAnalyticsModule}
 * for the abstract class that supplies logging, timing, and error handling on
 * top of this contract.
 */
export interface AnalyticsModule {
  /** Stable module identifier. */
  readonly key: AnalyticsModuleKey
  /** Human-friendly label for dashboards and logs. */
  readonly label: string
  /** What this module measures and why it matters. */
  readonly description: string

  /** Produce a scored result for the given context. */
  calculate(context: AnalyticsContext): Promise<AnalyticsResult>

  /** Turn a result into a concise, human-readable narrative. */
  summarize(result: AnalyticsResult): string

  /** Check that a context has everything the module needs before running. */
  validate(context: AnalyticsContext): ValidationResult
}

// ---------------------------------------------------------------------------
// Aggregation & weighting
// ---------------------------------------------------------------------------

/**
 * Per-module weight used when the engine aggregates results. Weights are
 * relative; the engine normalizes them so they sum to 1 before combining.
 * This is the seam that future model definitions plug into.
 */
export type ModuleWeights = Partial<Record<AnalyticsModuleKey, number>>

/** A module result paired with the effective weight it contributed. */
export interface WeightedResult {
  result: AnalyticsResult
  /** Normalized weight in [0, 1]. */
  weight: number
}

/**
 * The aggregate output of running several modules for one subject. This is the
 * base shape the subject-specific insights extend.
 */
export interface AnalyticsResult_Aggregate {
  subject: AnalyticsSubject
  /** Blended 0–100 score across all weighted modules. */
  overallScore: number
  /** Overall confidence, derived from the contributing modules. */
  confidence: ConfidenceLevel
  /** Each module's result and the weight it carried. */
  breakdown: WeightedResult[]
  /** The weights actually applied (normalized). */
  weights: ModuleWeights
  generatedAt: Date
  mock: boolean
}

/** Aggregated insight for a single player. */
export interface PlayerInsight extends AnalyticsResult_Aggregate {
  subject: AnalyticsSubject & { kind: "player" }
  /** Headline narrative summarizing the player's outlook. */
  headline: string
}

/** Aggregated insight for a tournament (typically a ranked field). */
export interface TournamentInsight extends AnalyticsResult_Aggregate {
  subject: AnalyticsSubject & { kind: "tournament" }
  headline: string
  /** Placeholder for the ranked field once player-level runs are combined. */
  contenders: Array<{ playerId: string; label?: string; score: number }>
}

/** Aggregated insight for a course. */
export interface CourseInsight extends AnalyticsResult_Aggregate {
  subject: AnalyticsSubject & { kind: "course" }
  headline: string
  /** Attributes the course rewards (e.g. "distance", "accuracy"). */
  emphasizes: string[]
}
