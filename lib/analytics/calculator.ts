/**
 * AnalyticsCalculator — the pure computation core of the Analytics Engine.
 *
 * Every function here is a pure transform: given a player's season-stat sample
 * plus the population it is normalized against, it returns scores. There is no
 * database, provider, network, or I/O access — which keeps the analytics
 * deterministic, trivially unit-testable, and safe to run in any context.
 *
 * The engine turns raw season aggregates into comparable 0–100 scores. Two
 * normalization strategies are used, both grounded only in ingested data:
 *
 *  - Field-relative (percentile): where "good" only means "good vs. the field"
 *    (production rate, total output, activity, ranking standing), a value is
 *    scored by its percentile within the season population.
 *  - Intrinsic (ratio): where the data expresses reliability directly
 *    (points gained vs. lost), the score is the ratio itself.
 *
 * Scores are emitted ONLY when their inputs exist; a missing input yields a
 * `null` value with `confidence: "none"` so the UI degrades honestly instead of
 * fabricating a number. World-ranking-derived signals are capped at `medium`
 * confidence because the provider tier is known to obfuscate rank precision.
 */

import type {
  AnalyticsBand,
  AnalyticsConfidence,
  AnalyticsMetricKey,
  AnalyticsScore,
  PlayerAnalytics,
} from "./types"

/**
 * One player's season aggregates — the raw input the calculator consumes. This
 * mirrors the persisted `player_season_statistics` columns the engine reads;
 * every metric is nullable because the source may not report it.
 */
export interface SeasonStatSample {
  playerId: string
  season: number
  worldRanking: number | null
  worldRankingLastWeek: number | null
  events: number | null
  averagePoints: number | null
  totalPoints: number | null
  pointsGained: number | null
  pointsLost: number | null
}

/**
 * Precomputed, sorted-ascending distributions for the population an individual
 * is scored against. Built once per computation via {@link buildPopulation} and
 * reused for every player, so scoring a whole field stays O(n log n) overall.
 */
export interface PopulationContext {
  season: number | null
  size: number
  averagePoints: number[]
  totalPoints: number[]
  events: number[]
  worldRanking: number[]
}

/** Human labels for each analytic. */
const METRIC_LABELS: Record<AnalyticsMetricKey, string> = {
  recentForm: "Recent Form",
  consistency: "Consistency",
  activity: "Activity",
  fantasyProduction: "Fantasy Production",
  seasonPerformance: "Season Performance",
}

/** One-line descriptions of what each analytic measures and its basis. */
const METRIC_DESCRIPTIONS: Record<AnalyticsMetricKey, string> = {
  recentForm:
    "Current world-ranking standing blended with week-over-week movement.",
  consistency:
    "Share of fantasy activity that was positive production (points gained vs. lost).",
  activity: "How much the player competed this season, relative to the field.",
  fantasyProduction: "Average fantasy points per event, relative to the field.",
  seasonPerformance:
    "Total fantasy output blended with world ranking — overall season standing.",
}

/** Display order for the analytics grid. */
export const METRIC_ORDER: readonly AnalyticsMetricKey[] = [
  "seasonPerformance",
  "recentForm",
  "fantasyProduction",
  "consistency",
  "activity",
]

/** Clamp a number into the inclusive 0–100 range and round to one decimal. */
function clampScore(value: number): number {
  const bounded = Math.min(100, Math.max(0, value))
  return Math.round(bounded * 10) / 10
}

/** Is a metric present and finite (i.e. actually reported)? */
function has(value: number | null): value is number {
  return value !== null && Number.isFinite(value)
}

/**
 * Percentile of `value` within a sorted-ascending distribution, expressed
 * 0–100. Uses the midpoint convention for ties (count below + half of equal),
 * so identical values share a fair rank. When `higherIsBetter` is false (e.g.
 * world ranking, where #1 is best) the percentile is inverted.
 *
 * A degenerate population (0 or 1 members) can't discriminate, so it returns a
 * neutral 50 rather than a misleading extreme.
 */
export function percentile(
  sortedAsc: number[],
  value: number,
  options: { higherIsBetter?: boolean } = {},
): number {
  const { higherIsBetter = true } = options
  const n = sortedAsc.length
  if (n <= 1) return 50

  let below = 0
  let equal = 0
  for (const entry of sortedAsc) {
    if (entry < value) below += 1
    else if (entry === value) equal += 1
  }
  const rank = ((below + equal / 2) / n) * 100
  return higherIsBetter ? rank : 100 - rank
}

/** Map a 0–100 score to a qualitative band. */
export function toBand(value: number): AnalyticsBand {
  if (value >= 80) return "ELITE"
  if (value >= 65) return "STRONG"
  if (value >= 50) return "SOLID"
  if (value >= 35) return "AVERAGE"
  return "DEVELOPING"
}

/** Build a reusable {@link PopulationContext} from the season's samples. */
export function buildPopulation(
  samples: readonly SeasonStatSample[],
  season: number | null,
): PopulationContext {
  const collect = (pick: (s: SeasonStatSample) => number | null): number[] =>
    samples
      .map(pick)
      .filter(has)
      .sort((a, b) => a - b)

  return {
    season,
    size: samples.length,
    averagePoints: collect((s) => s.averagePoints),
    totalPoints: collect((s) => s.totalPoints),
    events: collect((s) => s.events),
    worldRanking: collect((s) => s.worldRanking),
  }
}

function score(
  key: AnalyticsMetricKey,
  value: number | null,
  confidence: AnalyticsConfidence,
): AnalyticsScore {
  return {
    key,
    label: METRIC_LABELS[key],
    description: METRIC_DESCRIPTIONS[key],
    value: value === null ? null : clampScore(value),
    band: value === null ? null : toBand(clampScore(value)),
    confidence: value === null ? "none" : confidence,
  }
}

/**
 * Recent Form — trajectory. Anchored on the player's current world-ranking
 * percentile and nudged by the week-over-week movement the provider reports
 * (a rank that improved lifts the score, a rank that slipped lowers it).
 * Ranking is obfuscated upstream, so confidence never exceeds `medium`.
 */
function recentForm(sample: SeasonStatSample, pop: PopulationContext): AnalyticsScore {
  if (!has(sample.worldRanking)) return score("recentForm", null, "none")

  const standing = percentile(pop.worldRanking, sample.worldRanking, {
    higherIsBetter: false,
  })

  if (!has(sample.worldRankingLastWeek)) {
    // Only a current standing is available — no movement signal.
    return score("recentForm", standing, "low")
  }

  // A LOWER ranking number is better, so improvement = lastWeek - current.
  const movement = sample.worldRankingLastWeek - sample.worldRanking
  // Map movement into a bounded ±25-point adjustment around the standing.
  const movementAdjustment = Math.max(-25, Math.min(25, movement * 2.5))
  return score("recentForm", standing + movementAdjustment, "medium")
}

/**
 * Consistency — reliability. The fraction of a player's fantasy activity that
 * was positive production. Intrinsic (not field-relative): a player who mostly
 * gains points is more dependable than one whose output swings.
 */
function consistency(sample: SeasonStatSample): AnalyticsScore {
  if (!has(sample.pointsGained) || !has(sample.pointsLost)) {
    return score("consistency", null, "none")
  }
  const activity = sample.pointsGained + Math.abs(sample.pointsLost)
  if (activity <= 0) return score("consistency", null, "none")
  const ratio = sample.pointsGained / activity
  return score("consistency", ratio * 100, "high")
}

/**
 * Activity — durability/engagement. Percentile of events played within the
 * field: a fuller schedule signals a healthier, more active competitor.
 */
function activity(sample: SeasonStatSample, pop: PopulationContext): AnalyticsScore {
  if (!has(sample.events)) return score("activity", null, "none")
  return score("activity", percentile(pop.events, sample.events), "high")
}

/**
 * Fantasy Production — scoring rate. Percentile of average fantasy points per
 * event within the field, i.e. how productive the player is when they tee it up.
 */
function fantasyProduction(
  sample: SeasonStatSample,
  pop: PopulationContext,
): AnalyticsScore {
  if (!has(sample.averagePoints)) return score("fantasyProduction", null, "none")
  return score(
    "fantasyProduction",
    percentile(pop.averagePoints, sample.averagePoints),
    "high",
  )
}

/**
 * Season Performance — overall standing. Total fantasy output (volume × quality)
 * blended with world-ranking standing when available. Falls back to whichever
 * signal is present; confidence is `medium` once ranking is in the mix.
 */
function seasonPerformance(
  sample: SeasonStatSample,
  pop: PopulationContext,
): AnalyticsScore {
  const outputPct = has(sample.totalPoints)
    ? percentile(pop.totalPoints, sample.totalPoints)
    : null
  const rankPct = has(sample.worldRanking)
    ? percentile(pop.worldRanking, sample.worldRanking, { higherIsBetter: false })
    : null

  if (outputPct !== null && rankPct !== null) {
    return score("seasonPerformance", outputPct * 0.6 + rankPct * 0.4, "medium")
  }
  if (outputPct !== null) return score("seasonPerformance", outputPct, "high")
  if (rankPct !== null) return score("seasonPerformance", rankPct, "medium")
  return score("seasonPerformance", null, "none")
}

/** Mean of the available (non-null) score values, or `null` when none exist. */
export function meanOfScores(values: readonly (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null)
  if (present.length === 0) return null
  const total = present.reduce((sum, v) => sum + v, 0)
  return clampScore(total / present.length)
}

/**
 * Compute the full analytics profile for one player against a population.
 * Returns an empty profile (all scores present but null, `isEmpty: true`) when
 * the player has no sample in the season, so callers get a stable shape.
 */
export function computePlayerAnalytics(
  sample: SeasonStatSample | null,
  pop: PopulationContext,
): PlayerAnalytics {
  if (!sample) {
    const emptyScores = METRIC_ORDER.map((key) => score(key, null, "none"))
    return {
      playerId: "",
      season: pop.season,
      sampleSize: pop.size,
      overallRating: null,
      overallBand: null,
      scores: emptyScores,
      isEmpty: true,
    }
  }

  const computed: Record<AnalyticsMetricKey, AnalyticsScore> = {
    recentForm: recentForm(sample, pop),
    consistency: consistency(sample),
    activity: activity(sample, pop),
    fantasyProduction: fantasyProduction(sample, pop),
    seasonPerformance: seasonPerformance(sample, pop),
  }

  const scores = METRIC_ORDER.map((key) => computed[key])
  const overallRating = meanOfScores(scores.map((s) => s.value))

  return {
    playerId: sample.playerId,
    season: sample.season,
    sampleSize: pop.size,
    overallRating,
    overallBand: overallRating === null ? null : toBand(overallRating),
    scores,
    isEmpty: scores.every((s) => s.value === null),
  }
}
