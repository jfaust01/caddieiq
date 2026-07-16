'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchPlayerOdds } from '@/features/players/services/player-actions'
import type { PlayerOddsView } from '@/lib/odds-intelligence'

interface UsePlayerOddsResult {
  odds: PlayerOddsView | null
  isLoading: boolean
  /** True when the odds engine could not be reached (database error). */
  isError: boolean
}

/**
 * Loads a player's Odds Intelligence through the `fetchPlayerOdds` server action
 * (via TanStack Query — no fetching in effects). A successful response with a
 * `null` payload means the player simply has no verified market yet, which the
 * card renders as an honest placeholder rather than an error.
 */
export function usePlayerOdds(playerId: string): UsePlayerOddsResult {
  const query = useQuery({
    queryKey: ['player-odds', playerId],
    queryFn: async () => {
      const response = await fetchPlayerOdds(playerId)
      if (!response.ok) throw new Error(response.error)
      return response.data
    },
  })

  return {
    odds: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
  }
}
