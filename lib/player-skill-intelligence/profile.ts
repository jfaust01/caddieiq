/**
 * Player Skill Intelligence — profile assembler + leaderboards (pure).
 *
 * The heart of the engine. `buildPlayerSkillProfile` turns a player's raw round
 * samples + a field population into a confidence-graded {@link PlayerSkillProfile}.
 * Pure and deterministic (inject `now` for tests); it never fetches, persists,
 * or fabricates — absent data surfaces as `null` ratings, `gaps`, and lower
 * confidence.
 */

import {
  aggregateRawSkills,
  latestPlayedAt,
  SKILL_BY_KEY,
  SKILL_DEFINITIONS,
  SOURCEABLE_SKILL_KEYS,
} from "./catalog"
import {
  gradeProfileConfidence,
  gradeSkillConfidence,
  percentileOf,
  scoreToBand,
  skillExplanationLabel,
  trendDirection,
} from "./normalize"
import type {
  PlayerSkillProfile,
  PlayerSkillProfileInput,
  SkillBand,
  SkillExplanation,
  SkillGap,
  SkillKey,
  SkillLeaderboard,
  SkillLeaderboardEntry,
  SkillLeaderboardKey,
  SkillLeaderboards,
  SkillRoundSample,
  SkillSignal,
  SkillTrend,
  SkillTrendDirection,
} from "./types"

/** Rounds in the most-recent window used to read a trend. */
const RECENT_WINDOW = 8
/** Minimum rounds in each side of a comparison to call a direction. */
const TREND_MIN_SIDE = 3

/** Sort samples newest-first; undated rounds sort last but are retained. */
function byRecency(rounds: readonly SkillRoundSample[]): SkillRoundSample[] {
  return [...rounds].sort((a, b) => {
    const at = a.playedAt ? Date.parse(a.playedAt) : Number.NEGATIVE_INFINITY
    const bt = b.playedAt ? Date.parse(b.playedAt) : Number.NEGATIVE_INFINITY
    return bt - at
  })
}

/** Build the canonical `unavailable` profile with machine-readable gaps. */
export function unavailableSkillProfile(
  playerId: string,
  gaps: SkillGap[],
  detail: string,
  season: number | null = null,
): PlayerSkillProfile {
  const skills: SkillSignal[] = SKILL_DEFINITIONS.map((def) => ({
    key: def.key,
    label: def.label,
    family: def.family,
    unit: def.unit,
    higherIsBetter: def.higherIsBetter,
    value: null,
    band: null,
    rawValue: null,
    percentile: null,
    sampleSize: 0,
    trend: emptyTrend(),
    confidence: "none",
    gap: def.sourceable ? "no-samples" : "no-provider-field",
  }))
  return {
    playerId,
    status: "unavailable",
    confidence: "none",
    season,
    sampleSize: 0,
    seasonsAnalyzed: 0,
    freshness: { lastRoundAt: null, ageDays: null },
    coverage: { known: 0, sourceable: SOURCEABLE_SKILL_KEYS.length, total: SKILL_DEFINITIONS.length },
    skills,
    strengths: [],
    weaknesses: [],
    eliteSkills: [],
    averageSkills: [],
    developingSkills: [],
    unknownSkills: SKILL_DEFINITIONS.map((d) => d.key),
    trend: "unknown",
    explanations: [],
    gaps,
    detail,
  }
}

function emptyTrend(): SkillTrend {
  return { recent: null, season: null, longTerm: null, direction: "unknown", recentSampleSize: 0 }
}

/**
 * Assemble a full Player Skill Profile. Returns an `unavailable` profile when no
 * round statistics exist for the player.
 */
export function buildPlayerSkillProfile(input: PlayerSkillProfileInput): PlayerSkillProfile {
  const { playerId, population } = input
  const now = input.now ?? new Date()
  const allRounds = input.samples.rounds

  if (allRounds.length === 0) {
    return unavailableSkillProfile(
      playerId,
      [{ code: "no-round-statistics" }],
      "No round statistics have been imported for this player yet, so no skills can be rated. This fills in automatically once shot-level data is ingested — nothing here is estimated.",
      input.season,
    )
  }

  // The rating window: rounds in the profile's season (fall back to all rounds
  // when no season is set), so the player's value matches the population, which
  // the service builds from the same season.
  const season = input.season
  const ratingRounds =
    season != null ? allRounds.filter((r) => r.season === season) : allRounds
  const effectiveRounds = ratingRounds.length > 0 ? ratingRounds : allRounds

  const { values: rawValues, counts: rawCounts } = aggregateRawSkills(effectiveRounds)

  // Trend windows (over ALL held rounds, newest first).
  const ordered = byRecency(allRounds)
  const recentRounds = ordered.slice(0, RECENT_WINDOW)
  const priorRounds = ordered.slice(RECENT_WINDOW)
  const recentAgg = aggregateRawSkills(recentRounds).values
  const priorAgg = aggregateRawSkills(priorRounds).values
  const seasonAgg = rawValues
  const longTermAgg = aggregateRawSkills(allRounds).values

  const skills: SkillSignal[] = SKILL_DEFINITIONS.map((def) => {
    const raw = rawValues[def.key] ?? null
    const sampleSize = rawCounts[def.key] ?? 0

    if (!def.sourceable) {
      return signalShell(def.key, null, 0, emptyTrend(), "no-provider-field")
    }
    if (raw === null) {
      return signalShell(def.key, null, 0, emptyTrend(), "no-samples")
    }

    const pop = population[def.key] ?? []
    const percentile = percentileOf(raw, pop, def.higherIsBetter)
    const ranked = percentile !== null
    const value = percentile
    const band: SkillBand | null = value === null ? null : scoreToBand(value)

    const recent = recentAgg[def.key] ?? null
    const prior = priorAgg[def.key] ?? null
    const trend: SkillTrend = {
      recent,
      season: seasonAgg[def.key] ?? null,
      longTerm: longTermAgg[def.key] ?? null,
      direction:
        recentRounds.length >= TREND_MIN_SIDE && priorRounds.length >= TREND_MIN_SIDE
          ? trendDirection(recent, prior, def.higherIsBetter)
          : "unknown",
      recentSampleSize: recentRounds.length,
    }

    return {
      key: def.key,
      label: def.label,
      family: def.family,
      unit: def.unit,
      higherIsBetter: def.higherIsBetter,
      value,
      band,
      rawValue: round2(raw),
      percentile,
      sampleSize,
      trend,
      confidence: gradeSkillConfidence(sampleSize, ranked),
      gap: ranked ? null : "insufficient-population",
    }
  })

  // Buckets from bands.
  const strengths: SkillKey[] = []
  const weaknesses: SkillKey[] = []
  const eliteSkills: SkillKey[] = []
  const averageSkills: SkillKey[] = []
  const developingSkills: SkillKey[] = []
  const unknownSkills: SkillKey[] = []
  const explanations: SkillExplanation[] = []

  for (const s of skills) {
    if (s.band === null) {
      unknownSkills.push(s.key)
      continue
    }
    explanations.push({
      skill: s.key,
      family: s.family,
      band: s.band,
      label: skillExplanationLabel(s.band, SKILL_BY_KEY[s.key].noun),
    })
    switch (s.band) {
      case "ELITE":
      case "EXCELLENT":
        eliteSkills.push(s.key)
        strengths.push(s.key)
        break
      case "ABOVE_AVERAGE":
        strengths.push(s.key)
        break
      case "AVERAGE":
        averageSkills.push(s.key)
        break
      case "BELOW_AVERAGE":
        developingSkills.push(s.key)
        break
      case "POOR":
      case "VERY_POOR":
        weaknesses.push(s.key)
        break
    }
  }

  const known = skills.filter((s) => s.band !== null).length
  const knownSourceable = skills.filter(
    (s) => s.band !== null && SKILL_BY_KEY[s.key].sourceable,
  ).length

  const lastRoundAt = latestPlayedAt(input.samples)
  const ageDays =
    lastRoundAt === null
      ? null
      : Math.max(0, Math.floor((now.getTime() - Date.parse(lastRoundAt)) / 86_400_000))

  const confidence = gradeProfileConfidence({
    knownSourceable,
    sourceableTotal: SOURCEABLE_SKILL_KEYS.length,
    rounds: effectiveRounds.length,
    ageDays,
  })

  const gaps = buildGaps(skills)
  const seasonsAnalyzed = new Set(
    allRounds.map((r) => r.season).filter((s): s is number => s != null),
  ).size

  return {
    playerId,
    status: known > 0 ? "available" : "unavailable",
    confidence,
    season,
    sampleSize: effectiveRounds.length,
    seasonsAnalyzed,
    freshness: { lastRoundAt, ageDays },
    coverage: { known, sourceable: SOURCEABLE_SKILL_KEYS.length, total: SKILL_DEFINITIONS.length },
    skills,
    strengths,
    weaknesses,
    eliteSkills,
    averageSkills,
    developingSkills,
    unknownSkills,
    trend: overallTrend(skills),
    explanations,
    gaps,
    detail: buildDetail(known, effectiveRounds.length, confidence),
  }
}

function signalShell(
  key: SkillKey,
  value: number | null,
  sampleSize: number,
  trend: SkillTrend,
  gap: SkillSignal["gap"],
): SkillSignal {
  const def = SKILL_BY_KEY[key]
  return {
    key,
    label: def.label,
    family: def.family,
    unit: def.unit,
    higherIsBetter: def.higherIsBetter,
    value,
    band: value === null ? null : scoreToBand(value),
    rawValue: null,
    percentile: value,
    sampleSize,
    trend,
    confidence: "none",
    gap,
  }
}

/** Collapse per-skill gaps into a compact, de-duplicated profile gap list. */
function buildGaps(skills: readonly SkillSignal[]): SkillGap[] {
  const gaps: SkillGap[] = []
  const noProviderField = skills.filter((s) => s.gap === "no-provider-field").map((s) => s.key)
  const insufficient = skills.filter((s) => s.gap === "insufficient-population").map((s) => s.key)
  if (noProviderField.length > 0) {
    gaps.push({
      code: "no-provider-field",
      detail: `${noProviderField.length} scoring skills (par 3/4/5) have no provider source field and stay unrated.`,
    })
  }
  if (insufficient.length > 0) {
    gaps.push({
      code: "insufficient-population",
      detail: `${insufficient.length} skills have samples but too small a field to rank yet.`,
    })
  }
  return gaps
}

/** Overall trajectory: the plurality of per-skill directions. */
function overallTrend(skills: readonly SkillSignal[]): SkillTrendDirection {
  let improving = 0
  let declining = 0
  let stable = 0
  for (const s of skills) {
    if (s.trend.direction === "improving") improving += 1
    else if (s.trend.direction === "declining") declining += 1
    else if (s.trend.direction === "stable") stable += 1
  }
  if (improving + declining + stable === 0) return "unknown"
  if (improving > declining && improving >= stable) return "improving"
  if (declining > improving && declining >= stable) return "declining"
  return "stable"
}

function buildDetail(known: number, rounds: number, confidence: string): string {
  if (known === 0) {
    return "No skills can be rated yet — round statistics exist but none carry the shot-level fields the ratings need. This resolves automatically once strokes-gained and scoring data are ingested."
  }
  return `Rated ${known} skill${known === 1 ? "" : "s"} from ${rounds} round${rounds === 1 ? "" : "s"} of verified statistics (${confidence} confidence). Unrated skills are shown honestly rather than estimated.`
}

/* ------------------------------------------------------------------ */
/* Field leaderboards                                                 */
/* ------------------------------------------------------------------ */

/** A named player + their computed profile, the input to the leaderboards. */
export interface RankedPlayerSkill {
  playerId: string
  playerName: string
  profile: PlayerSkillProfile
}

interface BoardSpec {
  key: SkillLeaderboardKey
  title: string
  description: string
  skill: SkillKey | null
}

const BOARD_SPECS: readonly BoardSpec[] = [
  { key: "bestIronPlayers", title: "Best Iron Players", description: "Strongest approach play (SG: Approach).", skill: "sgApproach" },
  { key: "bestPutters", title: "Best Putters", description: "Strongest putting (SG: Putting).", skill: "sgPutting" },
  { key: "bestScramblers", title: "Best Scramblers", description: "Highest scrambling success rate.", skill: "scrambling" },
  { key: "longestDrivers", title: "Longest Drivers", description: "Greatest average driving distance.", skill: "drivingDistance" },
  { key: "mostAccurateDrivers", title: "Most Accurate Drivers", description: "Highest driving accuracy.", skill: "drivingAccuracy" },
  { key: "highestConfidence", title: "Highest Confidence Skills", description: "Players with the most complete, freshest skill profiles.", skill: null },
]

/**
 * Build the tournament-hub skill leaderboards from the field's profiles. Each
 * board ranks only players whose relevant skill is rated (or, for the
 * confidence board, whose profile is available), so lists stay empty rather
 * than padded when no data exists.
 */
export function buildSkillLeaderboards(
  ranked: readonly RankedPlayerSkill[],
  season: number | null,
  limit = 5,
): SkillLeaderboards {
  const boards: SkillLeaderboard[] = BOARD_SPECS.map((spec) => ({
    key: spec.key,
    title: spec.title,
    description: spec.description,
    skill: spec.skill,
    entries: spec.skill
      ? rankBySkill(ranked, spec.skill, limit)
      : rankByConfidence(ranked, limit),
  }))

  return {
    season,
    ratedPlayers: ranked.filter((r) => r.profile.status === "available").length,
    totalPlayers: ranked.length,
    boards,
  }
}

function rankBySkill(
  ranked: readonly RankedPlayerSkill[],
  skill: SkillKey,
  limit: number,
): SkillLeaderboardEntry[] {
  const rows = ranked
    .map((r) => {
      const signal = r.profile.skills.find((s) => s.key === skill)
      if (!signal || signal.value === null) return null
      return { r, signal }
    })
    .filter((x): x is { r: RankedPlayerSkill; signal: SkillSignal } => x !== null)
    .sort((a, b) => {
      const byValue = (b.signal.value as number) - (a.signal.value as number)
      if (byValue !== 0) return byValue
      return (b.signal.rawValue ?? 0) - (a.signal.rawValue ?? 0)
    })
    .slice(0, limit)

  return rows.map(({ r, signal }, i) => ({
    rank: i + 1,
    playerId: r.playerId,
    playerName: r.playerName,
    value: signal.value,
    band: signal.band,
    rawValue: signal.rawValue,
    unit: signal.unit,
    confidence: signal.confidence,
  }))
}

function rankByConfidence(
  ranked: readonly RankedPlayerSkill[],
  limit: number,
): SkillLeaderboardEntry[] {
  const order = { none: 0, low: 1, medium: 2, high: 3 } as const
  const rows = ranked
    .filter((r) => r.profile.status === "available")
    .sort((a, b) => {
      const byConf = order[b.profile.confidence] - order[a.profile.confidence]
      if (byConf !== 0) return byConf
      return b.profile.coverage.known - a.profile.coverage.known
    })
    .slice(0, limit)

  return rows.map((r, i) => ({
    rank: i + 1,
    playerId: r.playerId,
    playerName: r.playerName,
    value: r.profile.coverage.sourceable > 0
      ? Math.round((r.profile.coverage.known / r.profile.coverage.sourceable) * 100)
      : null,
    band: null,
    rawValue: null,
    unit: null,
    confidence: r.profile.confidence,
  }))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
