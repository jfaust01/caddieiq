/**
 * Player Skill Intelligence — domain types (client-safe, no I/O).
 *
 * This is the fifth independent Signal Family in CaddieIQ. It transforms
 * VERIFIED player round statistics into reusable, normalized golf-skill signals
 * that every downstream model (Course Fit, DFS Value, Betting Value, AI Coach)
 * consumes instead of re-deriving skill from raw provider statistics.
 *
 * Governing rules (see docs/PLAYER_SKILL_INTELLIGENCE.md and MODELS.md):
 * - Honesty over coverage. A skill is only ever rated from data the platform
 *   actually holds. A skill with no samples is `UNKNOWN` with a `null` value —
 *   never a fabricated number. Numeric raw values are always retained alongside
 *   the normalized rating.
 * - Confidence is derived, never assumed. It is capped by coverage, sample
 *   size, and freshness; unknown skills lower it.
 * - AI-ready, no prose. Explanations are structured enums + short labels
 *   ("Elite Iron Player", "Average Putter"), not generated sentences.
 *
 * These types intentionally import nothing from Prisma or providers so they can
 * be shared by the server service, the pure engine, and client UI alike.
 */

/**
 * The fifteen skill categories the engine tracks. Keys are stable and used as
 * React keys, JSON fields, and map keys everywhere the family is consumed.
 *
 * `sgTeeToGreen` is DERIVED (off-the-tee + approach + around-the-green).
 * `par3Scoring` / `par4Scoring` / `par5Scoring` have no provider source field
 * today (round statistics carry no per-par breakdown), so they are always
 * emitted as `UNKNOWN` with a `no-provider-field` gap — honest, not fabricated.
 */
export type SkillKey =
  | "sgOffTheTee"
  | "sgApproach"
  | "sgAroundGreen"
  | "sgPutting"
  | "sgTeeToGreen"
  | "drivingAccuracy"
  | "drivingDistance"
  | "greensInRegulation"
  | "scrambling"
  | "sandSave"
  | "birdiePercentage"
  | "bogeyAvoidance"
  | "par3Scoring"
  | "par4Scoring"
  | "par5Scoring"

/** The skill families skills roll up into, for grouping and AI labelling. */
export type SkillFamily =
  | "offTheTee"
  | "approach"
  | "aroundGreen"
  | "putting"
  | "teeToGreen"
  | "scoring"

/**
 * The normalized qualitative band for a skill, from a field-relative
 * percentile. Seven ordered levels, worst → best.
 */
export type SkillBand =
  | "VERY_POOR"
  | "POOR"
  | "BELOW_AVERAGE"
  | "AVERAGE"
  | "ABOVE_AVERAGE"
  | "EXCELLENT"
  | "ELITE"

/** Trajectory of a skill over recent play vs. its baseline. */
export type SkillTrendDirection = "improving" | "stable" | "declining" | "unknown"

/**
 * How much real data backed a rating. `none` ⇒ the value is `null`; the graded
 * levels reflect partial vs. full sample/coverage/freshness support.
 */
export type SkillConfidence = "none" | "low" | "medium" | "high"

/** The unit a skill's raw value is expressed in. */
export type SkillUnit = "strokes" | "yards" | "percent"

/** Machine-readable reason a skill (or the whole profile) has no rating. */
export type SkillGapCode =
  | "no-round-statistics"
  | "no-samples"
  | "no-provider-field"
  | "insufficient-population"
  | "player-not-found"

/** A machine-readable gap + optional human detail. */
export interface SkillGap {
  code: SkillGapCode
  skill?: SkillKey
  detail?: string
}

/**
 * A skill's trajectory across three windows. Window values are the player's
 * RAW aggregate within that window (native units), so they stay comparable to
 * the skill's own baseline. `direction` is derived from recent vs. prior play.
 */
export interface SkillTrend {
  /** Raw aggregate over the most recent window of rounds, or `null`. */
  recent: number | null
  /** Raw aggregate over the current season, or `null`. */
  season: number | null
  /** Raw aggregate over all held history, or `null`. */
  longTerm: number | null
  direction: SkillTrendDirection
  /** Rounds contributing to the `recent` window. */
  recentSampleSize: number
}

/**
 * One normalized skill signal for one player. Carries BOTH the field-relative
 * rating (0–100 + band) and the retained raw value in native units.
 */
export interface SkillSignal {
  key: SkillKey
  label: string
  family: SkillFamily
  unit: SkillUnit
  /** Whether a higher raw value is better (false ⇒ lower is better). */
  higherIsBetter: boolean
  /** Field-relative normalized rating 0–100, or `null` when not rated. */
  value: number | null
  /** Qualitative band derived from `value`, or `null`. */
  band: SkillBand | null
  /** Retained raw aggregate in native units, or `null` when no samples. */
  rawValue: number | null
  /** Field percentile 0–100 the rating came from, or `null`. */
  percentile: number | null
  /** Rounds that contributed to this skill's aggregate. */
  sampleSize: number
  trend: SkillTrend
  confidence: SkillConfidence
  /** Reason this signal is unrated, or `null` when rated. */
  gap: SkillGapCode | null
}

/**
 * An AI-ready structured explanation. No generated prose — a stable
 * `{ skill, family, band }` triple plus a short deterministic `label`
 * ("Elite Iron Player", "Average Putter", "Weak Driver Accuracy").
 */
export interface SkillExplanation {
  skill: SkillKey
  family: SkillFamily
  band: SkillBand
  label: string
}

/** Freshness of the underlying samples. */
export interface SkillFreshness {
  /** ISO timestamp of the most recent contributing round, or `null`. */
  lastRoundAt: string | null
  /** Whole days since the most recent round, or `null`. */
  ageDays: number | null
}

/** Honest coverage accounting over the currently-sourceable skills. */
export interface SkillCoverage {
  /** Skills with a normalized rating. */
  known: number
  /** Skills that could carry a rating once data exists (excludes blocked). */
  sourceable: number
  /** All fifteen tracked skills. */
  total: number
}

/**
 * THE reusable object. One per player. Every future model consumes this instead
 * of raw provider statistics, so no skill logic is duplicated anywhere.
 */
export interface PlayerSkillProfile {
  playerId: string
  status: "available" | "unavailable"
  confidence: SkillConfidence
  /** Season the ratings were normalized against, or `null`. */
  season: number | null
  /** Rounds analysed across all windows. */
  sampleSize: number
  /** Distinct seasons represented in the samples. */
  seasonsAnalyzed: number
  freshness: SkillFreshness
  coverage: SkillCoverage
  /** Every tracked skill, in display order (unknowns carry `null` values). */
  skills: SkillSignal[]
  /** Keys rated ABOVE_AVERAGE+ — the player's strengths. */
  strengths: SkillKey[]
  /** Keys rated POOR/VERY_POOR — the player's weak areas. */
  weaknesses: SkillKey[]
  /** Keys rated ELITE/EXCELLENT. */
  eliteSkills: SkillKey[]
  /** Keys rated AVERAGE. */
  averageSkills: SkillKey[]
  /** Keys rated BELOW_AVERAGE — measured, with room to grow. */
  developingSkills: SkillKey[]
  /** Keys with no rating yet (no data or no source field). */
  unknownSkills: SkillKey[]
  /** Overall recent trajectory across the player's rated skills. */
  trend: SkillTrendDirection
  /** AI-ready structured explanations for rated skills only. */
  explanations: SkillExplanation[]
  gaps: SkillGap[]
  /** Plain-English, safe-to-render summary of the profile's state. */
  detail: string
}

/* ------------------------------------------------------------------ */
/* Engine inputs (pure)                                               */
/* ------------------------------------------------------------------ */

/** One round's raw statistics as ingested, plus when it was played. */
export interface SkillRoundSample {
  /** ISO timestamp the round was scheduled/played, or `null`. */
  playedAt: string | null
  season: number | null
  sgOffTheTee: number | null
  sgApproach: number | null
  sgAroundGreen: number | null
  sgPutting: number | null
  sgTotal: number | null
  drivingDistance: number | null
  drivingAccuracy: number | null
  fairwaysHit: number | null
  fairwaysPossible: number | null
  greensInRegulation: number | null
  greensPossible: number | null
  putts: number | null
  birdies: number | null
  eagles: number | null
  pars: number | null
  bogeys: number | null
  doubleBogeys: number | null
  scramblingPercentage: number | null
  sandSavePercentage: number | null
}

/** A single player's raw round samples. */
export interface PlayerSkillSamples {
  playerId: string
  /** Primary season to normalize against (usually the latest). */
  season: number | null
  rounds: SkillRoundSample[]
}

/**
 * The population distribution used for field-relative normalization: for each
 * skill, the sorted-ascending array of per-player RAW aggregates across the
 * normalization population. Absent keys ⇒ that skill cannot be ranked yet.
 */
export type SkillPopulation = Partial<Record<SkillKey, number[]>>

/** Everything the pure profile builder needs. Deterministic (inject `now`). */
export interface PlayerSkillProfileInput {
  playerId: string
  season: number | null
  samples: PlayerSkillSamples
  population: SkillPopulation
  now?: Date
}

/* ------------------------------------------------------------------ */
/* Field leaderboards (tournament page)                               */
/* ------------------------------------------------------------------ */

/** The leaderboard categories the tournament hub exposes. */
export type SkillLeaderboardKey =
  | "bestIronPlayers"
  | "bestPutters"
  | "bestScramblers"
  | "longestDrivers"
  | "mostAccurateDrivers"
  | "highestConfidence"

/** One ranked entrant in a skill leaderboard. */
export interface SkillLeaderboardEntry {
  rank: number
  playerId: string
  playerName: string
  /** Normalized rating 0–100 (or overall confidence score for the confidence board). */
  value: number | null
  band: SkillBand | null
  /** Raw value in native units for the driving lists, else `null`. */
  rawValue: number | null
  unit: SkillUnit | null
  confidence: SkillConfidence
}

/** A single leaderboard with its metadata. */
export interface SkillLeaderboard {
  key: SkillLeaderboardKey
  title: string
  description: string
  /** The skill this board ranks, or `null` for the confidence board. */
  skill: SkillKey | null
  entries: SkillLeaderboardEntry[]
}

/** The full set of tournament-hub skill leaderboards. */
export interface SkillLeaderboards {
  season: number | null
  /** Entrants with at least one rated skill. */
  ratedPlayers: number
  /** Total entrants considered. */
  totalPlayers: number
  boards: SkillLeaderboard[]
}
