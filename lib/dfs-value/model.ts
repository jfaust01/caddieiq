/**
 * DFS Value Model — the pure scoring core.
 *
 * `buildDfsValueField()` is a pure, deterministic, total function: given each
 * player's salary and one already-normalized reading per Signal Family (plus the
 * Tournament Context confidence ceiling), it returns every player's explainable
 * DFS Value result and the ranked field boards. It performs no I/O, imports no
 * engine or provider, and never throws.
 *
 * The math has two halves:
 *  1. **Strength** — a demand-weighted blend of the available Signal Families,
 *     renormalized over whatever is present (never a neutral-50 stand-in for a
 *     missing family). This is "how good is this player here, this week."
 *  2. **Value** — strength measured against price. A player's field percentile
 *     for strength minus their field percentile for salary is the value edge:
 *     positive means underpriced (a value), negative means overpriced. Studs
 *     priced like studs land near the middle — correct, because value (not raw
 *     strength) wins DFS.
 *
 * See docs/DFS_VALUE_MODEL.md for the full contract.
 */

import { buildDfsBoards } from "./leaderboards"
import type {
  DfsConfidence,
  DfsContextCeiling,
  DfsCoverage,
  DfsDriver,
  DfsFactorMap,
  DfsPlayerInput,
  DfsRisk,
  DfsSignalContribution,
  DfsSignalInput,
  DfsSignalKey,
  DfsSalaryTier,
  DfsValueField,
  DfsValueFieldInput,
  DfsValueResult,
  DfsValueTier,
} from "./types"

/* ------------------------------------------------------------------ */
/* Family configuration                                               */
/* ------------------------------------------------------------------ */

interface FamilyConfig {
  readonly key: DfsSignalKey
  readonly label: string
  /** Share of the value composite's weight budget (across families). */
  readonly weight: number
  /** How to read this family's input off a player. */
  readonly pick: (p: DfsPlayerInput) => DfsSignalInput
}

/**
 * Weight allocated ACROSS independent families (they are renormalized over the
 * families actually present per player). Player Skill and Market are the least
 * correlated, highest-information signals so they carry the most weight; Weather
 * is a small context modifier (and is identical across the field, so it never
 * distorts relative value). These are the tunable knobs documented in
 * DFS_VALUE_MODEL.md — the reasoning, not the exact numbers, is the contract.
 */
export const DFS_FAMILY_CONFIG: readonly FamilyConfig[] = [
  { key: "playerSkill", label: "Player Skill", weight: 0.3, pick: (p) => p.playerSkill },
  { key: "market", label: "Market", weight: 0.25, pick: (p) => p.market },
  { key: "courseFit", label: "Course Fit", weight: 0.2, pick: (p) => p.courseFit },
  { key: "form", label: "Form & Production", weight: 0.2, pick: (p) => p.form },
  { key: "weather", label: "Weather", weight: 0.05, pick: (p) => p.weather },
]

const FAMILY_COUNT = DFS_FAMILY_CONFIG.length

/* ------------------------------------------------------------------ */
/* Small pure helpers                                                 */
/* ------------------------------------------------------------------ */

const CONF_RANK: Record<DfsConfidence, number> = { none: 0, low: 1, medium: 2, high: 3 }
const RANK_CONF: readonly DfsConfidence[] = ["none", "low", "medium", "high"]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** A finite 0–100 reading, or `null`. Guards against NaN/Infinity from callers. */
function finiteScore(value: number | null): number | null {
  return value != null && Number.isFinite(value) ? clamp(value, 0, 100) : null
}

/**
 * Fractional rank of `value` within a sorted-ascending population, in [0, 1].
 * Uses the midpoint convention for ties so identical values share a percentile.
 * A single-element (or empty-reference) population returns the neutral 0.5.
 */
function percentileOf(value: number, sortedAsc: readonly number[]): number {
  const n = sortedAsc.length
  if (n <= 1) return 0.5
  let below = 0
  let equal = 0
  for (const v of sortedAsc) {
    if (v < value) below += 1
    else if (v === value) equal += 1
  }
  return clamp((below + equal / 2) / n, 0, 1)
}

/* ------------------------------------------------------------------ */
/* Stage 1 — per-player strength composite                            */
/* ------------------------------------------------------------------ */

interface StrengthComputation {
  readonly strength: number | null
  readonly contributions: DfsSignalContribution[]
  /** Pre-ceiling confidence from the families actually scored. */
  readonly rawConfidence: DfsConfidence
  readonly missing: DfsSignalKey[]
  readonly coverage: DfsCoverage
}

/**
 * Blend the available families into a 0–100 strength. Weights are renormalized
 * over the scored families only, so a missing family divides its weight among
 * the present ones rather than dragging the score toward a fabricated midpoint.
 */
function computeStrength(player: DfsPlayerInput): StrengthComputation {
  const scored: { cfg: FamilyConfig; input: DfsSignalInput; score: number }[] = []
  const missing: DfsSignalKey[] = []

  for (const cfg of DFS_FAMILY_CONFIG) {
    const input = cfg.pick(player)
    const score = finiteScore(input.score)
    if (score == null) missing.push(cfg.key)
    else scored.push({ cfg, input, score })
  }

  const totalScoredWeight = scored.reduce((sum, s) => sum + s.cfg.weight, 0)
  const hasStrength = scored.length > 0 && totalScoredWeight > 0

  const contributions: DfsSignalContribution[] = DFS_FAMILY_CONFIG.map((cfg) => {
    const match = scored.find((s) => s.cfg.key === cfg.key)
    const input = cfg.pick(player)
    if (!match || !hasStrength) {
      return {
        key: cfg.key,
        label: cfg.label,
        status: "unavailable" as const,
        score: null,
        weight: 0,
        contribution: null,
        confidence: input.confidence,
        reason: "signal-missing" as const,
        rating: input.rating,
      }
    }
    const weight = match.cfg.weight / totalScoredWeight
    return {
      key: cfg.key,
      label: cfg.label,
      status: "scored" as const,
      score: match.score,
      weight,
      contribution: weight * match.score,
      confidence: input.confidence,
      reason: null,
      rating: input.rating,
    }
  })

  const strength = hasStrength
    ? Math.round(
        contributions.reduce((sum, c) => sum + (c.contribution ?? 0), 0),
      )
    : null

  return {
    strength,
    contributions,
    rawConfidence: gradeRawConfidence(contributions, totalScoredWeight),
    missing,
    coverage: { scored: scored.length, total: FAMILY_COUNT },
  }
}

/**
 * Grade confidence from the scored families: a weight-weighted mean of their own
 * confidences, then dragged down by how much of the weight budget is missing.
 * This makes "unknown signals reduce confidence" literal — a score resting on
 * one medium family is `low`, never `medium`.
 */
function gradeRawConfidence(
  contributions: readonly DfsSignalContribution[],
  totalScoredWeight: number,
): DfsConfidence {
  const scored = contributions.filter((c) => c.status === "scored")
  if (scored.length === 0 || totalScoredWeight <= 0) return "none"

  const weightedConf =
    scored.reduce((sum, c) => sum + c.weight * CONF_RANK[c.confidence], 0) // weights already sum to 1 over scored
  const coverageRatio = totalScoredWeight // == Σ raw family weights present, in (0, 1]
  const effective = weightedConf * (0.5 + 0.5 * coverageRatio)

  if (effective >= 2.3) return "high"
  if (effective >= 1.3) return "medium"
  if (effective > 0) return "low"
  return "none"
}

/** Lower `conf` to at most `ceiling`'s allowance. */
function capConfidence(conf: DfsConfidence, ceiling: DfsContextCeiling): DfsConfidence {
  const max: DfsConfidence = ceiling === "verified" ? "high" : ceiling === "partial" ? "medium" : "none"
  return RANK_CONF[Math.min(CONF_RANK[conf], CONF_RANK[max])]
}

/* ------------------------------------------------------------------ */
/* Stage 2 — value, tier, drivers, risks                              */
/* ------------------------------------------------------------------ */

const TIER_ORDER: readonly DfsValueTier[] = ["D", "C", "B", "B_PLUS", "A", "A_PLUS"]

function tierFromScore(score: number): DfsValueTier {
  if (score >= 80) return "A_PLUS"
  if (score >= 70) return "A"
  if (score >= 62) return "B_PLUS"
  if (score >= 54) return "B"
  if (score >= 42) return "C"
  return "D"
}

/**
 * Cap the tier by confidence so a shaky score never wears a top badge: `low`
 * confidence caps at B+, `medium` caps at A, `high` is uncapped.
 */
function capTier(tier: DfsValueTier, conf: DfsConfidence): DfsValueTier {
  const cap: DfsValueTier | null = conf === "low" ? "B_PLUS" : conf === "medium" ? "A" : null
  if (!cap) return tier
  return TIER_ORDER[Math.min(TIER_ORDER.indexOf(tier), TIER_ORDER.indexOf(cap))]
}

function buildDrivers(
  contributions: readonly DfsSignalContribution[],
  salaryEfficiency: number | null,
): DfsDriver[] {
  const drivers: DfsDriver[] = []
  if (salaryEfficiency != null && salaryEfficiency >= 66) {
    drivers.push({ key: "salary", label: "Salary", detail: "Value-priced for the field" })
  }
  contributions
    .filter((c) => c.status === "scored" && (c.score ?? 0) >= 60)
    .sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0))
    .forEach((c) => drivers.push({ key: c.key, label: c.label, detail: c.rating }))
  return drivers.slice(0, 3)
}

function buildRisks(
  contributions: readonly DfsSignalContribution[],
  salaryEfficiency: number | null,
  confidence: DfsConfidence,
  missing: readonly DfsSignalKey[],
): DfsRisk[] {
  const risks: DfsRisk[] = []
  if (salaryEfficiency != null && salaryEfficiency <= 33) {
    risks.push({ key: "salary", label: "Salary", detail: "Premium price for the field" })
  }
  contributions
    .filter((c) => c.status === "scored" && (c.score ?? 100) <= 40)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .forEach((c) => risks.push({ key: c.key, label: c.label, detail: c.rating }))
  if (confidence === "low" || confidence === "none") {
    risks.push({ key: "confidence", label: "Confidence", detail: "Limited verified signals" })
  }
  if (risks.length === 0 && missing.length > 0) {
    risks.push({ key: "confidence", label: "Coverage", detail: `${missing.length} signal families unavailable` })
  }
  return risks.slice(0, 3)
}

function buildFactors(contributions: readonly DfsSignalContribution[], salaryTier: DfsSalaryTier | null): DfsFactorMap {
  const by = (key: DfsSignalKey): string => contributions.find((c) => c.key === key)?.rating ?? "Unknown"
  return {
    courseFit: by("courseFit"),
    playerSkill: by("playerSkill"),
    market: by("market"),
    weather: by("weather"),
    form: by("form"),
    salary: salaryTier ? SALARY_TIER_LABEL[salaryTier] : "Unpriced",
  }
}

const SALARY_TIER_LABEL: Record<DfsSalaryTier, string> = {
  high: "High-priced",
  mid: "Mid-priced",
  value: "Value-priced",
}

export const TIER_LABEL: Record<DfsValueTier, string> = {
  A_PLUS: "A+",
  A: "A",
  B_PLUS: "B+",
  B: "B",
  C: "C",
  D: "D",
}

/* ------------------------------------------------------------------ */
/* Field builder — the public entry point                             */
/* ------------------------------------------------------------------ */

interface Interim {
  input: DfsPlayerInput
  strength: StrengthComputation
  confidence: DfsConfidence
}

/**
 * Compute every player's DFS Value and the ranked boards for a field.
 *
 * Pure and total: an empty field yields empty boards; a player with no salary or
 * no scored family is returned as `status: "unavailable"` with a machine-readable
 * reason rather than a fabricated score. When the Tournament Context ceiling is
 * `unavailable`, no player can be scored (the model must not run without a
 * resolved event).
 */
export function buildDfsValueField(input: DfsValueFieldInput): DfsValueField {
  const { players, ceiling } = input
  const contextUsable = ceiling !== "unavailable"

  // Pass 1: strength + pre-ceiling confidence for everyone.
  const interim: Interim[] = players.map((p) => {
    const strength = computeStrength(p)
    return { input: p, strength, confidence: capConfidence(strength.rawConfidence, ceiling) }
  })

  // Field reference distributions (only players that carry the value each ranks).
  const strengthsAsc = interim
    .map((i) => i.strength.strength)
    .filter((s): s is number => s != null)
    .sort((a, b) => a - b)
  const pricedSalaries = interim
    .map((i) => i.input.salary)
    .filter((s): s is number => s != null && Number.isFinite(s))
    .sort((a, b) => a - b)

  const salaryTierOf = makeSalaryTierClassifier(pricedSalaries)

  // Pass 2: value, tier, drivers, risks.
  const results: DfsValueResult[] = interim.map((i) => {
    const { input: p, strength: s } = i
    const salary = p.salary != null && Number.isFinite(p.salary) ? p.salary : null

    const salaryEfficiency =
      salary != null && pricedSalaries.length > 0
        ? Math.round(100 * (1 - percentileOf(salary, pricedSalaries)))
        : null
    const salaryTier = salary != null ? salaryTierOf(salary) : null

    const unavailableReason = !contextUsable
      ? "no-context"
      : salary == null
        ? "no-salary"
        : s.strength == null
          ? "no-signals"
          : null

    if (unavailableReason) {
      return unavailableResult(p, s, salary, salaryTier, salaryEfficiency, unavailableReason)
    }

    const strengthPct = percentileOf(s.strength as number, strengthsAsc)
    const salaryPct = salary != null && pricedSalaries.length > 0 ? percentileOf(salary, pricedSalaries) : 0.5
    const valueEdge = strengthPct - salaryPct
    const score = clamp(Math.round(50 + 50 * valueEdge), 0, 100)

    const confidence = i.confidence
    const tier = capTier(tierFromScore(score), confidence)
    const drivers = buildDrivers(s.contributions, salaryEfficiency)
    const risks = buildRisks(s.contributions, salaryEfficiency, confidence, s.missing)
    const factors = buildFactors(s.contributions, salaryTier)

    return {
      playerId: p.playerId,
      displayName: p.displayName,
      status: "available",
      score,
      tier,
      confidence,
      strength: s.strength,
      salary,
      salaryTier,
      salaryEfficiency,
      contributions: s.contributions,
      drivers,
      risks,
      missing: s.missing,
      coverage: s.coverage,
      factors,
      summary: summarize(score, tier, confidence, drivers, risks),
    }
  })

  // Best value first for the canonical ordering.
  const ranked = [...results].sort(byValueDesc)
  const rated = ranked.filter((r) => r.status === "available")

  return {
    players: ranked,
    boards: buildDfsBoards(rated),
    ratedPlayers: rated.length,
    pricedPlayers: pricedSalaries.length,
    totalPlayers: players.length,
    averageConfidence: modalConfidence(rated),
    ceiling,
  }
}

function unavailableResult(
  p: DfsPlayerInput,
  s: StrengthComputation,
  salary: number | null,
  salaryTier: DfsSalaryTier | null,
  salaryEfficiency: number | null,
  reason: "no-salary" | "no-signals" | "no-context",
): DfsValueResult {
  const detail =
    reason === "no-context"
      ? "No resolved tournament context, so DFS value cannot be estimated."
      : reason === "no-salary"
        ? "No DraftKings salary is available for this player, so value per dollar cannot be estimated."
        : "No verified signal family is available yet, so projected quality cannot be estimated."
  return {
    playerId: p.playerId,
    displayName: p.displayName,
    status: "unavailable",
    score: null,
    tier: null,
    confidence: "none",
    strength: s.strength,
    salary,
    salaryTier,
    salaryEfficiency,
    contributions: s.contributions,
    drivers: [],
    risks: [{ key: "confidence", label: "Coverage", detail: detail }],
    missing: s.missing,
    coverage: s.coverage,
    factors: buildFactors(s.contributions, salaryTier),
    summary: detail,
  }
}

function summarize(
  score: number,
  tier: DfsValueTier,
  confidence: DfsConfidence,
  drivers: readonly DfsDriver[],
  risks: readonly DfsRisk[],
): string {
  const lead = `${TIER_LABEL[tier]} value (${score}/100, ${confidence} confidence)`
  const driver = drivers[0] ? ` driven by ${drivers[0].label.toLowerCase()} (${drivers[0].detail.toLowerCase()})` : ""
  const risk = risks[0] ? `; watch ${risks[0].label.toLowerCase()}: ${risks[0].detail.toLowerCase()}` : ""
  return `${lead}${driver}${risk}.`
}

function byValueDesc(a: DfsValueResult, b: DfsValueResult): number {
  // Available first, then by score, then by strength as a tiebreak.
  if (a.status !== b.status) return a.status === "available" ? -1 : 1
  const as = a.score ?? -1
  const bs = b.score ?? -1
  if (bs !== as) return bs - as
  return (b.strength ?? -1) - (a.strength ?? -1)
}

function modalConfidence(rated: readonly DfsValueResult[]): DfsConfidence {
  if (rated.length === 0) return "none"
  const counts: Record<DfsConfidence, number> = { none: 0, low: 0, medium: 0, high: 0 }
  for (const r of rated) counts[r.confidence] += 1
  return (Object.keys(counts) as DfsConfidence[]).reduce((best, k) => (counts[k] > counts[best] ? k : best), "none")
}

/**
 * Classify a salary into high / mid / value thirds of the field's priced
 * distribution (by tercile boundaries). Fewer than three priced players collapse
 * gracefully (everyone `mid`) rather than inventing tiers.
 */
function makeSalaryTierClassifier(sortedAsc: readonly number[]): (salary: number) => DfsSalaryTier {
  if (sortedAsc.length < 3) return () => "mid"
  const lower = sortedAsc[Math.floor(sortedAsc.length / 3)]
  const upper = sortedAsc[Math.floor((2 * sortedAsc.length) / 3)]
  return (salary: number): DfsSalaryTier => {
    if (salary >= upper) return "high"
    if (salary >= lower) return "mid"
    return "value"
  }
}
