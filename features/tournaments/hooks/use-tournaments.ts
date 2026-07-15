'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import {
  fetchTournaments,
  fetchTournamentSeasonOptions,
  fetchTournamentTourOptions,
} from '@/features/tournaments/services/tournament-actions'
import type {
  FilterOption,
  PaginatedResult,
  TournamentFilters,
  TournamentQuery,
  TournamentStatus,
  TournamentSummary,
  TourType,
} from '@/features/tournaments/types'

export const TOURNAMENTS_PAGE_SIZE = 9

export const DEFAULT_TOURNAMENT_FILTERS: TournamentFilters = {
  search: '',
  status: 'ALL',
  tour: 'ALL',
  season: 'ALL',
}

const STATUS_OPTIONS: FilterOption<TournamentStatus | 'ALL'>[] = [
  { value: 'ALL', label: 'Any status' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'ACTIVE', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELED', label: 'Canceled' },
]

const DEFAULT_TOUR_OPTIONS: FilterOption<TourType | 'ALL'>[] = [
  { value: 'ALL', label: 'All tours' },
]

const DEFAULT_SEASON_OPTIONS: FilterOption[] = [{ value: 'ALL', label: 'All seasons' }]

const EMPTY_RESULT: PaginatedResult<TournamentSummary> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: TOURNAMENTS_PAGE_SIZE,
  totalPages: 1,
}

export interface UseTournamentsResult {
  filters: TournamentFilters
  setSearch: (value: string) => void
  setFilter: <K extends keyof TournamentFilters>(key: K, value: TournamentFilters[K]) => void
  resetFilters: () => void
  hasActiveFilters: boolean
  page: number
  setPage: (page: number) => void
  result: PaginatedResult<TournamentSummary>
  isLoading: boolean
  isError: boolean
  options: {
    status: FilterOption<TournamentStatus | 'ALL'>[]
    tour: FilterOption<TourType | 'ALL'>[]
    season: FilterOption[]
  }
}

/**
 * Client controller for the tournament directory: search, filters, and
 * pagination over the *live* tournament data.
 *
 * Data is fetched through the `fetchTournaments` server action via TanStack
 * Query (no fetching in effects). Previous pages are kept in place while the
 * next query resolves so pagination and filtering stay smooth, and query errors
 * are surfaced so the directory can render a database-error state.
 */
export function useTournaments(): UseTournamentsResult {
  const [filters, setFilters] = useState<TournamentFilters>(DEFAULT_TOURNAMENT_FILTERS)
  const [page, setPage] = useState(1)

  const query = useMemo<TournamentQuery>(
    () => ({ filters, page, pageSize: TOURNAMENTS_PAGE_SIZE }),
    [filters, page],
  )

  const tournamentsQuery = useQuery({
    queryKey: ['tournaments', query],
    queryFn: async () => {
      const response = await fetchTournaments(query)
      if (!response.ok) throw new Error(response.error)
      return response.data
    },
    placeholderData: keepPreviousData,
  })

  const tourOptionsQuery = useQuery({
    queryKey: ['tournament-tour-options'],
    queryFn: async () => {
      const response = await fetchTournamentTourOptions()
      if (!response.ok) throw new Error(response.error)
      return response.data
    },
  })

  const seasonOptionsQuery = useQuery({
    queryKey: ['tournament-season-options'],
    queryFn: async () => {
      const response = await fetchTournamentSeasonOptions()
      if (!response.ok) throw new Error(response.error)
      return response.data
    },
  })

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
    setPage(1)
  }, [])

  const setFilter = useCallback(
    <K extends keyof TournamentFilters>(key: K, value: TournamentFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    },
    [],
  )

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_TOURNAMENT_FILTERS)
    setPage(1)
  }, [])

  const hasActiveFilters = useMemo(
    () =>
      filters.search.trim() !== '' ||
      filters.status !== 'ALL' ||
      filters.tour !== 'ALL' ||
      filters.season !== 'ALL',
    [filters],
  )

  const options = useMemo(
    () => ({
      status: STATUS_OPTIONS,
      tour: tourOptionsQuery.data ?? DEFAULT_TOUR_OPTIONS,
      season: seasonOptionsQuery.data ?? DEFAULT_SEASON_OPTIONS,
    }),
    [tourOptionsQuery.data, seasonOptionsQuery.data],
  )

  return {
    filters,
    setSearch,
    setFilter,
    resetFilters,
    hasActiveFilters,
    page,
    setPage,
    result: tournamentsQuery.data ?? EMPTY_RESULT,
    isLoading: tournamentsQuery.isPending,
    isError: tournamentsQuery.isError,
    options,
  }
}
