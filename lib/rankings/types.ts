/**
 * Ranking domain types — the shared contract of the CaddieIQ Ranking Engine.
 *
 * The Ranking Engine turns the Analytics Engine's per-player scores into
 * ordered, reusable rankings. It NEVER computes its own performance numbers:
 * every ranking is a pure ordering of analytics the platform already produced
 * (see `@/lib/analytics`). Because of that, rankings stay consistent with the
 * ratings shown on player pages and the tournament hub, and future AI
 * explanations can reference these rankings instead of recalculating scores.
 *
 * NOTE — not to be confused with `@/lib/ranking` (singular): that is the older,
 * scaffold-only ranking framework (weights/pipeline/registry) that returns
 * deterministic MOCK values for the standalone rankings explorer. This module
 * (`@/lib/rankings`, plural) is the CONCRETE engine wired to live analytics.
 * They are intentionally separate, mirroring how the concrete Analytics Engine
 * coexists with its own scaffold.
 *
 * These shapes are free of any Prisma/provider/React import so they can be
 * shared by the server service, the pure calculator, and client UI alike.
 */

import type { AnalyticsBand } from "@/lib/analytics/types"

/**
 * The rankings CaddieIQ produces today. Each maps directly onto a value the
 * Analytics Engine already emits — no invented dimensions:
 *
 * - `overall` — the analytics composite `overallRating`.
 * - `recentForm` — the `recentForm` analytic (trajectory).
 * - `consistency` — the `consistency` analytic (reliability).
 * - `fantasy` — the `fantasyProduction` analytic (scoring rate).
 * - `season` — the `seasonPerformance` analytic (season standing).
 */
export type RankingCategory =
  | "overall"
  | "recentForm"
  | "consistency"
  | "fantasy"
  | "season"

/**
 * What population a ranking was computed over. `global` ranks every player with
 * data in the season; `field` ranks only a tournament's entrants. The scores
 * being ordered are always the same season-normalized analytics — scope only
 * changes which players are in the ordering.
 */
export type RankingScope = "global" | "field"

/** Display metadata for a ranking category. */
export interface RankingCategoryMeta {
  key: RankingCategory
  /** Full label, e.g. "Overall Rating". */
  label: string
  /** Compact label for chips/badges, e.g. "Overall". */
  shortLabel: string
  /** One-line explanation of what the ranking orders by. */
  description: string
}

/** One player's placement within a single ranking category. */
export interface RankingEntry {
  category: RankingCategory
  label: string
  shortLabel: string
  /**
   * Position within the ranking (1 = best), or `null` when the player has no
   * score in this category and therefore cannot be ranked. Ties share a rank
   * (standard competition ranking: 1, 2, 2, 4…).
   */
  rank: number | null
  /** How many players were rankable in this category (the denominator). */
  totalRanked: number
  /** The underlying analytics score being ordered (0–100), or `null`. */
  score: number | null
  /** Qualitative band for `score`, reused verbatim from the Analytics Engine. */
  band: AnalyticsBand | null
  /**
   * Percentile standing among rankable players (0–100, higher is better), or
   * `null` when unranked. Derived purely from `rank` and `totalRanked`.
   */
  percentile: number | null
}

/**
 * A player's full set of ranking placements — the data the player page renders
 * as badges. `isRanked` is false when the player is absent from the population
 * (no season data), so the UI degrades honestly instead of inventing ranks.
 */
export interface PlayerRankingProfile {
  playerId: string
  season: number | null
  scope: RankingScope
  /** One entry per category, in display order. */
  entries: RankingEntry[]
  isRanked: boolean
}

/** One ordered row within a ranking board. */
export interface RankingBoardRow {
  rank: number
  playerId: string
  score: number
  band: AnalyticsBand
  percentile: number
}

/** A single category ranked across a population — an ordered leaderboard. */
export interface RankingBoard {
  category: RankingCategory
  label: string
  shortLabel: string
  description: string
  /** How many players could be ranked in this category. */
  totalRanked: number
  /** Rows ordered best-first. */
  rows: RankingBoardRow[]
}

/**
 * The full output of a ranking run: one board per category over a population,
 * plus the scope and season the ordering was built against.
 */
export interface RankingBoardSet {
  season: number | null
  scope: RankingScope
  /** Number of players considered (rankable or not) in the population. */
  totalPlayers: number
  /** One board per category, in display order. */
  boards: RankingBoard[]
}
