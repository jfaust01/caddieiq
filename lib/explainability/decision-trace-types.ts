/**
 * Decision Trace — a derived, ordered timeline view of a canonical
 * {@link Explanation}. The trace never recomputes a model and never introduces
 * numbers that are not already present in the explanation it is built from; it
 * only reorders, classifies, and re-presents existing signals as a pipeline the
 * way an analyst would walk through the decision.
 *
 * @see ./decision-trace.ts for the pure builder
 * @see ../../docs/DECISION_TRACE_ENGINE.md
 */

import type {
  ContributorDirection,
  ExplanationConfidence,
  ExplanationConfidenceLabel,
  ExplanationSubject,
  Limitation,
  ModelId,
} from './types'

/**
 * Stable pipeline categories, in the canonical order an analyst reasons through
 * a golf decision. The trace builder places every contributor into exactly one
 * category and emits stages in this order. `final` is a synthetic closing stage
 * that restates the headline result.
 */
export type TraceStageCategory =
  | 'player-skill'
  | 'recent-form'
  | 'course-fit'
  | 'field-strength'
  | 'weather'
  | 'market'
  | 'salary'
  | 'context'
  | 'final'

/** Human-facing metadata for each category, used by the UI and docs. */
export interface TraceCategoryMeta {
  readonly category: TraceStageCategory
  /** Short label, e.g. "Course Fit". */
  readonly label: string
  /** One-line description of what this stage represents. */
  readonly description: string
}

/**
 * The qualitative impact a stage has on the outcome. Derived directly from the
 * contributor's {@link ContributorDirection} — never inferred independently.
 */
export type TraceImpact = 'positive' | 'negative' | 'neutral'

/**
 * A single evidence row inside a stage — a raw/normalized number the stage is
 * grounded in. Values are copied verbatim from the source contributor.
 */
export interface TraceEvidence {
  readonly label: string
  /** Formatted display value, or null if unavailable. */
  readonly display: string | null
}

/**
 * One stage in the decision pipeline. Maps 1:1 onto a canonical Contributor
 * (except the synthetic `final` stage), preserving its honesty metadata.
 */
export interface DecisionTraceStage {
  /** Stable id: the source contributor key, or `final` for the closing stage. */
  readonly id: string
  readonly category: TraceStageCategory
  readonly categoryLabel: string
  /** Stage headline, e.g. "Course Fit". */
  readonly title: string
  /**
   * Discrete 0–5 weight rendered as stars in the UI. Derived from the
   * contributor's `weightPct`. Null when the stage carries no weight (e.g. the
   * `final` summary or a context-only signal).
   */
  readonly weightStars: 0 | 1 | 2 | 3 | 4 | 5 | null
  /** Raw weight percentage from the source contributor, when available. */
  readonly weightPct: number | null
  readonly impact: TraceImpact
  readonly direction: ContributorDirection
  readonly confidence: ExplanationConfidence
  /**
   * Whether this signal fed the score or is shown for context only. Copied from
   * the source contributor's `independent` flag so a context-only signal is
   * never presented as a driver.
   */
  readonly influencesOutcome: boolean
  /** Plain-language summary, copied from the contributor description. */
  readonly summary: string
  /** Grounding numbers for this stage. */
  readonly evidence: readonly TraceEvidence[]
}

/**
 * The complete derived trace for one model output. Carries the same subject,
 * confidence, and limitations as the source {@link Explanation} so the timeline
 * and the "Why?" breakdown can never disagree.
 */
export interface DecisionTrace {
  readonly modelId: ModelId
  readonly modelLabel: string
  readonly subject: ExplanationSubject
  /** Headline / final outcome, restated for the closing stage. */
  readonly headlineLabel: string
  readonly headlineValue: number | null
  readonly headlineDisplay: string
  readonly overallConfidence: ExplanationConfidence
  readonly overallConfidenceLabel: ExplanationConfidenceLabel
  /** Ordered pipeline stages, always ending with the `final` stage. */
  readonly stages: readonly DecisionTraceStage[]
  /** Same limitations surfaced by the Explanation — shown, never hidden. */
  readonly limitations: readonly Limitation[]
  /** Provenance passthrough for the developer trace. */
  readonly generatedAt: string
}

/** Narrated, trace-grounded coach summary. */
export interface TraceNarrative {
  /** One-sentence outcome summary. */
  readonly summary: string
  /** Ordered, stage-by-stage plain-language walkthrough. */
  readonly steps: readonly string[]
  /** Caveat line derived from limitations, or null when there are none. */
  readonly caveat: string | null
}

/** Convenience: a trace paired with its narration. */
export interface NarratedDecisionTrace {
  readonly trace: DecisionTrace
  readonly narrative: TraceNarrative
}
