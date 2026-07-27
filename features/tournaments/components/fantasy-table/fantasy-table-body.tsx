'use client'

import type { FieldEntrant } from '@/features/tournaments/types'
import type { TablePhase } from '@/features/tournaments/config/phase-table-config'
import type { DfsValueResult } from '@/lib/dfs-value'
import { FantasyPlayerRow } from './fantasy-player-row'

interface FantasyTableBodyProps {
  entrants: FieldEntrant[]
  phase: TablePhase
  dfsByPlayer: Map<string, DfsValueResult>
  tournammentId?: string
  favoriteIds: Set<string>
  positionCountMap?: Map<number, number>
  onRowClick: (playerId: string) => void
  onToggleFavorite: (playerId: string) => void
  onRoundSelect?: (playerId: string, round: number) => void
  selectedRound?: number
}

/**
 * Table body that renders all player rows with phase-specific cell content.
 */
export function FantasyTableBody({
  entrants,
  phase,
  dfsByPlayer,
  tournammentId,
  favoriteIds,
  positionCountMap,
  onRowClick,
  onToggleFavorite,
  onRoundSelect,
  selectedRound = 1,
}: FantasyTableBodyProps) {
  return (
    <tbody>
      {entrants.map((entrant, index) => (
        <FantasyPlayerRow
          key={entrant.playerId}
          entrant={entrant}
          phase={phase}
          index={index}
          dfsResult={dfsByPlayer.get(entrant.playerId)}
          positionCountMap={positionCountMap}
          tournamentId={tournammentId}
          isFavorite={favoriteIds.has(entrant.playerId)}
          onRowClick={onRowClick}
          onToggleFavorite={onToggleFavorite}
          onRoundSelect={onRoundSelect}
          selectedRound={selectedRound}
        />
      ))}
    </tbody>
  )
}
