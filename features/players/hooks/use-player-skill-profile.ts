'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchPlayerSkillProfile } from '@/features/players/services/player-actions'
import type { PlayerSkillProfile } from '@/lib/player-skill-intelligence'

interface UsePlayerSkillProfileResult {
  profile: PlayerSkillProfile | null
  isLoading: boolean
  /** True when the skill engine could not be reached (database error). */
  isError: boolean
}

/**
 * Loads a player's Player Skill Intelligence profile — the fifth Signal Family —
 * through the `fetchPlayerSkillProfile` server action (via TanStack Query, no
 * fetching in effects). A successful response always carries a profile; when no
 * round statistics are held it comes back with `status: "unavailable"` and every
 * skill Unknown, which the card renders as an honest coverage gap rather than an
 * error.
 */
export function usePlayerSkillProfile(playerId: string): UsePlayerSkillProfileResult {
  const query = useQuery({
    queryKey: ['player-skill-profile', playerId],
    queryFn: async () => {
      const response = await fetchPlayerSkillProfile(playerId)
      if (!response.ok) throw new Error(response.error)
      return response.data
    },
  })

  return {
    profile: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
  }
}
