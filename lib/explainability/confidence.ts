/**
 * Confidence normalization — the single place every model's native confidence
 * vocabulary is mapped onto the canonical {@link ExplanationConfidence} scale.
 *
 * The platform uses two vocabularies:
 *  - the graded scale (`none | low | medium | high`) — analytics, course fit,
 *    DFS value, player skill; weather adds this too but calls "none" →
 *    `unavailable`.
 *  - the verified scale (`verified | partial | unavailable`) — odds/betting and
 *    tournament context.
 *
 * Mapping is deliberately conservative: `verified → high`, `partial → medium`,
 * anything absent → `none`. The engine never upgrades a grade.
 */

import type { ExplanationConfidence, ExplanationConfidenceLabel } from "./types"

/** Map the graded vocabulary (`none|low|medium|high`, `unavailable`) → canonical. */
export function fromGraded(
  value: "none" | "low" | "medium" | "high" | "unavailable" | null | undefined,
): ExplanationConfidence {
  switch (value) {
    case "high":
      return "high"
    case "medium":
      return "medium"
    case "low":
      return "low"
    default:
      // "none", "unavailable", null, undefined
      return "none"
  }
}

/** Map the verified vocabulary (`verified|partial|unavailable`) → canonical. */
export function fromVerified(
  value: "verified" | "partial" | "unavailable" | null | undefined,
): ExplanationConfidence {
  switch (value) {
    case "verified":
      return "high"
    case "partial":
      return "medium"
    default:
      return "none"
  }
}

/** The display label for a canonical confidence grade. */
export function confidenceLabel(value: ExplanationConfidence): ExplanationConfidenceLabel {
  switch (value) {
    case "high":
      return "High"
    case "medium":
      return "Medium"
    case "low":
      return "Low"
    case "none":
      return "Unavailable"
  }
}

/** Numeric rank for ordering / conservative blending (higher = more certain). */
export function confidenceRank(value: ExplanationConfidence): number {
  switch (value) {
    case "high":
      return 3
    case "medium":
      return 2
    case "low":
      return 1
    case "none":
      return 0
  }
}

/**
 * The conservative blend of several confidence grades: the lowest present grade
 * (ignoring `none` unless every input is `none`). Mirrors the "confidence is the
 * weakest input it relies on" principle in MODELS.md §3.
 */
export function blendConfidence(values: readonly ExplanationConfidence[]): ExplanationConfidence {
  const present = values.filter((v) => v !== "none")
  if (present.length === 0) return "none"
  return present.reduce((lowest, v) => (confidenceRank(v) < confidenceRank(lowest) ? v : lowest))
}
