/**
 * RankingCalculator — the pure computation core of the Ranking Engine.
 *
 * Every function here is a pure transform: given a set of already-computed
 * {@link PlayerAnalytics} it returns ordered rankings. There is no database,
 * provider, network, or I/O access, and — critically — no performance math.
 * The calculator only SORTS and RANKS values the Analytics Engine already
 * produced, so a ranking can never disagree with the rating shown on a player
 * page or drift from the single source of truth.
 *
 * Players with a `null` value in a category are simply not rankable there (they
 * are excluded from that board and carry a `null` rank), rather than being
 * assigned a fabricated score — honesty over coverage, matching the Analytics
 * Engine's own contract.
 */

import type {
  AnalyticsBand,
  AnalyticsConfidence,
  AnalyticsMetricKey,
  PlayerAnalytics,
} from "@/lib/analytics/types"
import type {
  PlayerRankingProfile,
  RankingBoard,
  RankingBoardRow,
  RankingBoardSet,
  RankingCategory,
  RankingCategoryMeta,
  RankingConfidence,
  RankingEntry,
  RankingGrade,
  RankingScope,
} from "./types"

/** Display order for ranking categories, mirrored across every surface. */
export const RANKING_CATEGORY_ORDER: readonly RankingCategory[] = [
  "overall",
  "recentForm",
  "fantasy",
  "consistency",
  "season",
]

/** Metadata (labels + description) for each category. */
export const RANKING_CATEGORY_META: Record<RankingCategory, RankingCategoryMeta> = {
  overall: {
    key: "overall",
    label: "Overall Rating",
    shortLabel: "Overall",
    description: "Ranked by the composite analytics rating.",
  },
  recentForm: {
    key: "recentForm",
    label: "Recent Form Rating",
    shortLabel: "Form",
    description: "Ranked by current standing and week-over-week movement.",
  },
  fantasy: {
    key: "fantasy",
    label: "Fantasy Rating",
    shortLabel: "Fantasy",
    description: "Ranked by average fantasy production per event.",
  },
  consistency: {
    key: "consistency",
    label: "Consistency Rating",
    shortLabel: "Consistency",
    description: "Ranked by the share of fantasy activity that was positive.",
  },
  season: {
    key: "season",
    label: "Season Rating",
    shortLabel: "Season",
    description: "Ranked by overall season standing (output blended with rank).",
  },
}

/** Maps a ranking category to the Analytics Engine metric key that backs it. */
const CATEGORY_METRIC: Record<
  Exclude<RankingCategory, "overall">,
  AnalyticsMetricKey
> = {
  recentForm: "recentForm",
  fantasy: "fantasyProduction",
  consistency: "consistency",
  season: "seasonPerformance",
}

/**
 * Static explanation factors for the single-metric categories — the analytics
 * inputs each ranking is grounded in. `overall` is intentionally absent: its
 * factors are the player's actually-available metrics, computed per player (see
 * {@link factorsForCategory}). This metadata is not shown to users yet; it is
 * the reasoning future AI explanations will reference instead of inventing.
 */
const CATEGORY_FACTORS: Record<Exclude<RankingCategory, "overall">, readonly string[]> = {
  recentForm: ["World Ranking", "Week-over-Week Movement"],
  fantasy: ["Fantasy Points per Event"],
  consistency: ["Positive Fantasy Production Share"],
  season: ["Total Fantasy Output", "World Ranking"],
}

/** Confidence levels ordered weakest → strongest, for conservative blending. */
const CONFIDENCE_RANK: Record<AnalyticsConfidence, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
}

/**
 * Map a 0–100 score to a letter grade. Analytics scores are field-relative
 * (percentile-like), so the grade communicates standing among peers: ~50 (the
 * median) is a "C", elite scores earn an "A". Deterministic and pure.
 */
export function letterGradeForScore(score: number): RankingGrade {
  if (score >= 90) return "A+"
  if (score >= 80) return "A"
  if (score >= 70) return "B+"
  if (score >= 60) return "B"
  if (score >= 50) return "C+"
  if (score >= 40) return "C"
  if (score >= 30) return "D"
  return "F"
}

/**
 * The most conservative confidence among a set — overall is only as trustworthy
 * as its weakest contributing metric. Ignores absent (`none`) metrics; returns
 * `none` when nothing contributed.
 */
function aggregateConfidence(levels: readonly AnalyticsConfidence[]): RankingConfidence {
  const present = levels.filter((level) => level !== "none")
  if (present.length === 0) return "none"
  return present.reduce((lowest, level) =>
    CONFIDENCE_RANK[level] < CONFIDENCE_RANK[lowest] ? level : lowest,
  )
}

/** Explanation factors for a category: available metrics for `overall`, else static. */
function factorsForCategory(analytics: PlayerAnalytics, category: RankingCategory): string[] {
  if (category === "overall") {
    return analytics.scores.filter((score) => score.value !== null).map((score) => score.label)
  }
  return [...CATEGORY_FACTORS[category]]
}

/**
 * The score + band + confidence an analytics profile contributes to a category.
 * For `overall`, confidence is the conservative blend of the metrics that fed
 * the composite; for a single-metric category it is that metric's confidence.
 */
function categoryValue(
  analytics: PlayerAnalytics,
  category: RankingCategory,
): { value: number | null; band: AnalyticsBand | null; confidence: RankingConfidence } {
  if (category === "overall") {
    const confidence = aggregateConfidence(
      analytics.scores.filter((score) => score.value !== null).map((score) => score.confidence),
    )
    return { value: analytics.overallRating, band: analytics.overallBand, confidence }
  }
  const metricKey = CATEGORY_METRIC[category]
  const score = analytics.scores.find((entry) => entry.key === metricKey)
  return {
    value: score?.value ?? null,
    band: score?.band ?? null,
    confidence: score?.confidence ?? "none",
  }
}

/** Percentile (0–100, higher is better) from a rank within a population. */
function percentileFromRank(rank: number, totalRanked: number): number {
  if (totalRanked <= 1) return 100
  // rank 1 → 100, worst rank → ~0, evenly spread across the field.
  const pct = ((totalRanked - rank) / (totalRanked - 1)) * 100
  return Math.round(pct * 10) / 10
}

/**
 * Build one ranking board for a category from a set of analytics profiles.
 * Only players with a non-null value are ranked; ordering is by score
 * descending with a stable `playerId` tie-break, and ties share a rank
 * (standard competition ranking).
 */
function buildBoard(
  players: readonly PlayerAnalytics[],
  category: RankingCategory,
): RankingBoard {
  const meta = RANKING_CATEGORY_META[category]

  type RankableEntry = {
    playerId: string
    score: number
    band: AnalyticsBand
    confidence: RankingConfidence
    factors: string[]
  }

  const rankable = players
    .map((analytics): RankableEntry | null => {
      const { value, band, confidence } = categoryValue(analytics, category)
      return value === null || band === null
        ? null
        : {
            playerId: analytics.playerId,
            score: value,
            band,
            confidence,
            factors: factorsForCategory(analytics, category),
          }
    })
    .filter((entry): entry is RankableEntry => entry !== null)
    .sort((a, b) => (b.score - a.score) || a.playerId.localeCompare(b.playerId))

  const totalRanked = rankable.length
  const rows: RankingBoardRow[] = []
  let lastScore: number | null = null
  let lastRank = 0
  rankable.forEach((entry, index) => {
    // Standard competition ranking: equal scores share the earlier rank; the
    // next distinct score jumps to its absolute position (1, 2, 2, 4…).
    const rank = lastScore !== null && entry.score === lastScore ? lastRank : index + 1
    lastScore = entry.score
    lastRank = rank
    rows.push({
      rank,
      playerId: entry.playerId,
      score: entry.score,
      band: entry.band,
      percentile: percentileFromRank(rank, totalRanked),
      grade: letterGradeForScore(entry.score),
      confidence: entry.confidence,
      factors: entry.factors,
    })
  })

  return {
    category,
    label: meta.label,
    shortLabel: meta.shortLabel,
    description: meta.description,
    totalRanked,
    rows,
  }
}

/**
 * Build the full set of ranking boards (one per category) for a population of
 * analytics profiles. This is the single entry point the service uses.
 */
export function buildBoardSet(
  players: readonly PlayerAnalytics[],
  scope: RankingScope,
  season: number | null,
): RankingBoardSet {
  return {
    season,
    scope,
    totalPlayers: players.length,
    boards: RANKING_CATEGORY_ORDER.map((category) => buildBoard(players, category)),
  }
}

/** Look up a player's row in a board, or `null` when they are unranked there. */
function rowFor(board: RankingBoard, playerId: string): RankingBoardRow | null {
  return board.rows.find((row) => row.playerId === playerId) ?? null
}

/**
 * Extract one player's placement across every category as a
 * {@link PlayerRankingProfile} — the shape the player page renders as badges.
 */
export function selectPlayerProfile(
  boardSet: RankingBoardSet,
  playerId: string,
): PlayerRankingProfile {
  const entries: RankingEntry[] = boardSet.boards.map((board) => {
    const row = rowFor(board, playerId)
    return {
      category: board.category,
      label: board.label,
      shortLabel: board.shortLabel,
      rank: row?.rank ?? null,
      totalRanked: board.totalRanked,
      score: row?.score ?? null,
      band: row?.band ?? null,
      percentile: row?.percentile ?? null,
      grade: row?.grade ?? null,
      confidence: row?.confidence ?? "none",
      factors: row?.factors ?? [],
    }
  })

  return {
    playerId,
    season: boardSet.season,
    scope: boardSet.scope,
    entries,
    isRanked: entries.some((entry) => entry.rank !== null),
  }
}

/**
 * Index every player's field rank per category, for callers (e.g. a tournament
 * field) that need to sort a roster by rankings. Returns a map of
 * `playerId → { category → rank | null }`.
 */
export function ranksByPlayer(
  boardSet: RankingBoardSet,
): Map<string, Record<RankingCategory, number | null>> {
  const index = new Map<string, Record<RankingCategory, number | null>>()
  const ensure = (playerId: string) => {
    let record = index.get(playerId)
    if (!record) {
      record = {
        overall: null,
        recentForm: null,
        fantasy: null,
        consistency: null,
        season: null,
      }
      index.set(playerId, record)
    }
    return record
  }

  for (const board of boardSet.boards) {
    for (const row of board.rows) {
      ensure(row.playerId)[board.category] = row.rank
    }
  }
  return index
}
