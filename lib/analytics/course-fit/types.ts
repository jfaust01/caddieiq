/**
 * Course Fit Model — types.
 *
 * The Course Fit Model estimates how well a player's skill profile matches the
 * demands of a specific course. It consumes two verified inputs — the course's
 * {@link CourseProfile} (from the Course Intelligence Engine) and the player's
 * per-family skill profile — and produces an explainable, confidence-graded fit
 * score.
 *
 * Honesty rules (see docs/COURSE_FIT_MODEL.md):
 * - A skill signal is only ever *scored* when BOTH sides are verified: the
 *   course demand exists in the profile AND the player's skill rating is known.
 * - The composite score is a demand-weighted blend of scored signals only.
 *   When nothing can be scored the model returns `null` — it never fabricates a
 *   fit number from missing data.
 * - Confidence reflects how much verified data backed the score; it can never be
 *   inflated above the signal coverage that actually existed.
 * - Every result is explainable: it names the signals that drove the score and
 *   the ones that were unavailable, with reasons.
 *
 * Pure + serializable: imports only the CourseProfile *type*, so the model is a
 * pure function safe to run on the server and send to the client.
 */

import type { CourseProfile } from "@/lib/domain/course"

/** The five skill families the model matches against course demands. */
export type FitSkillKey = "driving" | "approach" | "shortGame" | "putting" | "scrambling"

/** Ordered, exhaustive list of the modeled skill families. */
export const FIT_SKILL_KEYS: readonly FitSkillKey[] = [
  "driving",
  "approach",
  "shortGame",
  "putting",
  "scrambling",
]

/**
 * A player's per-family skill profile — the player-side input to the model.
 * Every family is present, but each rating may be `null` meaning "not ingested".
 *
 * IMPORTANT: the platform currently ingests NO per-skill (strokes-gained-style)
 * player data, so services build an all-`null` profile today and the model
 * degrades honestly. Ratings are on a 0–100 scale, comparable across players.
 */
export type PlayerSkillProfile = Readonly<Record<FitSkillKey, number | null>>

/** How much verified data backed a fit score. `none` ⇒ score is `null`. */
export type FitConfidence = "none" | "low" | "medium" | "high"

/** Whether a single skill signal contributed to the score. */
export type FitSignalStatus = "scored" | "unavailable"

/** Why an unavailable signal could not be scored. */
export type FitUnavailableReason =
  | "course-demand-missing"
  | "player-skill-missing"
  | "both-missing"

/** A qualitative band for a 0–100 fit score, for labels and color tone. */
export type FitBand = "STRONG" | "ABOVE_AVERAGE" | "AVERAGE" | "BELOW_AVERAGE" | "WEAK"

/** One skill family's reading against this course. */
export interface FitSignal {
  readonly key: FitSkillKey
  readonly label: string
  readonly status: FitSignalStatus
  /** Course demand weight (0–1) for this skill, or `null` when unknown. */
  readonly demand: number | null
  /** Player skill rating (0–100), or `null` when unavailable. */
  readonly skill: number | null
  /** Normalized weight within the composite (0–1); 0 for unavailable signals. */
  readonly weight: number
  /** Points contributed to the composite (`weight × skill`), or `null`. */
  readonly contribution: number | null
  /** Reason an unavailable signal was skipped; `null` when scored. */
  readonly reason: FitUnavailableReason | null
  /** Plain-language one-liner describing this signal. */
  readonly rationale: string
}

/** A signal that materially moved the score, for the explainability summary. */
export interface FitDriver {
  readonly key: FitSkillKey
  readonly label: string
  /** Weighted effect vs. a neutral 50 baseline (positive = helps the fit). */
  readonly effect: number
  readonly direction: "positive" | "negative"
  readonly rationale: string
}

/** Honest coverage accounting: how many of the modeled signals were scored. */
export interface FitCoverage {
  readonly scored: number
  readonly total: number
}

/** The full, explainable fit result for one player against one course. */
export interface CourseFitResult {
  readonly playerId: string
  /** Course the fit was computed against, or `null` when none was provided. */
  readonly courseId: string | null
  /** 0–100 demand-weighted fit, or `null` when no signal could be scored. */
  readonly score: number | null
  /** Band for `score`, or `null` when `score` is null. */
  readonly band: FitBand | null
  readonly confidence: FitConfidence
  /** All modeled signals — scored or explained-unavailable — in display order. */
  readonly signals: readonly FitSignal[]
  /** Scored signals ranked by absolute effect: what drove the score. */
  readonly drivers: readonly FitDriver[]
  /** Signals that could not be scored, with reasons. */
  readonly missing: readonly FitSignal[]
  readonly coverage: FitCoverage
  /** Plain-language summary citing drivers and gaps. Never fabricated. */
  readonly summary: string
}

/** The inputs required to compute a single player-vs-course fit. */
export interface CourseFitInput {
  readonly playerId: string
  /** The course's normalized profile, or `null` when no course is linked. */
  readonly courseProfile: CourseProfile | null
  /** The player's skill profile (families may be `null`). */
  readonly skills: PlayerSkillProfile
}

/** One entrant in a field-level fit board. */
export interface FieldFitEntry {
  readonly playerId: string
  readonly displayName: string
  readonly result: CourseFitResult
  /**
   * The player's verified ranking-momentum analytic (0–100), or `null`. Used
   * only for the "Trending Up" list — an honest form-trajectory read, NOT a
   * change in course fit (which the platform does not yet track over time).
   */
  readonly momentum: number | null
}

/** A ranked field-level view of course fit for the tournament hub. */
export interface FieldFitBoard {
  /** Highest computable fits (players with a scored fit), best first. */
  readonly topFits: readonly FieldFitEntry[]
  /** Lowest computable fits (players with a scored fit), worst first. */
  readonly fades: readonly FieldFitEntry[]
  /** Biggest recent ranking gains (verified momentum), strongest first. */
  readonly trendingUp: readonly FieldFitEntry[]
  /** Field members whose fit is least certain (most missing signals) first. */
  readonly mostUncertain: readonly FieldFitEntry[]
  /** Entrants with at least one scored fit signal. */
  readonly scoredPlayers: number
  /** Total entrants considered. */
  readonly totalPlayers: number
}
