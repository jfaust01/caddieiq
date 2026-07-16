'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type {
  FilterOption,
  RankingFiltersState,
  RankingRow,
  RankingSummary,
  RankingView,
} from '../types'

/** How many ranked players show per page in the directory table. */
export const RANKINGS_PAGE_SIZE = 25

export const DEFAULT_RANKING_FILTERS: RankingFiltersState = {
  search: '',
  tour: 'ALL',
  season: 'ALL',
}

export interface UseRankingsResult {
  /** Rows after search + filters, before pagination (drives the count label). */
  filteredCount: number
  /** Total ranked players in the active board (the denominator). */
  totalRanked: number
  /** The current page of rows to render. */
  pageRows: RankingRow[]
  page: number
  totalPages: number
  setPage: (page: number) => void
  filters: RankingFiltersState
  setSearch: (value: string) => void
  setFilter: <K extends keyof RankingFiltersState>(
    key: K,
    value: RankingFiltersState[K],
  ) => void
  resetFilters: () => void
  hasActiveFilters: boolean
  options: { tour: FilterOption[]; season: FilterOption[] }
  summary: RankingSummary
}

/**
 * Client controller for the live Rankings directory. The enriched view is
 * computed on the server (the engine runs in an RSC) and passed in via `view`;
 * this hook owns only interactive state — search, the Tour/Season filters, and
 * pagination — over the ranked population (a few hundred rows at most, so
 * filtering and paging locally is simpler than round-tripping the server).
 */
export function useRankings(view: RankingView): UseRankingsResult {
  const [filters, setFilters] = useState<RankingFiltersState>(DEFAULT_RANKING_FILTERS)
  const [page, setPage] = useState(1)

  // Reset interactive state whenever the ranking type (and its data) changes.
  useEffect(() => {
    setFilters(DEFAULT_RANKING_FILTERS)
    setPage(1)
  }, [view.slug])

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
    setPage(1)
  }, [])

  const setFilter = useCallback(
    <K extends keyof RankingFiltersState>(key: K, value: RankingFiltersState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    },
    [],
  )

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_RANKING_FILTERS)
    setPage(1)
  }, [])

  const hasActiveFilters = useMemo(
    () =>
      filters.search.trim() !== '' || filters.tour !== 'ALL' || filters.season !== 'ALL',
    [filters],
  )

  // Season is a single-season dataset today; the filter is honest (it only
  // offers seasons with data) and simply narrows to the board's season, so it
  // filters nothing out unless a future multi-season population arrives.
  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    return view.rows.filter((row) => {
      if (query && !row.name.toLowerCase().includes(query)) return false
      if (filters.tour !== 'ALL' && row.tour !== filters.tour) return false
      if (
        filters.season !== 'ALL' &&
        view.season !== null &&
        String(view.season) !== filters.season
      ) {
        return false
      }
      return true
    })
  }, [view.rows, view.season, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / RANKINGS_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * RANKINGS_PAGE_SIZE, safePage * RANKINGS_PAGE_SIZE),
    [filtered, safePage],
  )

  const summary = useMemo<RankingSummary>(
    () => ({
      typeLabel: view.typeLabel,
      seasonLabel: view.season === null ? 'No season data' : `${view.season} season`,
      playersRanked: view.totalRanked,
    }),
    [view.typeLabel, view.season, view.totalRanked],
  )

  return {
    filteredCount: filtered.length,
    totalRanked: view.totalRanked,
    pageRows,
    page: safePage,
    totalPages,
    setPage,
    filters,
    setSearch,
    setFilter,
    resetFilters,
    hasActiveFilters,
    options: { tour: view.tourOptions, season: view.seasonOptions },
    summary,
  }
}
