'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { getRankingDefinition, type RankingType } from '@/lib/ranking'
import { tourLabel } from '@/features/players/utils/format'

import { buildInsights, getRankingView } from '../services/rankings-service'
import type {
  FilterOption,
  RankingFiltersState,
  RankingInsight,
  RankingRow,
  RankingSummary,
} from '../types'

export const DEFAULT_RANKING_FILTERS: RankingFiltersState = {
  search: '',
  tour: 'ALL',
  nationality: 'ALL',
  minEvents: 0,
  form: 'ALL',
  favoritesOnly: false,
}

/** Static minimum-events choices for the filter control. */
export const MIN_EVENTS_OPTIONS: FilterOption[] = [
  { value: '0', label: 'Any events' },
  { value: '18', label: '18+ events' },
  { value: '20', label: '20+ events' },
  { value: '22', label: '22+ events' },
]

export const FORM_OPTIONS: FilterOption[] = [
  { value: 'ALL', label: 'Any form' },
  { value: 'HOT', label: 'Hot (75+)' },
  { value: 'STEADY', label: 'Steady (50–74)' },
  { value: 'COLD', label: 'Cold (<50)' },
]

/** Placeholder tournament context surfaced in the summary bar. */
const CURRENT_TOURNAMENT = 'The Open Championship'

function matchesForm(row: RankingRow, form: RankingFiltersState['form']): boolean {
  const score = row.moduleScores.recentForm
  switch (form) {
    case 'HOT':
      return score >= 75
    case 'STEADY':
      return score >= 50 && score < 75
    case 'COLD':
      return score < 50
    case 'ALL':
    default:
      return true
  }
}

export interface UseRankingsResult {
  type: RankingType
  isLoading: boolean
  /** Unfiltered, enriched rows (used for insights + options). */
  allRows: RankingRow[]
  /** Rows after search + filters are applied. */
  rows: RankingRow[]
  filters: RankingFiltersState
  setSearch: (value: string) => void
  setFilter: <K extends keyof RankingFiltersState>(
    key: K,
    value: RankingFiltersState[K],
  ) => void
  resetFilters: () => void
  hasActiveFilters: boolean
  favorites: Set<string>
  toggleFavorite: (playerId: string) => void
  isFavorite: (playerId: string) => boolean
  selectedPlayerId: string | null
  selectPlayer: (playerId: string | null) => void
  selectedRow: RankingRow | null
  insights: RankingInsight[]
  summary: RankingSummary
  options: {
    tour: FilterOption[]
    nationality: FilterOption[]
    minEvents: FilterOption[]
    form: FilterOption[]
  }
}

/**
 * Client controller for the Rankings Experience: loads the enriched view for a
 * ranking type, then handles search, filters, favorites, and selection.
 *
 * The short simulated latency exercises the loading/skeleton states while the
 * data is still mock.
 * TODO(data): swap the simulated latency for real fetching (SWR / server data)
 * once the live rankings API is connected.
 */
export function useRankings(type: RankingType): UseRankingsResult {
  const [allRows, setAllRows] = useState<RankingRow[]>([])
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<RankingFiltersState>(
    DEFAULT_RANKING_FILTERS,
  )
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    // Reset filters/selection when switching ranking type.
    setFilters(DEFAULT_RANKING_FILTERS)
    setSelectedPlayerId(null)

    const timeout = setTimeout(() => {
      void getRankingView(type).then((view) => {
        if (!active) return
        setAllRows(view.results)
        setGeneratedAt(view.generatedAt)
        setIsLoading(false)
      })
    }, 350)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [type])

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
  }, [])

  const setFilter = useCallback(
    <K extends keyof RankingFiltersState>(
      key: K,
      value: RankingFiltersState[K],
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_RANKING_FILTERS)
  }, [])

  const toggleFavorite = useCallback((playerId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (playerId: string) => favorites.has(playerId),
    [favorites],
  )

  const selectPlayer = useCallback((playerId: string | null) => {
    setSelectedPlayerId(playerId)
  }, [])

  const rows = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    return allRows.filter((row) => {
      if (query && !row.name.toLowerCase().includes(query)) return false
      if (filters.tour !== 'ALL' && row.tour !== filters.tour) return false
      if (
        filters.nationality !== 'ALL' &&
        row.nationality.code !== filters.nationality
      ) {
        return false
      }
      if (row.events < filters.minEvents) return false
      if (!matchesForm(row, filters.form)) return false
      if (filters.favoritesOnly && !favorites.has(row.playerId)) return false
      return true
    })
  }, [allRows, filters, favorites])

  const hasActiveFilters = useMemo(
    () =>
      filters.search.trim() !== '' ||
      filters.tour !== 'ALL' ||
      filters.nationality !== 'ALL' ||
      filters.minEvents > 0 ||
      filters.form !== 'ALL' ||
      filters.favoritesOnly,
    [filters],
  )

  const insights = useMemo(() => buildInsights(allRows), [allRows])

  const selectedRow = useMemo(
    () => allRows.find((row) => row.playerId === selectedPlayerId) ?? null,
    [allRows, selectedPlayerId],
  )

  const options = useMemo(() => {
    const tours = new Map<string, string>()
    const nationalities = new Map<string, string>()
    for (const row of allRows) {
      tours.set(row.tour, tourLabel(row.tour))
      nationalities.set(row.nationality.code, row.nationality.name)
    }
    return {
      tour: [
        { value: 'ALL', label: 'All tours' },
        ...[...tours.entries()].map(([value, label]) => ({ value, label })),
      ],
      nationality: [
        { value: 'ALL', label: 'All countries' },
        ...[...nationalities.entries()]
          .sort((a, b) => a[1].localeCompare(b[1]))
          .map(([value, label]) => ({ value, label })),
      ],
      minEvents: MIN_EVENTS_OPTIONS,
      form: FORM_OPTIONS,
    }
  }, [allRows])

  const summary = useMemo<RankingSummary>(
    () => ({
      tournamentLabel: CURRENT_TOURNAMENT,
      typeLabel: getRankingDefinition(type).label,
      playersRanked: allRows.length,
      lastUpdatedLabel: generatedAt
        ? 'Updated just now'
        : 'Awaiting first run',
    }),
    [type, allRows.length, generatedAt],
  )

  return {
    type,
    isLoading,
    allRows,
    rows,
    filters,
    setSearch,
    setFilter,
    resetFilters,
    hasActiveFilters,
    favorites,
    toggleFavorite,
    isFavorite,
    selectedPlayerId,
    selectPlayer,
    selectedRow,
    insights,
    summary,
    options,
  }
}
