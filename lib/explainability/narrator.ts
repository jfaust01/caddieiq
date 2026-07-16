/**
 * Explanation narrator — turns a structured {@link Explanation} into grounded
 * prose ({@link ExplanationNarrative}).
 *
 * The narrator is defined as an interface (the seam) with one deterministic
 * implementation today. A future LLM-backed narrator can implement the same
 * interface and be swapped in without touching adapters or UI. Whatever the
 * implementation, the contract is the same and non-negotiable:
 *
 *   The narrative may only restate facts already present in the Explanation.
 *
 * The deterministic narrator upholds this structurally — it reads only the
 * explanation's own headline, contributors, reasoning, and limitations — so it
 * is impossible for it to invent a factor, a number, or a confidence level. Any
 * LLM implementation MUST be constrained (grounded prompt + validation) to the
 * same guarantee.
 */

import type {
  Contributor,
  Explanation,
  ExplanationNarrative,
} from "./types"

/** The swap-in seam. Pure `Explanation → narrative`; no side effects expected. */
export interface ExplanationNarrator {
  readonly id: string
  narrate(explanation: Explanation): ExplanationNarrative
}

/** How a headline confidence grade reads inline in prose. */
const CONFIDENCE_PHRASE: Record<Explanation["headline"]["confidence"], string> = {
  high: "high confidence",
  medium: "moderate confidence",
  low: "low confidence",
  none: "no gradeable confidence",
}

/** Verb describing a contributor's direction, for bullets. */
function directionVerb(direction: Contributor["direction"]): string {
  switch (direction) {
    case "positive":
      return "lifts"
    case "negative":
      return "drags on"
    case "neutral":
      return "informs"
  }
}

/**
 * The default, deterministic narrator. Grounded by construction: it only ever
 * restates the explanation's own fields, so it cannot fabricate reasoning.
 */
export const deterministicNarrator: ExplanationNarrator = {
  id: "deterministic-v1",
  narrate(explanation: Explanation): ExplanationNarrative {
    const { headline, contributors, limitations, model, subject } = explanation

    const summary = buildSummary(explanation)

    const bullets: string[] = []

    // Lead with the composite contributors, strongest first (adapters pre-sort).
    const composite = contributors.filter((c) => !c.independent)
    for (const c of composite.slice(0, 4)) {
      bullets.push(narrateContributor(c))
    }

    // Then any context-only signals, clearly marked as not moving the score.
    const independent = contributors.filter((c) => c.independent)
    for (const c of independent.slice(0, 2)) {
      const value = c.normalizedValue ?? c.rawValue
      bullets.push(
        `${c.label}${value !== null ? ` (${value})` : ""} is shown for context and does not move the ${model.label.toLowerCase()}.`,
      )
    }

    // Always surface the single most important limitation, if any.
    if (limitations.length > 0) {
      bullets.push(`Limitation: ${limitations[0].message}`)
    }

    // Guarantee at least one honest bullet even for an empty explanation.
    if (bullets.length === 0) {
      bullets.push(
        headline.value === null
          ? `No score could be grounded for ${subject.label} from the data held.`
          : `No individual factors were available to break down this score.`,
      )
    }

    return { summary, bullets }
  },
}

/** Compose the one-paragraph summary from the headline + top factor + caveats. */
function buildSummary(explanation: Explanation): string {
  const { headline, contributors, limitations, model, subject } = explanation
  const confidencePhrase = CONFIDENCE_PHRASE[headline.confidence]

  // No score: state that plainly and why (first limitation), never guess.
  if (headline.value === null) {
    const band = headline.band ? ` (${headline.band})` : ""
    const reason = limitations[0]?.message
    return `${model.label} is unavailable for ${subject.label}${band}. ${reason ?? "The required inputs are not present, so no score is shown rather than a fabricated one."}`
  }

  const unitLabel =
    headline.unit === "probability"
      ? `${headline.value}%`
      : headline.unit === "score-100"
        ? `${headline.value}/100`
        : `${headline.value}`
  const band = headline.band ? ` — ${headline.band}` : ""

  const lead = `${model.label} for ${subject.label} is ${unitLabel}${band}, at ${confidencePhrase}.`

  const topFactor = contributors.find((c) => !c.independent && c.direction !== "neutral")
  const factorClause = topFactor
    ? ` The largest driver is ${topFactor.label.toLowerCase()}, which ${directionVerb(topFactor.direction)} the score.`
    : ""

  const caveatClause =
    limitations.length > 0
      ? ` Note: ${limitations[0].message}`
      : ""

  return `${lead}${factorClause}${caveatClause}`
}

/** A single contributor bullet, restating only its own fields. */
function narrateContributor(c: Contributor): string {
  const value = c.normalizedValue ?? c.rawValue
  const valueClause = value !== null ? ` (${value})` : ""
  const weightClause = c.weightPct !== null ? `, ${c.weightPct}% of the score` : ""
  return `${c.label}${valueClause} ${directionVerb(c.direction)} the result${weightClause}: ${c.description}`
}

/**
 * Convenience: attach a narrative to an explanation using a chosen narrator
 * (defaults to the deterministic one). Returns a new object; never mutates.
 */
export function narrate(
  explanation: Explanation,
  narrator: ExplanationNarrator = deterministicNarrator,
): Explanation {
  return { ...explanation, narrative: narrator.narrate(explanation) }
}
