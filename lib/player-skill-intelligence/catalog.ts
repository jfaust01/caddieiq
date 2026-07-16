/**
 * Player Skill Intelligence — skill catalog + raw aggregation (pure).
 *
 * The single source of truth for WHAT the fifteen skills are, how each is
 * derived from ingested round statistics, and how a set of round samples
 * aggregates into one raw value per skill. Keeping this in one place is what
 * guarantees "no duplicated skill logic exists anywhere in the application":
 * every consumer reads the skills produced here, never a hand-rolled stat.
 */

import type {
  PlayerSkillSamples,
  SkillFamily,
  SkillKey,
  SkillRoundSample,
  SkillUnit,
} from "./types"

/** Static, display-ordered metadata for one skill. */
export interface SkillDefinition {
  key: SkillKey
  label: string
  family: SkillFamily
  unit: SkillUnit
  higherIsBetter: boolean
  /**
   * Whether the platform has ANY provider field that can source this skill.
   * `par*Scoring` are `false` — round statistics carry no per-par breakdown —
   * so they are always emitted UNKNOWN with a `no-provider-field` gap and are
   * excluded from the confidence coverage denominator.
   */
  sourceable: boolean
  /** Short AI-label noun, e.g. "Iron Player", "Putter", "Driver Accuracy". */
  noun: string
}

/** The fifteen tracked skills in canonical display order. */
export const SKILL_DEFINITIONS: readonly SkillDefinition[] = [
  { key: "sgOffTheTee", label: "SG: Off the Tee", family: "offTheTee", unit: "strokes", higherIsBetter: true, sourceable: true, noun: "Off-the-Tee" },
  { key: "sgApproach", label: "SG: Approach", family: "approach", unit: "strokes", higherIsBetter: true, sourceable: true, noun: "Iron Player" },
  { key: "sgAroundGreen", label: "SG: Around the Green", family: "aroundGreen", unit: "strokes", higherIsBetter: true, sourceable: true, noun: "Around-the-Green" },
  { key: "sgPutting", label: "SG: Putting", family: "putting", unit: "strokes", higherIsBetter: true, sourceable: true, noun: "Putter" },
  { key: "sgTeeToGreen", label: "SG: Tee to Green", family: "teeToGreen", unit: "strokes", higherIsBetter: true, sourceable: true, noun: "Ball Striker" },
  { key: "drivingAccuracy", label: "Driving Accuracy", family: "offTheTee", unit: "percent", higherIsBetter: true, sourceable: true, noun: "Driver Accuracy" },
  { key: "drivingDistance", label: "Driving Distance", family: "offTheTee", unit: "yards", higherIsBetter: true, sourceable: true, noun: "Driver" },
  { key: "greensInRegulation", label: "Greens in Regulation", family: "approach", unit: "percent", higherIsBetter: true, sourceable: true, noun: "Approach Play" },
  { key: "scrambling", label: "Scrambling", family: "aroundGreen", unit: "percent", higherIsBetter: true, sourceable: true, noun: "Scrambler" },
  { key: "sandSave", label: "Sand Save %", family: "aroundGreen", unit: "percent", higherIsBetter: true, sourceable: true, noun: "Bunker Player" },
  { key: "birdiePercentage", label: "Birdie %", family: "scoring", unit: "percent", higherIsBetter: true, sourceable: true, noun: "Birdie Maker" },
  { key: "bogeyAvoidance", label: "Bogey Avoidance", family: "scoring", unit: "percent", higherIsBetter: true, sourceable: true, noun: "Bogey Avoider" },
  { key: "par3Scoring", label: "Par 3 Scoring", family: "scoring", unit: "strokes", higherIsBetter: false, sourceable: false, noun: "Par-3 Scorer" },
  { key: "par4Scoring", label: "Par 4 Scoring", family: "scoring", unit: "strokes", higherIsBetter: false, sourceable: false, noun: "Par-4 Scorer" },
  { key: "par5Scoring", label: "Par 5 Scoring", family: "scoring", unit: "strokes", higherIsBetter: false, sourceable: false, noun: "Par-5 Scorer" },
]

/** Fast lookup by key. */
export const SKILL_BY_KEY: Readonly<Record<SkillKey, SkillDefinition>> = Object.freeze(
  Object.fromEntries(SKILL_DEFINITIONS.map((d) => [d.key, d])) as Record<SkillKey, SkillDefinition>,
)

/** Ordered skill keys. */
export const SKILL_KEYS: readonly SkillKey[] = SKILL_DEFINITIONS.map((d) => d.key)

/** Keys that can be sourced today (drives the coverage denominator). */
export const SOURCEABLE_SKILL_KEYS: readonly SkillKey[] = SKILL_DEFINITIONS.filter(
  (d) => d.sourceable,
).map((d) => d.key)

/* ------------------------------------------------------------------ */
/* Raw aggregation                                                    */
/* ------------------------------------------------------------------ */

/** Sum + count of finite numbers, for means. */
interface Accumulator {
  sum: number
  count: number
}

function mean(values: Array<number | null | undefined>): number | null {
  let sum = 0
  let count = 0
  for (const v of values) {
    if (v != null && Number.isFinite(v)) {
      sum += v
      count += 1
    }
  }
  return count === 0 ? null : sum / count
}

function ratioPercent(numerator: Accumulator, denominator: Accumulator): number | null {
  if (denominator.count === 0 || denominator.sum <= 0) return null
  return (numerator.sum / denominator.sum) * 100
}

/** Total holes represented by a round's score buckets, or 0 when absent. */
function holesOf(r: SkillRoundSample): number {
  const parts = [r.eagles, r.birdies, r.pars, r.bogeys, r.doubleBogeys]
  return parts.reduce<number>((acc, v) => acc + (v != null && Number.isFinite(v) ? v : 0), 0)
}

/**
 * Aggregate a set of round samples into one raw value per skill. Every skill is
 * `null` unless its inputs are present in at least one round. Percentages that
 * derive from made/possible are pooled (sum of made ÷ sum of possible), which
 * is more faithful than averaging per-round percentages of differing holes.
 *
 * Returns per-skill raw values AND per-skill contributing round counts, so the
 * profile builder can attach an honest sample size to each signal.
 */
export function aggregateRawSkills(rounds: readonly SkillRoundSample[]): {
  values: Partial<Record<SkillKey, number>>
  counts: Partial<Record<SkillKey, number>>
} {
  const values: Partial<Record<SkillKey, number>> = {}
  const counts: Partial<Record<SkillKey, number>> = {}

  const countFinite = (arr: Array<number | null | undefined>) =>
    arr.reduce<number>((acc, v) => acc + (v != null && Number.isFinite(v) ? 1 : 0), 0)

  const setMean = (key: SkillKey, arr: Array<number | null | undefined>) => {
    const m = mean(arr)
    if (m !== null) {
      values[key] = m
      counts[key] = countFinite(arr)
    }
  }

  setMean("sgOffTheTee", rounds.map((r) => r.sgOffTheTee))
  setMean("sgApproach", rounds.map((r) => r.sgApproach))
  setMean("sgAroundGreen", rounds.map((r) => r.sgAroundGreen))
  setMean("sgPutting", rounds.map((r) => r.sgPutting))
  setMean("drivingDistance", rounds.map((r) => r.drivingDistance))

  // Tee-to-green = off-the-tee + approach + around-the-green, summed PER round
  // (so it only counts rounds where all three components exist), then averaged.
  const t2gPerRound = rounds.map((r) => {
    if (r.sgOffTheTee == null || r.sgApproach == null || r.sgAroundGreen == null) return null
    return r.sgOffTheTee + r.sgApproach + r.sgAroundGreen
  })
  setMean("sgTeeToGreen", t2gPerRound)

  // Driving accuracy: prefer pooled fairways hit ÷ possible; fall back to the
  // provider's per-round percentage when the made/possible pair is absent.
  const fwHit = accumulate(rounds.map((r) => r.fairwaysHit))
  const fwPoss = accumulate(rounds.map((r) => r.fairwaysPossible))
  const pooledAccuracy = ratioPercent(fwHit, fwPoss)
  if (pooledAccuracy !== null) {
    values.drivingAccuracy = pooledAccuracy
    counts.drivingAccuracy = fwPoss.count
  } else {
    setMean("drivingAccuracy", rounds.map((r) => r.drivingAccuracy))
  }

  // GIR: pooled greens hit ÷ possible.
  const girHit = accumulate(rounds.map((r) => r.greensInRegulation))
  const girPoss = accumulate(rounds.map((r) => r.greensPossible))
  const gir = ratioPercent(girHit, girPoss)
  if (gir !== null) {
    values.greensInRegulation = gir
    counts.greensInRegulation = girPoss.count
  }

  setMean("scrambling", rounds.map((r) => r.scramblingPercentage))
  setMean("sandSave", rounds.map((r) => r.sandSavePercentage))

  // Birdie % and bogey avoidance are pooled over total holes played.
  const holes = accumulate(rounds.map((r) => holesOf(r) || null))
  const birdies = accumulate(rounds.map((r) => r.birdies))
  const eagles = accumulate(rounds.map((r) => r.eagles))
  const bogeys = accumulate(rounds.map((r) => r.bogeys))
  const doubles = accumulate(rounds.map((r) => r.doubleBogeys))
  if (holes.sum > 0) {
    const roundsWithHoles = rounds.filter((r) => holesOf(r) > 0).length
    // Birdie-or-better rate.
    values.birdiePercentage = ((birdies.sum + eagles.sum) / holes.sum) * 100
    counts.birdiePercentage = roundsWithHoles
    // Bogey avoidance = share of holes that were NOT a bogey or worse.
    values.bogeyAvoidance = (1 - (bogeys.sum + doubles.sum) / holes.sum) * 100
    counts.bogeyAvoidance = roundsWithHoles
  }

  // par3/4/5 scoring: no provider field — deliberately never populated.

  return { values, counts }
}

function accumulate(arr: Array<number | null | undefined>): Accumulator {
  let sum = 0
  let count = 0
  for (const v of arr) {
    if (v != null && Number.isFinite(v)) {
      sum += v
      count += 1
    }
  }
  return { sum, count }
}

/** The most recent `playedAt` across samples, or `null`. */
export function latestPlayedAt(samples: PlayerSkillSamples): string | null {
  let latest: number | null = null
  for (const r of samples.rounds) {
    if (!r.playedAt) continue
    const t = Date.parse(r.playedAt)
    if (Number.isFinite(t) && (latest === null || t > latest)) latest = t
  }
  return latest === null ? null : new Date(latest).toISOString()
}
