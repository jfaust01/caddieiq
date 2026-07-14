/**
 * View-model types for the Rankings Experience.
 *
 * The Ranking Engine (`@/lib/ranking`) produces provider-agnostic
 * `PlayerRankingResult`s. This feature layer enriches those with presentation
 * metadata (nationality, tour, headshot, recent-form strip) and reshapes the
 * per-module breakdown into fixed columns the table renders.
 *
 * TODO(data): the enrichment metadata is mock; real player records will replace
 * `ranking-metadata.ts` once the data platform is connected.
 */

import type { ConfidenceLevel } from '@/lib/analytics/shared/types'
import type {
  RankingExplanation,
  RankingMovement,
  RankingType,
  RankingWeights,
} from '@/lib/ranking'
import type { FormResult, Nationality, Tour } from '@/features/players/types'

/** The seven analytics module scores, flattened for column access (0–100). */
export interface RankingModuleScores {
  recentForm: number
  courseFit: number
  value: number
  momentum: number
  wind: number
  strokesGained: number
  consistency: number
}

/**
 * A single enriched ranking row — the atomic unit the table and preview panel
 * render. Combines engine output (`rank`, `movement`, `overallScore`, …) with
 * mock presentation metadata.
 */
export interface RankingRow {
  rank: number
  previousRank: number | null
  movement: RankingMovement
  /** Positions gained (+) / lost (−) since the previous snapshot. */
  delta: number
  playerId: string
  name: string
  nationality: Nationality
  tour: Tour
  /** Events played this season — powers the "Minimum Events" filter. */
  events: number
  headshotUrl: string | null
  /** Recent finishes, newest first. */
  recentForm: FormResult[]
  /** Composite 0–100 score behind the rank. */
  overallScore: number
  confidence: ConfidenceLevel
  moduleScores: RankingModuleScores
  /** Placeholder AI rationale from the engine. */
  explanation?: RankingExplanation
}

/** The full, enriched result of a ranking run for one type. */
export interface RankingView {
  type: RankingType
  results: RankingRow[]
  /** Normalized weights the engine applied. */
  weights: RankingWeights
  generatedAt: Date
  /** `true` while any part of the run used placeholder values. */
  mock: boolean
}

/** Coarse recent-form band used by the "Recent Form" filter. */
export type RankingFormFilter = 'ALL' | 'HOT' | 'STEADY' | 'COLD'

/** Rankings toolbar filter state. `ALL` sentinels keep controls fully typed. */
export interface RankingFiltersState {
  search: string
  tour: Tour | 'ALL'
  nationality: string | 'ALL'
  minEvents: number
  form: RankingFormFilter
  favoritesOnly: boolean
}

/** A `<Select>` option descriptor. */
export interface FilterOption {
  value: string
  label: string
}

/** Which insight a summary card presents. */
export type RankingInsightKind =
  | 'risers'
  | 'fallers'
  | 'value'
  | 'form'
  | 'course'
  | 'wind'

/** A single row inside an insight card. */
export interface RankingInsightEntry {
  playerId: string
  name: string
  nationality: Nationality
  /** Formatted headline metric, e.g. "+4" or "88". */
  value: string
  /** Optional supporting text. */
  detail?: string
}

/** A professional summary card for the insight panel. */
export interface RankingInsight {
  kind: RankingInsightKind
  title: string
  description: string
  entries: RankingInsightEntry[]
}

/** Data for the top summary bar. */
export interface RankingSummary {
  tournamentLabel: string
  typeLabel: string
  playersRanked: number
  lastUpdatedLabel: string
}
