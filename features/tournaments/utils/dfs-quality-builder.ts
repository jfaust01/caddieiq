import { DfsDataQuality, buildDfsDataQuality } from '@/features/tournaments/types/dfs-quality'
import type { TournamentField } from '@/features/tournaments/types'

/**
 * Build DFS data quality from tournament field and DFS field data.
 * Single point of calculation for all DFS quality metrics.
 */
export function buildDfsQualityFromData(
  tournamentField: TournamentField | null,
  dfsField: any | null
): DfsDataQuality {
  if (!tournamentField || !dfsField) {
    return buildDfsDataQuality(0, [], [], new Date().toISOString())
  }

  const fieldPlayers = tournamentField.entrants || []
  const fieldPlayerIds = new Set(fieldPlayers.map(e => e.playerId))

  // Get DFS players from the DFS field object
  // dfsField.players contains all field entrants (74)
  // We need to determine which ones actually have salary records
  // For now, use pricedPlayers which should indicate players with actual prices
  const dfsSalaryCount = dfsField.pricedPlayers ?? 0

  // Find unmatched players
  // The DFS field should provide info about which players are unmatched
  const unmatchedPlayers: Array<{ playerId: string; playerName: string }> = []
  
  // If dfsField has unmatched info, use it, otherwise derive it
  if (dfsField.unmatchedPlayers && Array.isArray(dfsField.unmatchedPlayers)) {
    unmatchedPlayers.push(...dfsField.unmatchedPlayers)
  }

  return buildDfsDataQuality(
    fieldPlayers.length,
    Array.from({ length: dfsSalaryCount }, (_, i) => ({ playerId: `dfs-${i}` })),
    unmatchedPlayers,
    new Date().toISOString()
  )
}
