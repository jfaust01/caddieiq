/**
 * Adapter: DFS Value → Explanation.
 *
 * The DFS Value Model already composes independent Signal Families (weighted)
 * with salary. This adapter maps each *scored* family to a contributor whose
 * signed contribution is the weighted deviation from a neutral-50 strength
 * (`weight × (score − 50)`), and surfaces salary efficiency as an unweighted
 * cost-side contributor (value is strength ÷ cost, so salary is not part of the
 * strength weighting). Unavailable families and model risks become explicit
 * limitations; the model's own drivers/risks seed the reasoning.
 */

import type { DfsValueResult, DfsSignalContribution } from "@/lib/dfs-value/types"
import { fromGraded } from "../confidence"
import { buildHeadline, emptyNarrative, roundOrNull, round1, directionFromScore } from "../helpers"
import { getModelMeta } from "../registry"
import type { Contributor, Explanation, ExplanationSubject, Limitation } from "../types"

const TIER_BAND: Record<NonNullable<DfsValueResult["tier"]>, string> = {
  A_PLUS: "A+",
  A: "A",
  B_PLUS: "B+",
  B: "B",
  C: "C",
  D: "D",
}

export function toDfsValueExplanation(result: DfsValueResult, subject: ExplanationSubject): Explanation {
  const model = getModelMeta("dfs-value")

  const contributors: Contributor[] = result.contributions
    .filter((c) => c.status === "scored" && c.score !== null)
    .map((c: DfsSignalContribution) => {
      const strength = c.score as number
      const contribution = round1(c.weight * (strength - 50))
      return {
        key: c.key,
        label: c.label,
        description: c.rating ? `${c.rating} — contributes ${c.label} to the value composite.` : `${c.label} signal family.`,
        rawValue: roundOrNull(strength),
        normalizedValue: roundOrNull(strength),
        weightPct: Math.round(c.weight * 100),
        contribution,
        direction: contribution === null || contribution === 0 ? "neutral" : contribution > 0 ? "positive" : "negative",
        confidence: fromGraded(c.confidence),
        independent: false,
      } satisfies Contributor
    })
    .sort((a, b) => Math.abs(b.contribution ?? 0) - Math.abs(a.contribution ?? 0))

  // Salary is the cost side of value: shown, but not part of the strength weighting.
  if (result.salaryEfficiency !== null) {
    contributors.push({
      key: "salary",
      label: "Salary Efficiency",
      description:
        result.salary !== null
          ? `DraftKings salary $${result.salary.toLocaleString()} (${result.salaryTier ?? "unranked"} tier) — cheaper salaries raise value.`
          : "Field-relative salary efficiency (cheaper raises value).",
      rawValue: result.salary,
      normalizedValue: roundOrNull(result.salaryEfficiency),
      weightPct: null,
      contribution: null,
      direction: directionFromScore(result.salaryEfficiency),
      confidence: fromGraded(result.confidence),
      independent: false,
    })
  }

  const limitations: Limitation[] = result.contributions
    .filter((c) => c.status === "unavailable")
    .map((c) => ({
      code: `family-unavailable:${c.key}`,
      message: `${c.label} could not be scored (${c.reason ?? "signal missing"}), so it did not contribute and lowered confidence.`,
    }))

  if (result.score === null) {
    limitations.unshift({
      code: "no-value",
      message:
        result.salary === null
          ? "The player has no DraftKings salary for this slate, so a value score cannot be computed."
          : "No signal family could be scored for this player, so DFS value is unavailable.",
    })
  }

  const reasoning: string[] = []
  if (result.strength !== null) reasoning.push(`Projected quality (strength) of ${roundOrNull(result.strength)}/100 before salary.`)
  for (const d of result.drivers.slice(0, 3)) reasoning.push(`${d.label}: ${d.detail}`)
  for (const r of result.risks.slice(0, 2)) reasoning.push(`Risk — ${r.label}: ${r.detail}`)

  return {
    model,
    subject,
    headline: buildHeadline({
      value: roundOrNull(result.score),
      unit: "score-100",
      band: result.tier ? TIER_BAND[result.tier] : null,
      confidence: fromGraded(result.confidence),
    }),
    contributors,
    reasoning,
    assumptions: [
      {
        code: "context-ceiling",
        message: "Confidence can never exceed the Tournament Context ceiling this field was built on.",
      },
      {
        code: "independent-families",
        message: "Signal families are treated as independent; families sharing a source share a weight budget to avoid double-counting.",
      },
    ],
    limitations,
    provenance: {
      sources: ["Player Skill", "Course Fit", "Odds Intelligence", "Weather Intelligence", "Analytics Engine", "DraftKings salaries"],
      asOf: null,
    },
    narrative: emptyNarrative(),
  }
}
