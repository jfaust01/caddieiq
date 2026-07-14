'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { playerService } from '@/features/players/services/player-service'
import type {
  FilterOption,
  Handedness,
  PaginatedResult,
  Player,
  PlayerFilters,
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
  options: {
    tour: FilterOption<Tour | 'ALL'>[]
    nationality: FilterOption[]
    rankingBand: FilterOption<RankingBand>[]
    handedness: FilterOption<Handedness | 'ALL'>[]
    status: FilterOption<PlayerStatus | 'ALL'>[]
  }
}

/**
 * Client-side controller for the player directory: search, filters, pagination,
 * and view mode over the placeholder `PlayerService`.
 *
 * The short simulated latency exists so loading/skeleton states are exercised
 * while the data is still mock.
 * TODO(data): replace the simulated latency with real data fetching (SWR /
 * TanStack Query) once the live PlayerService is connected.
 */
export function usePlayers(): UsePlayersResult {
  const [filters, setFilters] = useState<PlayerFilters>(DEFAULT_PLAYER_FILTERS)
  const [page, setPage] = useState(1)
  const [view, setView] = useState<ViewMode>('grid')
  const [isLoading, setIsLoading] = useState(true)

  const query = useMemo(
    () => ({ filters, page, pageSize: PLAYERS_PAGE_SIZE }),
    [filters, page],
  )

  const result = useMemo(() => playerService.getPlayers(query), [query])

  useEffect(() => {
    setIsLoading(true)
    const timeout = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timeout)
  }, [query])

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
      tour: playerService.getTourOptions(),
      nationality: playerService.getNationalityOptions(),
      rankingBand: RANKING_BAND_OPTIONS,
      handedness: HANDEDNESS_OPTIONS,
      status: STATUS_OPTIONS,
    }),
    [],
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
    result,
    isLoading,
    options,
  }
}
