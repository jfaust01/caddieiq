/**
 * Player Skill Intelligence — normalization + grading (pure).
 *
 * Turns a raw skill value into a field-relative 0–100 rating, a seven-level
 * band, and an AI-ready label. Also grades per-skill and per-profile confidence.
 * Every function is pure and total; missing inputs yield `null`, never a
 * fabricated rating.
 */

import type {
  SkillBand,
  SkillConfidence,
  SkillFamily,
} from "./types"

/** The minimum population needed to rank a skill honestly. */
export const MIN_POPULATION = 5

/**
 * Percentile-rank a raw value within a sorted-ascending population, respecting
 * direction. Returns 0–100, or `null` when the population is too small to rank.
 *
 * Uses the mean of "below" and "below-or-equal" ranks so ties land on the
 * midpoint rather than the floor or ceiling.
 */
export function percentileOf(
  value: number,
  sortedAscending: readonly number[],
  higherIsBetter: boolean,
): number | null {
  const n = sortedAscending.length
  if (n < MIN_POPULATION || !Number.isFinite(value)) return null

  let below = 0
  let equal = 0
  for (const v of sortedAscending) {
    if (v < value) below += 1
    else if (v === value) equal += 1
  }
  // Fractional rank for a "lower value" percentile.
  const lowerPct = ((below + equal / 2) / n) * 100
  const pct = higherIsBetter ? lowerPct : 100 - lowerPct
  return clamp(round1(pct), 0, 100)
}

/** Map a 0–100 percentile rating to a seven-level band. */
export function scoreToBand(score: number): SkillBand {
  if (score >= 93) return "ELITE"
  if (score >= 80) return "EXCELLENT"
  if (score >= 63) return "ABOVE_AVERAGE"
  if (score >= 37) return "AVERAGE"
  if (score >= 20) return "BELOW_AVERAGE"
  if (score >= 7) return "POOR"
  return "VERY_POOR"
}

/** Human label for a band. */
export function bandLabel(band: SkillBand): string {
  switch (band) {
    case "ELITE":
      return "Elite"
    case "EXCELLENT":
      return "Excellent"
    case "ABOVE_AVERAGE":
      return "Above average"
    case "AVERAGE":
      return "Average"
    case "BELOW_AVERAGE":
      return "Below average"
    case "POOR":
      return "Poor"
    case "VERY_POOR":
      return "Very poor"
  }
}

/** The band adjective used in AI labels ("Elite Iron Player"). */
export function bandAdjective(band: SkillBand): string {
  switch (band) {
    case "ELITE":
      return "Elite"
    case "EXCELLENT":
      return "Excellent"
    case "ABOVE_AVERAGE":
      return "Strong"
    case "AVERAGE":
      return "Average"
    case "BELOW_AVERAGE":
      return "Below-average"
    case "POOR":
      return "Weak"
    case "VERY_POOR":
      return "Very weak"
  }
}

/**
 * The AI-ready label for a rated skill: a band adjective + the skill's noun,
 * e.g. "Elite Iron Player", "Average Putter", "Weak Driver Accuracy". No prose.
 */
export function skillExplanationLabel(band: SkillBand, noun: string): string {
  return `${bandAdjective(band)} ${noun}`
}

/** Numeric rank of a confidence level (for comparisons / sorting). */
export const CONFIDENCE_RANK: Readonly<Record<SkillConfidence, number>> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
}

/**
 * Grade a single skill's confidence from its sample size and whether it was
 * rankable against a sufficient population. Freshness is folded in at the
 * profile level; a skill with no samples is always `none`.
 */
export function gradeSkillConfidence(sampleSize: number, ranked: boolean): SkillConfidence {
  if (sampleSize <= 0) return "none"
  if (!ranked) return "low"
  if (sampleSize >= 16) return "high"
  if (sampleSize >= 6) return "medium"
  return "low"
}

/**
 * Grade the profile-level confidence. Confidence is the conservative blend of
 * coverage (share of sourceable skills rated), sample volume (rounds), and
 * freshness (recency of the last round). Unknown skills drag coverage down, so
 * a thin profile can never read as certain.
 */
export function gradeProfileConfidence(args: {
  knownSourceable: number
  sourceableTotal: number
  rounds: number
  ageDays: number | null
}): SkillConfidence {
  const { knownSourceable, sourceableTotal, rounds, ageDays } = args
  if (knownSourceable <= 0 || rounds <= 0) return "none"

  const coverageScore = sourceableTotal > 0 ? knownSourceable / sourceableTotal : 0
  const sampleScore = Math.min(1, rounds / 24)
  const freshnessScore =
    ageDays === null ? 0.3 : ageDays < 30 ? 1 : ageDays < 90 ? 0.6 : ageDays < 365 ? 0.35 : 0.15

  const combined = 0.4 * coverageScore + 0.35 * sampleScore + 0.25 * freshnessScore
  if (combined >= 0.7) return "high"
  if (combined >= 0.45) return "medium"
  return "low"
}

/**
 * Derive a trend direction from a recent raw aggregate vs. a prior baseline,
 * respecting direction. `threshold` is the fraction of the baseline's magnitude
 * a change must exceed to count as movement (default 5%).
 */
export function trendDirection(
  recent: number | null,
  prior: number | null,
  higherIsBetter: boolean,
  threshold = 0.05,
): "improving" | "stable" | "declining" | "unknown" {
  if (recent === null || prior === null) return "unknown"
  const magnitude = Math.max(Math.abs(prior), 1e-6)
  const delta = recent - prior
  const relative = delta / magnitude
  if (Math.abs(relative) < threshold) return "stable"
  const better = higherIsBetter ? delta > 0 : delta < 0
  return better ? "improving" : "declining"
}

/** Family display noun (used in section grouping headers). */
export function familyLabel(family: SkillFamily): string {
  switch (family) {
    case "offTheTee":
      return "Off the Tee"
    case "approach":
      return "Approach"
    case "aroundGreen":
      return "Around the Green"
    case "putting":
      return "Putting"
    case "teeToGreen":
      return "Tee to Green"
    case "scoring":
      return "Scoring"
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
