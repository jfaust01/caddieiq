/**
 * Adapter: Overall Rating → Explanation.
 *
 * The Overall Rating is the mean of the available *core* season analytics. This
 * adapter maps that existing computation into the canonical shape without
 * recomputing anything: each available core metric contributes an equal share
 * (`value / N`) of the mean, so its weight is `100 / N` and its contribution is
 * `value / N`. Independent signals (e.g. Ranking Momentum) are surfaced as
 * context-only contributors that never moved the headline. Metrics the platform
 * cannot yet ground become explicit limitations — never a fabricated 50.
 */

import type { PlayerAnalytics } from "@/lib/analytics/types"
import { fromGraded, blendConfidence } from "../confidence"
import { buildHeadline, directionFromScore, emptyNarrative, roundOrNull } from "../helpers"
import { getModelMeta } from "../registry"
import type { Contributor, Explanation, ExplanationConfidence, ExplanationSubject, Limitation } from "../types"

export function toOverallRatingExplanation(
  analytics: PlayerAnalytics,
  subject: ExplanationSubject,
): Explanation {
  const model = getModelMeta("overall-rating")

  const core = analytics.scores.filter((s) => !s.independent)
  const scored = core.filter((s) => s.value !== null)
  const n = scored.length
  const share = n > 0 ? 100 / n : null

  const contributors: Contributor[] = []
  const limitations: Limitation[] = []

  // Core metrics: each available one is an equal-weighted slice of the mean.
  for (const s of core) {
    if (s.value === null) {
      limitations.push({
        code: `metric-unavailable:${s.key}`,
        message: `${s.label} could not be scored (${s.description})`,
      })
      continue
    }
    contributors.push({
      key: s.key,
      label: s.label,
      description: s.description,
      rawValue: roundOrNull(s.value),
      normalizedValue: roundOrNull(s.value),
      weightPct: share === null ? null : Math.round(share),
      contribution: share === null ? null : roundOrNull((s.value * share) / 100),
      direction: directionFromScore(s.value),
      confidence: fromGraded(s.confidence),
      independent: false,
    })
  }

  // Independent signals: shown for context, explicitly excluded from the score.
  for (const s of analytics.scores.filter((x) => x.independent)) {
    contributors.push({
      key: s.key,
      label: s.label,
      description: s.description,
      rawValue: roundOrNull(s.value),
      normalizedValue: roundOrNull(s.value),
      weightPct: null,
      contribution: null,
      direction: "neutral",
      confidence: fromGraded(s.confidence),
      independent: true,
    })
  }

  contributors.sort((a, b) => {
    if (a.independent !== b.independent) return a.independent ? 1 : -1
    return (b.contribution ?? -Infinity) - (a.contribution ?? -Infinity)
  })

  // Composite confidence = conservative blend of the scored core metrics.
  const confidence: ExplanationConfidence =
    analytics.overallRating === null
      ? "none"
      : blendConfidence(scored.map((s) => fromGraded(s.confidence)))

  if (analytics.isEmpty || analytics.overallRating === null) {
    limitations.unshift({
      code: "no-rating",
      message:
        analytics.season === null
          ? "No season analytics exist for this player yet, so no overall rating can be computed."
          : "None of the season analytics could be computed from the data held, so no overall rating is available.",
    })
  }

  const reasoning: string[] = []
  if (analytics.overallRating !== null) {
    reasoning.push(
      `Mean of ${n} available season ${n === 1 ? "analytic" : "analytics"}, each normalized against a field of ${analytics.sampleSize}.`,
    )
  }
  if (analytics.season !== null) reasoning.push(`Normalized against the ${analytics.season} season.`)

  return {
    model,
    subject,
    headline: buildHeadline({
      value: roundOrNull(analytics.overallRating),
      unit: "score-100",
      band: analytics.overallBand,
      confidence,
    }),
    contributors,
    reasoning,
    assumptions: [
      {
        code: "equal-weight-mean",
        message:
          "Available analytics are weighted equally (a simple mean); the model does not yet weight signal families differently.",
      },
    ],
    limitations,
    provenance: {
      sources: ["CaddieIQ Analytics Engine"],
      asOf: null,
    },
    narrative: emptyNarrative(),
  }
}
