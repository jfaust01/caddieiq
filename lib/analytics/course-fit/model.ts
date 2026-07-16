/**
 * Course Fit Model — pure scoring engine.
 *
 * `computeCourseFit` matches a player's skill profile against a course's
 * verified demand profile and returns an explainable, confidence-graded fit.
 * The field helpers rank a whole tournament field into the four hub lists.
 *
 * The math, in one line: fit is the player's skills averaged with weights equal
 * to how much THIS course demands each skill — so a bomber rates highly at a
 * driving course and lower at a putting contest. Only signals where both the
 * course demand and the player's skill are verified take part; everything else
 * is reported as unavailable with a reason. See docs/COURSE_FIT_MODEL.md.
 */

import { getCharacteristic } from "@/lib/domain/course"
import type { CourseCharacteristicKey, CourseProfile } from "@/lib/domain/course"

import type {
  CourseFitInput,
  CourseFitResult,
  FieldFitBoard,
  FieldFitEntry,
  FitBand,
  FitConfidence,
  FitDriver,
  FitSignal,
  FitSkillKey,
  PlayerSkillProfile,
} from "./types"
import { FIT_SKILL_KEYS } from "./types"

/** Neutral skill baseline (0–100). A signal only moves the score off this. */
const NEUTRAL_SKILL = 50

/** Static per-signal metadata: label + which course demand it maps to. */
const SIGNAL_META: Readonly<
  Record<FitSkillKey, { readonly label: string; readonly demandKey: CourseCharacteristicKey }>
> = {
  driving: { label: "Driving", demandKey: "drivingImportance" },
  approach: { label: "Approach", demandKey: "approachImportance" },
  shortGame: { label: "Short game", demandKey: "shortGameImportance" },
  putting: { label: "Putting", demandKey: "puttingImportance" },
  scrambling: { label: "Scrambling", demandKey: "aroundGreenDifficulty" },
}

/** Read a course's verified demand weight (0–1) for a skill, or `null`. */
function readDemand(profile: CourseProfile | null, demandKey: CourseCharacteristicKey): number | null {
  if (!profile) return null
  const characteristic = getCharacteristic(profile, demandKey)
  if (!characteristic) return null
  const signal = characteristic.signal
  if (signal.status !== "verified" || signal.kind !== "rating") return null
  // Ratings carry the verified source magnitude (0–1 importance) in `raw`.
  return clamp01(signal.raw)
}

/** Clamp to [0,1]; returns `null` for non-finite input so gaps stay unknown. */
function clamp01(n: number): number | null {
  if (!Number.isFinite(n)) return null
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

/** Map a 0–100 fit score to a qualitative band. */
export function fitBand(score: number): FitBand {
  if (score >= 70) return "STRONG"
  if (score >= 57) return "ABOVE_AVERAGE"
  if (score >= 43) return "AVERAGE"
  if (score >= 30) return "BELOW_AVERAGE"
  return "WEAK"
}

/** Human label for a band. */
export function fitBandLabel(band: FitBand): string {
  switch (band) {
    case "STRONG":
      return "Strong fit"
    case "ABOVE_AVERAGE":
      return "Above-average fit"
    case "AVERAGE":
      return "Average fit"
    case "BELOW_AVERAGE":
      return "Below-average fit"
    case "WEAK":
      return "Weak fit"
  }
}

/**
 * Grade confidence from how many of the five signals were scored. Confidence
 * can never exceed what coverage supports: 5 ⇒ high, 3–4 ⇒ medium, 1–2 ⇒ low,
 * 0 ⇒ none (and the score is `null`).
 */
function gradeConfidence(scoredCount: number): FitConfidence {
  if (scoredCount <= 0) return "none"
  if (scoredCount <= 2) return "low"
  if (scoredCount <= 4) return "medium"
  return "high"
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Compute a single player-vs-course fit.
 *
 * Pure and total: always returns a fully-shaped result, using `null`/`"none"`
 * and an explanatory summary when inputs are missing — never throwing and never
 * inventing a value.
 */
export function computeCourseFit(input: CourseFitInput): CourseFitResult {
  const { playerId, courseProfile, skills } = input
  const courseId = courseProfile?.courseId ?? null

  // 1) Build a raw reading for every signal: demand (0–1) + skill (0–100).
  const raw = FIT_SKILL_KEYS.map((key) => {
    const meta = SIGNAL_META[key]
    const demand = readDemand(courseProfile, meta.demandKey)
    const skill = normalizeSkill(skills[key])
    const scored = demand !== null && skill !== null
    return { key, label: meta.label, demand, skill, scored }
  })

  const scored = raw.filter((r) => r.scored)
  const totalRawWeight = scored.reduce((sum, r) => sum + (r.demand as number), 0)

  // 2) Normalize weights across scored signals. If every scored demand is 0
  //    (course asks nothing of these skills), fall back to equal weights so a
  //    verified-but-flat course still yields an honest average rather than 0/0.
  const useEqualWeights = totalRawWeight <= 0
  const weightOf = (demand: number): number => {
    if (scored.length === 0) return 0
    return useEqualWeights ? 1 / scored.length : demand / totalRawWeight
  }

  // 3) Assemble the per-signal breakdown.
  const signals: FitSignal[] = raw.map((r) => {
    if (!r.scored) {
      const reason =
        r.demand === null && r.skill === null
          ? "both-missing"
          : r.demand === null
            ? "course-demand-missing"
            : "player-skill-missing"
      return {
        key: r.key,
        label: r.label,
        status: "unavailable",
        demand: r.demand,
        skill: r.skill,
        weight: 0,
        contribution: null,
        reason,
        rationale: unavailableRationale(r.label, reason),
      }
    }
    const demand = r.demand as number
    const skill = r.skill as number
    const weight = weightOf(demand)
    const contribution = weight * skill
    return {
      key: r.key,
      label: r.label,
      status: "scored",
      demand,
      skill,
      weight,
      contribution,
      reason: null,
      rationale: scoredRationale(r.label, demand, skill),
    }
  })

  const missing = signals.filter((s) => s.status === "unavailable")
  const coverage = { scored: scored.length, total: FIT_SKILL_KEYS.length }
  const confidence = gradeConfidence(scored.length)

  // 4) Composite score — sum of contributions, or null when nothing scored.
  const score =
    scored.length === 0
      ? null
      : round(
          signals.reduce((sum, s) => sum + (s.contribution ?? 0), 0),
        )
  const band = score === null ? null : fitBand(score)

  // 5) Explainability — rank scored signals by weighted deviation from neutral.
  const drivers: FitDriver[] = signals
    .filter((s) => s.status === "scored")
    .map((s) => {
      const effect = round(s.weight * ((s.skill as number) - NEUTRAL_SKILL))
      return {
        key: s.key,
        label: s.label,
        effect,
        direction: effect >= 0 ? ("positive" as const) : ("negative" as const),
        rationale: driverRationale(s.label, effect, s.demand as number),
      }
    })
    .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))

  return {
    playerId,
    courseId,
    score,
    band,
    confidence,
    signals,
    drivers,
    missing,
    coverage,
    summary: summarize({ score, band, drivers, coverage }),
  }
}

/** Normalize a player skill reading to a clamped 0–100 value, or `null`. */
function normalizeSkill(rating: number | null): number | null {
  if (rating === null || !Number.isFinite(rating)) return null
  if (rating < 0) return 0
  if (rating > 100) return 100
  return rating
}

function scoredRationale(label: string, demand: number, skill: number): string {
  const demandWord = demand >= 0.67 ? "heavily rewards" : demand >= 0.34 ? "moderately rewards" : "lightly weights"
  const skillWord = skill >= 60 ? "a strength" : skill >= 40 ? "around average" : "a relative weakness"
  return `${label}: the course ${demandWord} it, and it is ${skillWord} for this player.`
}

function unavailableRationale(label: string, reason: string): string {
  switch (reason) {
    case "course-demand-missing":
      return `${label}: not scored — this course's ${label.toLowerCase()} demand hasn't been ingested yet.`
    case "player-skill-missing":
      return `${label}: not scored — this player's ${label.toLowerCase()} skill data isn't available yet.`
    default:
      return `${label}: not scored — neither the course demand nor the player's skill is available yet.`
  }
}

function driverRationale(label: string, effect: number, demand: number): string {
  const dir = effect >= 0 ? "helps" : "hurts"
  const mag = Math.abs(effect) >= 6 ? "notably" : "slightly"
  return `${label} ${mag} ${dir} the fit (demand ${Math.round(demand * 100)}%).`
}

function summarize(args: {
  score: number | null
  band: FitBand | null
  drivers: readonly FitDriver[]
  coverage: { scored: number; total: number }
}): string {
  const { score, band, drivers, coverage } = args
  const missingCount = coverage.total - coverage.scored
  if (score === null || band === null) {
    return `Course fit can't be computed yet — all ${coverage.total} skill signals are unavailable. It will populate automatically as course characteristics and player skill data are ingested.`
  }
  const top = drivers.slice(0, 2).map((d) => d.label.toLowerCase())
  const driverText = top.length > 0 ? ` Driven mainly by ${top.join(" and ")}.` : ""
  const gapText =
    missingCount > 0
      ? ` ${missingCount} of ${coverage.total} signals are still unavailable, which caps confidence.`
      : ` All ${coverage.total} signals are verified.`
  return `${fitBandLabel(band)} — ${score}/100.${driverText}${gapText}`
}

/* ------------------------------------------------------------------ */
/* Field-level board                                                  */
/* ------------------------------------------------------------------ */

/**
 * Rank a scored field into the four tournament-hub lists.
 *
 * - `topFits` / `fades`: players with a computable fit, best / worst first.
 *   (Empty until skill + demand data exist — never padded with guesses.)
 * - `trendingUp`: players ordered by verified ranking momentum — an honest
 *   form-trajectory read, explicitly NOT a course-fit change.
 * - `mostUncertain`: players whose fit is least certain (fewest scored signals,
 *   lowest confidence) first, so the gaps are surfaced rather than hidden.
 */
export function buildFieldFitBoard(entries: readonly FieldFitEntry[], limit = 5): FieldFitBoard {
  const scoredEntries = entries.filter((e) => e.result.score !== null)

  const byScoreDesc = [...scoredEntries].sort(
    (a, b) => (b.result.score as number) - (a.result.score as number),
  )
  const byScoreAsc = [...scoredEntries].sort(
    (a, b) => (a.result.score as number) - (b.result.score as number),
  )
  const byMomentumDesc = entries
    .filter((e) => e.momentum !== null)
    .sort((a, b) => (b.momentum as number) - (a.momentum as number))

  const confidenceRank: Record<FitConfidence, number> = { none: 0, low: 1, medium: 2, high: 3 }
  const byUncertaintyAsc = [...entries].sort((a, b) => {
    const byConf = confidenceRank[a.result.confidence] - confidenceRank[b.result.confidence]
    if (byConf !== 0) return byConf
    return a.result.coverage.scored - b.result.coverage.scored
  })

  return {
    topFits: byScoreDesc.slice(0, limit),
    fades: byScoreAsc.slice(0, limit),
    trendingUp: byMomentumDesc.slice(0, limit),
    mostUncertain: byUncertaintyAsc.slice(0, limit),
    scoredPlayers: scoredEntries.length,
    totalPlayers: entries.length,
  }
}

/**
 * Build an all-`null` skill profile. The honest default today, since the
 * platform ingests no per-skill player data yet. Kept as a single source so
 * services never hand-roll (and accidentally fabricate) skill inputs.
 */
export function emptyPlayerSkillProfile(): PlayerSkillProfile {
  return { driving: null, approach: null, shortGame: null, putting: null, scrambling: null }
}
