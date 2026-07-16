import 'server-only'

import { playerService } from '@/features/players/services/player-service'
import { DEFAULT_PLAYER_FILTERS } from '@/features/players/hooks/use-players'
import { tournamentService } from '@/features/tournaments/services/tournament-service'
import { DEFAULT_TOURNAMENT_FILTERS } from '@/features/tournaments/hooks/use-tournaments'

/** A pickable entity in the debug view. */
export interface EntityOption {
  id: string
  label: string
}

/**
 * Top-ranked players for the player entity picker. Ordered by the service's
 * default ranking so the most relevant subjects surface first. Failures return
 * an empty list — the debug view degrades to a manual ID entry.
 */
export async function loadPlayerOptions(limit = 100): Promise<EntityOption[]> {
  try {
    const { items } = await playerService.getPlayers({
      filters: { ...DEFAULT_PLAYER_FILTERS, rankingBand: 'TOP_100' },
      page: 1,
      pageSize: limit,
    })
    return items.map((p) => ({
      id: p.id,
      label: p.worldRanking ? `${p.fullName} (#${p.worldRanking})` : p.fullName,
    }))
  } catch {
    return []
  }
}

/**
 * Tournaments for the tournament entity picker, newest first. Failures return
 * an empty list — the debug view degrades to a manual ID entry.
 */
export async function loadTournamentOptions(limit = 100): Promise<EntityOption[]> {
  try {
    const { items } = await tournamentService.getTournaments({
      filters: { ...DEFAULT_TOURNAMENT_FILTERS },
      page: 1,
      pageSize: limit,
    })
    return items.map((t) => ({
      id: t.id,
      label: t.season ? `${t.name} (${t.season})` : t.name,
    }))
  } catch {
    return []
  }
}
