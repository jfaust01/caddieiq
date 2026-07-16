/**
 * Model Explainability Engine — canonical, model-agnostic types.
 *
 * This is CaddieIQ's single contract for "why does a model say what it says".
 * Every model already emits its own `score + confidence + weighted breakdown`;
 * a pure adapter (see `adapters/`) maps that existing output into the one
 * `Explanation` shape defined here. Nothing in this module performs I/O, imports
 * a provider, or recomputes a model — it is safe to import from server code,
 * pure engines, and client components alike.
 *
 * Honesty is structural, not aspirational:
 * - A model that cannot produce a score returns `headline.value = null`, never a
 *   fabricated number.
 * - A missing input becomes an explicit {@link Limitation}, never a neutral 50
 *   or a zero masquerading as data.
 * - Confidence is passed through from the underlying model; the engine never
 *   invents or inflates it.
 * - The `narrative` prose is produced in exactly one place (the narrator), so no
 *   two surfaces can disagree about what a score means.
 */

/** Every model the Explainability Engine can describe. Stable string keys. */
export type ModelId =
  | "overall-rating"
  | "course-fit"
  | "dfs-value"
  | "betting-value"
  | "fantasy-projection"
  | "player-skill"
  | "weather-intelligence"
  | "tournament-context"

/**
 * The canonical confidence grade. Every model's native confidence vocabulary
 * (`high|medium|low|none`, `verified|partial|unavailable`, …) is mapped onto
 * this scale by {@link ./confidence}. `none` means the model could not produce a
 * grounded score.
 */
export type ExplanationConfidence = "high" | "medium" | "low" | "none"

/** Display label for a confidence grade, matching the platform's UI vocabulary. */
export type ExplanationConfidenceLabel = "High" | "Medium" | "Low" | "Unavailable"

/** Whether a contributor pushes the score up, down, or is context-only. */
export type ContributorDirection = "positive" | "negative" | "neutral"

/** What kind of entity an explanation is about. */
export type ExplanationSubjectKind = "player" | "tournament" | "player-tournament"

/** The unit the headline value is expressed in, so the UI renders it correctly. */
export type HeadlineUnit = "score-100" | "probability" | "none"

/** Registry metadata for one model. */
export interface ModelMeta {
  id: ModelId
  /** Human label, e.g. "DFS Value". */
  label: string
  /** What the model is about, so the UI can pick the right entity picker. */
  category: ExplanationSubjectKind
  /** One-line, plain-language description of how the model works. */
  methodology: string
}

/** The entity an explanation describes. */
export interface ExplanationSubject {
  kind: ExplanationSubjectKind
  /** Stable id of the player and/or tournament (composite ids joined by ":"). */
  id: string
  /** Human label, e.g. "Scottie Scheffler — The Masters". */
  label: string
}

/** The headline reading: the score, its band, its unit, and its confidence. */
export interface ExplanationHeadline {
  /** The model's score, or `null` when the model does not emit a single score. */
  value: number | null
  /** How to read {@link value}. */
  unit: HeadlineUnit
  /** Qualitative band (e.g. "ELITE", "STRONG"), or `null`. */
  band: string | null
  /** Canonical confidence grade (mapped from the model's native grade). */
  confidence: ExplanationConfidence
  /** Display label for {@link confidence}. */
  confidenceLabel: ExplanationConfidenceLabel
}

/**
 * One factor behind the score. Mirrors the objective's contributor contract:
 * Signal Name, Weight, Contribution, Direction, Confidence, and Explanation.
 */
export interface Contributor {
  /** Stable key (React key / map key). */
  key: string
  /** Signal name, e.g. "Course Fit". */
  label: string
  /** Plain-language explanation of this contributor's effect. */
  description: string
  /** The raw underlying value (native units), or `null` when unavailable. */
  rawValue: number | string | null
  /** Field-relative normalized strength 0–100, or `null` when unavailable. */
  normalizedValue: number | null
  /** Weight within the composite as a percentage 0–100, or `null` when unweighted. */
  weightPct: number | null
  /** Signed points this contributor added to the composite (e.g. +18), or `null`. */
  contribution: number | null
  /** Whether it helped, hurt, or is context-only. */
  direction: ContributorDirection
  /** This contributor's own confidence, echoed for transparency. */
  confidence: ExplanationConfidence
  /**
   * True when this is a context-only signal excluded from the composite (so the
   * UI can show it without implying it moved the headline score).
   */
  independent: boolean
}

/** A stated assumption the model relies on (true today, may change). */
export interface Assumption {
  code: string
  message: string
}

/** An explicit limitation: missing data, degraded confidence, unmodeled area. */
export interface Limitation {
  code: string
  message: string
}

/** Where the numbers came from and how fresh they are. */
export interface ExplanationProvenance {
  /** Named data sources / engines this explanation draws on. */
  sources: string[]
  /** ISO timestamp of the underlying data, or `null` when not time-bound. */
  asOf: string | null
}

/** The generated prose. Produced only by a {@link ./narrator}. */
export interface ExplanationNarrative {
  /** One-paragraph plain-language summary. */
  summary: string
  /** Ordered supporting bullets (strongest factor first). */
  bullets: string[]
}

/**
 * THE canonical explanation. One per (model, subject). Adapters fill everything
 * except {@link narrative}, which the narrator fills from the rest.
 */
export interface Explanation {
  model: ModelMeta
  subject: ExplanationSubject
  headline: ExplanationHeadline
  /** Every factor, in display order (strongest first for weighted models). */
  contributors: Contributor[]
  /** Structured, factual statements the adapter derived (never prose fluff). */
  reasoning: string[]
  /** Assumptions the score rests on. */
  assumptions: Assumption[]
  /** Honest limitations: what is missing, degraded, or not yet modeled. */
  limitations: Limitation[]
  provenance: ExplanationProvenance
  /** Generated prose; empty until a narrator runs. */
  narrative: ExplanationNarrative
}
