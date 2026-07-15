/**
 * Analytics domain types — the shared contract of the CaddieIQ Analytics Engine.
 *
 * Analytics are the platform's single source of derived intelligence: every
 * surface that needs "how good / how in-form / how reliable is this player"
 * (player pages, the tournament hub, and — later — rankings, DFS, betting, and
 * the AI coach) consumes these shapes rather than recomputing from raw
 * statistics. They are intentionally free of any Prisma or provider import so
 * they can be shared by server services, pure calculators, and client UI alike.
 *
 * IMPORTANT — honesty over coverage: an analytic is only ever emitted from data
 * the platform actually holds. At the current provider tier that means season
 * aggregates (world ranking + week-over-week movement, events played, and
 * fantasy-point totals). Metrics that would require shot-level data
 * (scoring/driving/putting/approach) are deliberately NOT part of this contract
 * yet, because their inputs are not ingested — the engine never fabricates a
 * score it cannot ground in real data.
 */

/**
 * The analytics currently computable from ingested data. Each is a 0–100 score
 * that is comparable across players within a season.
 *
 * - `recentForm` — trajectory: current world-ranking standing blended with the
 *   week-over-week movement the provider reports.
 * - `consistency` — reliability: the share of a player's fantasy activity that
 *   was positive production (points gained vs. points lost).
 * - `activity` — durability/engagement: how much a player competed, relative to
 *   the field, by events played.
 * - `fantasyProduction` — scoring rate: average fantasy points per event,
 *   relative to the field.
 * - `seasonPerformance` — overall season standing: total fantasy output blended
 *   with world ranking.
 */
export type AnalyticsMetricKey =
  | "recentForm"
  | "consistency"
  | "activity"
  | "fantasyProduction"
  | "seasonPerformance"

/**
 * How much real data backed a score. `none` means the required inputs were
 * absent and the score is `null`; `low`/`medium`/`high` grade partial vs. full
 * input coverage (and flag reliance on the provider's known-obfuscated world
 * ranking as, at best, `medium`).
 */
export type AnalyticsConfidence = "none" | "low" | "medium" | "high"

/**
 * A qualitative band for a 0–100 score, used for labels and color tone in the
 * UI without each surface re-deriving thresholds.
 */
export type AnalyticsBand = "ELITE" | "STRONG" | "SOLID" | "AVERAGE" | "DEVELOPING"

/** One computed analytic for one player. */
export interface AnalyticsScore {
  key: AnalyticsMetricKey
  /** Human label, e.g. "Recent Form". */
  label: string
  /** One-line explanation of what the score measures and its basis. */
  description: string
  /** Normalized 0–100 score, or `null` when inputs were insufficient. */
  value: number | null
  /** Qualitative band derived from `value`, or `null` when `value` is null. */
  band: AnalyticsBand | null
  /** How much real data backed this score. */
  confidence: AnalyticsConfidence
}

/**
 * The full analytics profile for a single player, computed against a season's
 * field. This is the shape player-facing surfaces render and other engines
 * (rankings, DFS, AI) build on.
 */
export interface PlayerAnalytics {
  playerId: string
  /** Season the analytics were normalized against, or `null` when none exists. */
  season: number | null
  /** Number of players in the normalization population. */
  sampleSize: number
  /** Composite headline (mean of available scores), or `null`. */
  overallRating: number | null
  /** Band for `overallRating`, or `null`. */
  overallBand: AnalyticsBand | null
  /** Every tracked analytic, in display order (unavailable ones carry `null`). */
  scores: AnalyticsScore[]
  /** True when no analytic could be computed (player absent from the season). */
  isEmpty: boolean
}

/** One metric aggregated across a tournament field. */
export interface FieldAnalyticsMetric {
  key: AnalyticsMetricKey
  label: string
  /** Field-average score, or `null` when no entrant had the data. */
  value: number | null
  band: AnalyticsBand | null
  /** How many entrants contributed a value to this average. */
  sampleSize: number
}

/**
 * A compact, field-level analytics summary for the tournament hub: how strong,
 * in-form, and reliable the assembled field is on average. Consumes the same
 * per-player analytics as everything else — never a parallel computation.
 */
export interface FieldAnalyticsSummary {
  /** Season the field's analytics were normalized against, or `null`. */
  season: number | null
  /** Total entrants in the field. */
  totalPlayers: number
  /** Entrants with at least one computable analytic. */
  ratedPlayers: number
  /** Field-average overall rating, or `null` when nobody could be rated. */
  averageRating: number | null
  averageBand: AnalyticsBand | null
  /** A curated, compact set of headline metrics for the field. */
  metrics: FieldAnalyticsMetric[]
}
