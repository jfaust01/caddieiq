'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchPlayerDetail } from '@/features/players/services/player-actions'
import type { PlayerDetail } from '@/features/players/types'

interface UsePlayerDetailResult {
  player: PlayerDetail | null
  isLoading: boolean
  /** True when the player id does not exist in the live database. */
  notFound: boolean
  /** True when the database could not be reached. */
  isError: boolean
}

/**
 * Loads a single player's detail record from the live database through the
 * `fetchPlayerDetail` server action (via TanStack Query — no fetching in
 * effects). Distinguishes "not found" (valid query, no such player) from a
 * database error so the view can render the appropriate state.
 */
export function usePlayerDetail(playerId: string): UsePlayerDetailResult {
  const query = useQuery({
    queryKey: ['player-detail', playerId],
    queryFn: async () => {
      const response = await fetchPlayerDetail(playerId)
      if (!response.ok) throw new Error(response.error)
      return response.data
    },
  })

  return {
    player: query.data ?? null,
    isLoading: query.isPending,
    notFound: query.isSuccess && query.data === null,
    isError: query.isError,
  }
}
