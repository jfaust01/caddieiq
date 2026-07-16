/**
 * Adapter: Player Skill → Explanation.
 *
 * Player Skill Intelligence has no single composite score by design — it rates
 * fifteen skills independently — so the headline value is `null` (honest, not a
 * fabricated average) and each *rated* skill becomes an unweighted contributor
 * carrying its normalized 0–100 rating, its raw value in native units, and its
 * direction from its band. Unknown skills (no data or no provider field) become
 * explicit limitations, never zeros.
 */

import type { PlayerSkillProfile, SkillBand, SkillSignal, SkillGap } from "@/lib/player-skill-intelligence/types"
import { fromGraded } from "../confidence"
import { buildHeadline, emptyNarrative, roundOrNull, round1 } from "../helpers"
import { getModelMeta } from "../registry"
import type { Contributor, ContributorDirection, Explanation, ExplanationSubject, Limitation } from "../types"

const POSITIVE_BANDS: readonly SkillBand[] = ["ABOVE_AVERAGE", "EXCELLENT", "ELITE"]
const NEGATIVE_BANDS: readonly SkillBand[] = ["BELOW_AVERAGE", "POOR", "VERY_POOR"]

function directionFromBand(band: SkillBand | null): ContributorDirection {
  if (band === null) return "neutral"
  if (POSITIVE_BANDS.includes(band)) return "positive"
  if (NEGATIVE_BANDS.includes(band)) return "negative"
  return "neutral"
}

const UNIT_SUFFIX: Record<SkillSignal["unit"], string> = {
  strokes: " SG",
  yards: " yd",
  percent: "%",
}

function gapMessage(gap: SkillGap): string {
  switch (gap.code) {
    case "no-round-statistics":
      return "No round statistics are ingested for this player yet."
    case "no-samples":
      return `No samples for ${gap.skill ?? "a skill"}${gap.detail ? ` (${gap.detail})` : ""}.`
    case "no-provider-field":
      return `${gap.skill ?? "This skill"} has no provider source field yet, so it stays unknown.`
    case "insufficient-population":
      return "Too few players in the field to rank this skill fairly."
    case "player-not-found":
      return "This player could not be resolved for skill rating."
    default:
      return gap.detail ?? "Skill rating unavailable."
  }
}

export function toPlayerSkillExplanation(
  profile: PlayerSkillProfile,
  subject: ExplanationSubject,
): Explanation {
  const model = getModelMeta("player-skill")

  const contributors: Contributor[] = profile.skills
    .filter((s) => s.value !== null)
    .map((s) => ({
      key: s.key,
      label: s.label,
      description: `${s.band ? `${s.band.replace(/_/g, " ").toLowerCase()} ` : ""}${s.label}${
        s.rawValue !== null ? ` (${round1(s.rawValue)}${UNIT_SUFFIX[s.unit]})` : ""
      }`,
      rawValue: round1(s.rawValue),
      normalizedValue: roundOrNull(s.value),
      weightPct: null,
      contribution: null,
      direction: directionFromBand(s.band),
      confidence: fromGraded(s.confidence),
      independent: false,
    }))
    .sort((a, b) => (b.normalizedValue ?? -Infinity) - (a.normalizedValue ?? -Infinity))

  const limitations: Limitation[] = profile.gaps.map((g) => ({
    code: `skill-gap:${g.code}${g.skill ? `:${g.skill}` : ""}`,
    message: gapMessage(g),
  }))

  if (profile.status === "unavailable" || contributors.length === 0) {
    limitations.unshift({
      code: "no-skills",
      message: profile.detail || "No skills could be rated for this player from the data held.",
    })
  }

  const reasoning: string[] = []
  if (profile.eliteSkills.length > 0) reasoning.push(`${profile.eliteSkills.length} elite/excellent ${profile.eliteSkills.length === 1 ? "skill" : "skills"}.`)
  if (profile.weaknesses.length > 0) reasoning.push(`${profile.weaknesses.length} weak ${profile.weaknesses.length === 1 ? "area" : "areas"}.`)
  reasoning.push(`Rated ${profile.coverage.known} of ${profile.coverage.total} tracked skills; recent trajectory is ${profile.trend}.`)

  return {
    model,
    subject,
    headline: buildHeadline({
      // Player Skill is intentionally not a single 0–100 composite.
      value: null,
      unit: "none",
      band: null,
      confidence: fromGraded(profile.confidence),
    }),
    contributors,
    reasoning,
    assumptions: [
      {
        code: "field-relative",
        message: `Ratings are percentiles against the ${profile.season ?? "current"} field; a rating reflects standing among peers, not an absolute skill level.`,
      },
    ],
    limitations,
    provenance: {
      sources: ["Player Skill Intelligence (verified round statistics)"],
      asOf: profile.freshness.lastRoundAt,
    },
    narrative: emptyNarrative(),
  }
}
