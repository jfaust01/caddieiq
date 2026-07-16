'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchPlayerDfsValue } from '@/features/players/services/player-actions'
import type { PlayerDfsValue } from '@/lib/dfs-value'

interface UsePlayerDfsValueResult {
  value: PlayerDfsValue | null
  isLoading: boolean
  /** True when the DFS Value service could not be reached (database error). */
  isError: boolean
}

/**
 * Loads a player's DFS Value — the flagship composite model — through the
 * `fetchPlayerDfsValue` server action (via TanStack Query, no fetching in
 * effects). The model fuses every Signal Family with the player's real
 * DraftKings salary, ranked within their current event's field. A `null` value
 * means the player is not in an active field (an honest "no active event" state,
 * not an error); a thrown response means the service itself was unreachable.
 */
export function usePlayerDfsValue(playerId: string): UsePlayerDfsValueResult {
  const query = useQuery({
    queryKey: ['player-dfs-value', playerId],
    queryFn: async () => {
      const response = await fetchPlayerDfsValue(playerId)
      if (!response.ok) throw new Error(response.error)
      return response.data
    },
  })

  return {
    value: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
  }
}
