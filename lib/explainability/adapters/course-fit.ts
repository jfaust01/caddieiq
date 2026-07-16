/**
 * Adapter: Course Fit → Explanation.
 *
 * Course Fit already emits demand-weighted per-skill signals plus ranked
 * drivers. This adapter maps each scored signal to a contributor whose signed
 * contribution is the weighted deviation from a neutral-50 fit
 * (`weight × (skill − 50)`) — the same quantity the model's own drivers report —
 * so the "Why?" view and the model never disagree. Unavailable signals become
 * explicit limitations with the model's own reason, never a fabricated fit.
 */

import type { CourseFitResult, FitSignal, FitUnavailableReason } from "@/lib/analytics/course-fit/types"
import { fromGraded } from "../confidence"
import { buildHeadline, emptyNarrative, roundOrNull, round1 } from "../helpers"
import { getModelMeta } from "../registry"
import type { Contributor, Explanation, ExplanationSubject, Limitation } from "../types"

const REASON_TEXT: Record<FitUnavailableReason, string> = {
  "course-demand-missing": "the course's demand for this skill is not in its profile",
  "player-skill-missing": "the player's rating for this skill is not ingested yet",
  "both-missing": "neither the course demand nor the player's skill rating is available",
}

export function toCourseFitExplanation(
  result: CourseFitResult,
  subject: ExplanationSubject,
): Explanation {
  const model = getModelMeta("course-fit")

  const contributors: Contributor[] = result.signals
    .filter((s) => s.status === "scored" && s.skill !== null)
    .map((s: FitSignal) => {
      const skill = s.skill as number
      const contribution = round1(s.weight * (skill - 50))
      return {
        key: s.key,
        label: s.label,
        description: s.rationale,
        rawValue: roundOrNull(skill),
        normalizedValue: roundOrNull(skill),
        weightPct: Math.round(s.weight * 100),
        contribution,
        direction: contribution === null || contribution === 0 ? "neutral" : contribution > 0 ? "positive" : "negative",
        confidence: fromGraded(result.confidence),
        independent: false,
      } satisfies Contributor
    })
    .sort((a, b) => Math.abs(b.contribution ?? 0) - Math.abs(a.contribution ?? 0))

  const limitations: Limitation[] = result.missing.map((s) => ({
    code: `signal-unavailable:${s.key}`,
    message: `${s.label} was not scored — ${s.reason ? REASON_TEXT[s.reason] : "unavailable"}.`,
  }))

  if (result.score === null) {
    limitations.unshift({
      code: "no-fit",
      message:
        result.courseId === null
          ? "No host course is linked to this event, so course fit cannot be computed."
          : "No skill signal could be scored for this player, so course fit is unavailable.",
    })
  }

  const reasoning: string[] = []
  if (result.score !== null) {
    reasoning.push(
      `Demand-weighted blend of ${result.coverage.scored} of ${result.coverage.total} skill signals.`,
    )
  }
  if (result.drivers.length > 0) {
    const top = result.drivers[0]
    reasoning.push(`${top.label} is the strongest ${top.direction === "positive" ? "positive" : "negative"} driver.`)
  }

  return {
    model,
    subject,
    headline: buildHeadline({
      value: roundOrNull(result.score),
      unit: "score-100",
      band: result.band,
      confidence: fromGraded(result.confidence),
    }),
    contributors,
    reasoning,
    assumptions: [
      {
        code: "verified-both-sides",
        message: "A skill only contributes when BOTH the course's demand and the player's skill rating are verified.",
      },
    ],
    limitations,
    provenance: {
      sources: ["Course Intelligence Engine", "Player Skill Intelligence"],
      asOf: null,
    },
    narrative: emptyNarrative(),
  }
}
