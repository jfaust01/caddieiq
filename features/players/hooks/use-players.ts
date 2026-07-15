'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import {
  fetchNationalityOptions,
  fetchPlayers,
  fetchTourFilterAvailable,
} from '@/features/players/services/player-actions'
import type {
  FilterOption,
  Handedness,
  PaginatedResult,
  Player,
  PlayerFilters,
  PlayerQuery,
  PlayerStatus,
  RankingBand,
  Tour,
  ViewMode,
} from '@/features/players/types'

export const PLAYERS_PAGE_SIZE = 9

export const DEFAULT_PLAYER_FILTERS: PlayerFilters = {
  search: '',
  tour: 'ALL',
  nationality: 'ALL',
  rankingBand: 'ALL',
  handedness: 'ALL',
  status: 'ALL',
}

const TOUR_OPTIONS: FilterOption<Tour | 'ALL'>[] = [
  { value: 'ALL', label: 'All tours' },
  { value: 'PGA', label: 'PGA Tour' },
  { value: 'DP_WORLD', label: 'DP World Tour' },
  { value: 'LIV', label: 'LIV Golf' },
  { value: 'KORN_FERRY', label: 'Korn Ferry Tour' },
  { value: 'CHAMPIONS', label: 'PGA Tour Champions' },
]

const RANKING_BAND_OPTIONS: FilterOption<RankingBand>[] = [
  { value: 'ALL', label: 'Any ranking' },
  { value: 'TOP_10', label: 'Top 10' },
  { value: 'TOP_25', label: 'Top 25' },
  { value: 'TOP_50', label: 'Top 50' },
  { value: 'TOP_100', label: 'Top 100' },
]

const HANDEDNESS_OPTIONS: FilterOption<Handedness | 'ALL'>[] = [
  { value: 'ALL', label: 'Any hand' },
  { value: 'RIGHT', label: 'Right-handed' },
  { value: 'LEFT', label: 'Left-handed' },
]

const STATUS_OPTIONS: FilterOption<PlayerStatus | 'ALL'>[] = [
  { value: 'ALL', label: 'Any status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INJURED', label: 'Injured' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const DEFAULT_NATIONALITY_OPTIONS: FilterOption[] = [
  { value: 'ALL', label: 'All nationalities' },
]

const EMPTY_RESULT: PaginatedResult<Player> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: PLAYERS_PAGE_SIZE,
  totalPages: 1,
}

export interface UsePlayersResult {
  filters: PlayerFilters
  setSearch: (value: string) => void
  setFilter: <K extends keyof PlayerFilters>(
    key: K,
    value: PlayerFilters[K],
  ) => void
  resetFilters: () => void
  hasActiveFilters: boolean
  page: number
  setPage: (page: number) => void
  view: ViewMode
  setView: (view: ViewMode) => void
  result: PaginatedResult<Player>
  isLoading: boolean
  isError: boolean
  /**
   * Whether the tour filter is usable. False when the live data lacks tour
   * classification (imported players); the control is disabled in that case.
   */
  tourFilterEnabled: boolean
  options: {
    tour: FilterOption<Tour | 'ALL'>[]
    nationality: FilterOption[]
    rankingBand: FilterOption<RankingBand>[]
    handedness: FilterOption<Handedness | 'ALL'>[]
    status: FilterOption<PlayerStatus | 'ALL'>[]
  }
}

/**
 * Client controller for the player directory: search, filters, pagination, and
 * view mode over the *live* player data.
 *
 * Data is fetched through the `fetchPlayers` server action via TanStack Query
 * (no fetching in effects). Previous pages are kept in place while the next
 * query resolves so pagination and filtering stay smooth, and query errors are
 * surfaced so the directory can render a database-error state.
 */
export function usePlayers(): UsePlayersResult {
  const [filters, setFilters] = useState<PlayerFilters>(DEFAULT_PLAYER_FILTERS)
  const [page, setPage] = useState(1)
  const [view, setView] = useState<ViewMode>('grid')

  const tourAvailabilityQuery = useQuery({
    queryKey: ['player-tour-filter-available'],
    queryFn: async () => {
      const response = await fetchTourFilterAvailable()
      if (!response.ok) throw new Error(response.error)
      return response.data
    },
  })

  // Default to disabled until confirmed available, so we never filter on tour
  // data that doesn't meaningfully exist.
  const tourFilterEnabled = tourAvailabilityQuery.data ?? false

  // When the tour filter is unavailable, force it to "ALL" in the query the
  // server sees — the control is disabled, but this guarantees correct results
  // even if stale state carries a tour value.
  const query = useMemo<PlayerQuery>(
    () => ({
      filters: tourFilterEnabled ? filters : { ...filters, tour: 'ALL' },
      page,
      pageSize: PLAYERS_PAGE_SIZE,
    }),
    [filters, page, tourFilterEnabled],
  )

  const playersQuery = useQuery({
    queryKey: ['players', query],
    queryFn: async () => {
      const response = await fetchPlayers(query)
      if (!response.ok) throw new Error(response.error)
      return response.data
    },
    placeholderData: keepPreviousData,
  })

  const nationalityQuery = useQuery({
    queryKey: ['player-nationality-options'],
    queryFn: async () => {
      const response = await fetchNationalityOptions()
      if (!response.ok) throw new Error(response.error)
      return response.data
    },
  })

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
    setPage(1)
  }, [])

  const setFilter = useCallback(
    <K extends keyof PlayerFilters>(key: K, value: PlayerFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    },
    [],
  )

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_PLAYER_FILTERS)
    setPage(1)
  }, [])

  const hasActiveFilters = useMemo(
    () =>
      filters.search.trim() !== '' ||
      filters.tour !== 'ALL' ||
      filters.nationality !== 'ALL' ||
      filters.rankingBand !== 'ALL' ||
      filters.handedness !== 'ALL' ||
      filters.status !== 'ALL',
    [filters],
  )

  const options = useMemo(
    () => ({
      tour: TOUR_OPTIONS,
      nationality: nationalityQuery.data ?? DEFAULT_NATIONALITY_OPTIONS,
      rankingBand: RANKING_BAND_OPTIONS,
      handedness: HANDEDNESS_OPTIONS,
      status: STATUS_OPTIONS,
    }),
    [nationalityQuery.data],
  )

  return {
    filters,
    setSearch,
    setFilter,
    resetFilters,
    hasActiveFilters,
    page,
    setPage,
    view,
    setView,
    result: playersQuery.data ?? EMPTY_RESULT,
    isLoading: playersQuery.isPending,
    isError: playersQuery.isError,
    tourFilterEnabled,
    options,
  }
}
