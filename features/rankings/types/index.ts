/**
 * View-model types for the live Rankings directory.
 *
 * The directory renders the CaddieIQ Ranking Engine (`@/lib/rankings`) — the
 * platform's real "opinion layer" — as a filterable, paginated leaderboard.
 * Every row is a real engine board row (rank, score, grade, band, confidence)
 * joined with live player display metadata (name, country, tour). There is no
 * fabricated data here: columns and insights that the engine cannot back
 * (course-fit, wind, momentum, market value, rank movement) are intentionally
 * absent rather than mocked.
 */

import type { AnalyticsBand, AnalyticsConfidence } from '@/lib/analytics/types'
import type { RankingCategory } from '@/lib/rankings/types'

/**
 * A single directory row: an engine board row (the ordering + score metadata)
 * plus the live metadata needed to label the player. Finishing positions,
 * movement, and market value are absent — the engine does not produce them.
 */
export interface RankingRow {
  /** 1-based placement in the active board (ties share a rank). */
  rank: number
  playerId: string
  name: string
  /** ISO-ish country code, or null when unknown (never fabricated). */
  countryCode: string | null
  /** Active tour type (e.g. "PGA"), or null when no membership is recorded. */
  tour: string | null
  /** Composite/board score, 0–100. */
  score: number
  /** Letter grade mapped from `score` by the engine. */
  grade: string
  /** Qualitative tier, shared with the Analytics Engine. */
  band: AnalyticsBand
  /** Confidence carried from the analytics behind the score. */
  confidence: AnalyticsConfidence
  /** Percentile standing among ranked players (0–100). */
  percentile: number
}

/** A `<Select>` option descriptor. */
export interface FilterOption {
  value: string
  label: string
}

/**
 * The fully-resolved live view for one ranking type: the ordered rows plus the
 * metadata the directory chrome needs. Computed on the server (the engine runs
 * in an RSC) and passed to the client controller.
 */
export interface RankingView {
  /** URL slug of the active ranking type. */
  slug: string
  /** Engine category the slug resolved to. */
  category: RankingCategory
  /** Full label for headings/tabs. */
  typeLabel: string
  /** One-line description of the active board. */
  typeDescription: string
  /** Season the rankings were normalized against, or null when none. */
  season: number | null
  /** Total players ranked in this board (the directory denominator). */
  totalRanked: number
  /** Every ranked row, best-first. */
  rows: RankingRow[]
  /** Tour filter options derived from the ranked players actually present. */
  tourOptions: FilterOption[]
  /** Season filter options derived from the seasons with data. */
  seasonOptions: FilterOption[]
}

/** Rankings toolbar filter state. `ALL` sentinels keep controls fully typed. */
export interface RankingFiltersState {
  search: string
  tour: string | 'ALL'
  season: string | 'ALL'
}

/** Data for the top summary bar. */
export interface RankingSummary {
  typeLabel: string
  seasonLabel: string
  playersRanked: number
}
