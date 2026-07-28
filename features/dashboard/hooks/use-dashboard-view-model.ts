'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { fetchTournaments } from '@/features/tournaments/services/tournament-actions'
import type { TournamentSummary } from '@/features/tournaments/types'

/**
 * Dashboard View Model
 *
 * Fetches and normalizes all data required for the premium DFS command center.
 * Focuses on real data only - no fabricated values. Gracefully handles missing
 * providers by returning empty states that the UI can render appropriately.
 */
export interface DashboardData {
  // Tournament data
  liveTournament: TournamentSummary | null
  upcomingTournament: TournamentSummary | null
  completedTournament: TournamentSummary | null

  // Metadata
  isLoading: boolean
  hasError: boolean
  lastRefreshTime: string
}

export function useDashboardViewModel(): DashboardData {
  // Fetch all tournaments regardless of status
  const tournamentsQuery = useQuery({
    queryKey: ['dashboard-tournaments'],
    queryFn: async () => {
      // Fetch tournaments from all statuses
      const allTournaments: TournamentSummary[] = []

      // Fetch ACTIVE tournaments
      const activeResponse = await fetchTournaments({
        filters: { search: '', status: 'ACTIVE', tour: 'ALL', season: 'ALL' },
        page: 1,
        pageSize: 1,
      })

      if (activeResponse.ok && activeResponse.data.items.length > 0) {
        allTournaments.push(...activeResponse.data.items)
      }

      // Fetch SCHEDULED tournaments (upcoming)
      const scheduledResponse = await fetchTournaments({
        filters: { search: '', status: 'SCHEDULED', tour: 'ALL', season: 'ALL' },
        page: 1,
        pageSize: 1,
      })

      if (scheduledResponse.ok && scheduledResponse.data.items.length > 0) {
        allTournaments.push(...scheduledResponse.data.items)
      }

      // Fetch COMPLETED tournaments (most recent first)
      const completedResponse = await fetchTournaments({
        filters: { search: '', status: 'COMPLETED', tour: 'ALL', season: 'ALL' },
        page: 1,
        pageSize: 1,
      })

      if (completedResponse.ok && completedResponse.data.items.length > 0) {
        allTournaments.push(...completedResponse.data.items)
      }

      return allTournaments
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })

  // Organize tournaments by status
  const dashboardData = useMemo<DashboardData>(() => {
    const tournaments = tournamentsQuery.data || []

    return {
      liveTournament: tournaments.find((t) => t.status === 'ACTIVE') || null,
      upcomingTournament: tournaments.find((t) => t.status === 'SCHEDULED') || null,
      completedTournament: tournaments.find((t) => t.status === 'COMPLETED') || null,
      isLoading: tournamentsQuery.isPending,
      hasError: tournamentsQuery.isError,
      lastRefreshTime: new Date().toISOString(),
    }
  }, [tournamentsQuery.data, tournamentsQuery.isPending, tournamentsQuery.isError])

  return dashboardData
}
