/**
 * DFS Value Model — domain types (client-safe, no I/O).
 *
 * The DFS Value Model is CaddieIQ's flagship decision model. It composes the
 * platform's independent Signal Families — Player Skill, Course Fit, Market
 * (Odds), Weather, and Season Form & Production — with a player's DraftKings
 * salary into ONE explainable "value" score: how much projected quality a player
 * offers relative to what they cost.
 *
 * It is NOT a projection model and NOT an optimizer. It estimates player value
 * relative to salary, and every score is fully explainable and
 * confidence-aware.
 *
 * Governing rules (see docs/DFS_VALUE_MODEL.md and MODELS.md):
 * - Consume only reusable Intelligence objects — never providers directly. No
 *   provider-specific logic lives in the model.
 * - Independent families, no double-counting. Weight is allocated across
 *   families; a family that shares a source shares a weight budget.
 * - Honesty over coverage. A family contributes only when the platform actually
 *   holds its signal; a missing family is reported (never defaulted to a neutral
 *   50) and lowers confidence.
 * - Confidence propagates downward: it can never exceed the Tournament Context
 *   ceiling, and it is the conservative blend of the families actually present.
 * - Deterministic + pure: same inputs ⇒ same output; no time, randomness, I/O.
 *
 * These types import nothing from Prisma or providers so they are shared by the
 * server service, the pure engine, and client UI alike.
 */

/** The independent Signal Families the value composite draws on. */
export type DfsSignalKey =
  | "playerSkill"
  | "courseFit"
  | "market"
  | "form"
  | "weather"

/**
 * How much real data backed a value score. Mirrors the platform vocabulary.
 * `none` ⇒ the score is `null` (value could not be computed).
 */
export type DfsConfidence = "none" | "low" | "medium" | "high"

/**
 * The lettered value tier, best → worst. Derived from the value score, and
 * demoted when confidence is low so a shaky score never wears an A+ badge.
 */
export type DfsValueTier = "A_PLUS" | "A" | "B_PLUS" | "B" | "C" | "D"

/** Where a player sits in the field's salary distribution. */
export type DfsSalaryTier = "high" | "mid" | "value"

/** Whether a single Signal Family contributed to the composite. */
export type DfsSignalStatus = "scored" | "unavailable"

/** Machine-readable reason a family or the whole score is unavailable. */
export type DfsUnavailableReason =
  | "no-salary"
  | "no-signals"
  | "no-context"
  | "signal-missing"

/**
 * One Signal Family's reading for one player, on the shared 0–100 scale.
 * `unavailable` families carry a `reason` and contribute nothing to the score.
 */
export interface DfsSignalContribution {
  readonly key: DfsSignalKey
  readonly label: string
  readonly status: DfsSignalStatus
  /** The family's normalized 0–100 strength reading, or `null` when unavailable. */
  readonly score: number | null
  /** Normalized weight within the composite (0–1); 0 for unavailable families. */
  readonly weight: number
  /** Points contributed to the strength composite (`weight × score`), or `null`. */
  readonly contribution: number | null
  /** The family's own confidence, echoed for transparency. */
  readonly confidence: DfsConfidence
  /** Why an unavailable family was skipped; `null` when scored. */
  readonly reason: DfsUnavailableReason | null
  /** AI-ready short label for this family (e.g. "Elite", "Strong"), or `null`. */
  readonly rating: string | null
}

/** A family that materially helped the value score. */
export interface DfsDriver {
  readonly key: DfsSignalKey | "salary"
  readonly label: string
  /** Short, factual descriptor (enum-like), never hype. */
  readonly detail: string
}

/** A factor that reduces value or confidence — surfaced as a primary risk. */
export interface DfsRisk {
  readonly key: DfsSignalKey | "salary" | "confidence"
  readonly label: string
  readonly detail: string
}

/** Honest coverage accounting: how many families were scored. */
export interface DfsCoverage {
  readonly scored: number
  readonly total: number
}

/**
 * The compact, AI-ready factor map. Purely enums / short labels (no generated
 * prose) so an agent can consume it directly. Mirrors the example in the spec:
 * `{ courseFit: "Elite", skill: "Excellent Iron Play", weather: "Neutral", … }`.
 */
export interface DfsFactorMap {
  readonly courseFit: string
  readonly playerSkill: string
  readonly market: string
  readonly weather: string
  readonly form: string
  readonly salary: string
}

/** The full, explainable DFS Value result for one player. */
export interface DfsValueResult {
  readonly playerId: string
  readonly displayName: string
  readonly status: "available" | "unavailable"
  /** 0–100 DFS value (quality relative to salary), or `null` when unavailable. */
  readonly score: number | null
  readonly tier: DfsValueTier | null
  readonly confidence: DfsConfidence
  /**
   * The player's projected quality this week (0–100), independent of salary —
   * the strength half of "value". `null` when no family could be scored.
   */
  readonly strength: number | null
  /** DraftKings salary in whole dollars, or `null` when the player is unpriced. */
  readonly salary: number | null
  /** The player's salary tier within the field, or `null` when unpriced. */
  readonly salaryTier: DfsSalaryTier | null
  /** Salary efficiency 0–100 (cheaper = higher, field-relative), or `null`. */
  readonly salaryEfficiency: number | null
  /** Every modeled family — scored or explained-unavailable — in display order. */
  readonly contributions: readonly DfsSignalContribution[]
  /** Families/factors that helped the value, strongest first. */
  readonly drivers: readonly DfsDriver[]
  /** Factors that hurt value or certainty, most material first. */
  readonly risks: readonly DfsRisk[]
  /** Machine-readable codes for families that could not be scored. */
  readonly missing: readonly DfsSignalKey[]
  readonly coverage: DfsCoverage
  /** AI-ready factor map (enums/labels only, no prose). */
  readonly factors: DfsFactorMap
  /** Plain-language summary for the UI. Never fabricated. */
  readonly summary: string
}

/* ------------------------------------------------------------------ */
/* Engine inputs (pure)                                               */
/* ------------------------------------------------------------------ */

/**
 * One family's already-normalized reading, as handed to the pure engine. The
 * service layer maps each Intelligence object down to this shape so the model
 * never imports an engine or a provider.
 */
export interface DfsSignalInput {
  /** 0–100 strength reading, or `null` when the family holds no signal. */
  readonly score: number | null
  /** The family's own confidence (its ceiling contribution). */
  readonly confidence: DfsConfidence
  /** AI-ready short label for this family (e.g. "Elite", "Strong"), or `null`. */
  readonly rating: string | null
}

/** The complete per-player input: salary + one reading per Signal Family. */
export interface DfsPlayerInput {
  readonly playerId: string
  readonly displayName: string
  /** DraftKings salary in whole dollars, or `null` when unpriced. */
  readonly salary: number | null
  readonly playerSkill: DfsSignalInput
  readonly courseFit: DfsSignalInput
  readonly market: DfsSignalInput
  readonly form: DfsSignalInput
  readonly weather: DfsSignalInput
}

/**
 * The confidence ceiling from the Tournament Context Engine. The value model can
 * never present more certainty than the context it was built on.
 */
export type DfsContextCeiling = "verified" | "partial" | "unavailable"

/** Everything the pure field builder needs. Deterministic — no I/O. */
export interface DfsValueFieldInput {
  readonly players: readonly DfsPlayerInput[]
  /** The Tournament Context confidence ceiling. */
  readonly ceiling: DfsContextCeiling
}

/* ------------------------------------------------------------------ */
/* Field leaderboards (tournament page)                               */
/* ------------------------------------------------------------------ */

/** The DFS leaderboard categories the tournament hub exposes. */
export type DfsBoardKey =
  | "topValues"
  | "highEndValues"
  | "midRangeValues"
  | "valuePlays"
  | "highestConfidence"
  | "riskyGppTargets"

/** One ranked entrant in a DFS board — carries its own explanation. */
export interface DfsBoardEntry {
  readonly rank: number
  readonly playerId: string
  readonly displayName: string
  readonly score: number | null
  readonly tier: DfsValueTier | null
  readonly confidence: DfsConfidence
  readonly strength: number | null
  readonly salary: number | null
  readonly salaryTier: DfsSalaryTier | null
  /** The single most important reason this player is on this board. */
  readonly headline: string
}

/** A single DFS board with metadata. */
export interface DfsBoard {
  readonly key: DfsBoardKey
  readonly title: string
  readonly description: string
  readonly entries: readonly DfsBoardEntry[]
}

/** The full field-level DFS view for the tournament hub. */
export interface DfsValueField {
  /** Every player's full result, best value first. */
  readonly players: readonly DfsValueResult[]
  /** The ranked boards. */
  readonly boards: readonly DfsBoard[]
  /** Entrants with a computable value score. */
  readonly ratedPlayers: number
  /** Entrants that carried a DraftKings salary. */
  readonly pricedPlayers: number
  /** Total entrants considered. */
  readonly totalPlayers: number
  /** Field-average model confidence, as the conservative modal grade. */
  readonly averageConfidence: DfsConfidence
  /** The Tournament Context ceiling this field was capped at. */
  readonly ceiling: DfsContextCeiling
}
