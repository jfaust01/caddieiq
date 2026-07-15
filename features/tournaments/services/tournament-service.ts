/**
 * TournamentService — live data access for the Tournament domain.
 *
 * The server-only read layer for the tournaments feature. It reads through
 * `TournamentRepository` (the only layer allowed to touch the database), which
 * executes search, filtering, sorting, and pagination *in SQL*, then maps the
 * returned page of rows into UI shapes via the pure `tournament-mapper`. The
 * full table is never loaded into memory — only the requested page is fetched.
 *
 * It never fabricates data: everything it returns originates from the live
 * database. The `server-only` import guarantees this module can never be pulled
 * into a client bundle — the UI reaches it through server actions instead.
 */

import 'server-only'

import type {
  FilterOption,
  PaginatedResult,
  TournamentQuery,
  TournamentSummary,
  TourType,
} from '@/features/tournaments/types'
import {
  getTournamentRepository,
  type TournamentSearchParams,
} from '@/lib/repositories/tournament-repository'

import { mapTournamentSummary } from './tournament-mapper'

/** Translate UI query state (with its `"ALL"` sentinels) into DB search params. */
function toSearchParams(query: TournamentQuery): TournamentSearchParams {
  const { filters, page, pageSize } = query
  const search = filters.search.trim()
  const seasonYear = filters.season === 'ALL' ? undefined : Number.parseInt(filters.season, 10)
  return {
    search: search === '' ? undefined : search,
    status: filters.status === 'ALL' ? undefined : filters.status,
    tourType: filters.tour === 'ALL' ? undefined : filters.tour,
    seasonYear: Number.isFinite(seasonYear) ? seasonYear : undefined,
    skip: (Math.max(1, page) - 1) * pageSize,
    take: pageSize,
  }
}

export const tournamentService = {
  /**
   * Return a filtered, sorted, paginated page of the live tournament schedule.
   * All of the work happens in the database; this method only translates the
   * query, delegates to the repository, and maps the returned page.
   */
  async getTournaments(query: TournamentQuery): Promise<PaginatedResult<TournamentSummary>> {
    const { items, total } = await getTournamentRepository().search(toSearchParams(query))
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
    const safePage = Math.min(Math.max(1, query.page), totalPages)
    return {
      items: items.map(mapTournamentSummary),
      total,
      page: safePage,
      pageSize: query.pageSize,
      totalPages,
    }
  },

  /** Tour filter options derived from the tours actually referenced by events. */
  async getTourOptions(): Promise<FilterOption<TourType | 'ALL'>[]> {
    const rows = await getTournamentRepository().listReferencedTours()
    const options = rows
      .filter((row): row is { type: TourType; name: string; code: string } =>
        ['PGA', 'DP_WORLD', 'LIV', 'KORN_FERRY', 'LPGA'].includes(row.type),
      )
      .map((row) => ({ value: row.type, label: row.name }))
    return [{ value: 'ALL', label: 'All tours' }, ...options]
  },

  /** Season filter options derived from the seasons actually referenced by events. */
  async getSeasonOptions(): Promise<FilterOption[]> {
    const years = await getTournamentRepository().listReferencedSeasons()
    const options = years.map((year) => ({ value: String(year), label: String(year) }))
    return [{ value: 'ALL', label: 'All seasons' }, ...options]
  },
}
