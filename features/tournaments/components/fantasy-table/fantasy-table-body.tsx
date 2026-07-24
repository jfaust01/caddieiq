'use client'

import type { FieldEntrant } from '@/features/tournaments/types'
import type { TablePhase } from '@/features/tournaments/config/phase-table-config'
import type { DfsValueResult } from '@/lib/dfs-value'
import { FantasyPlayerRow } from './fantasy-player-row'

interface FantasyTableBodyProps {
  entrants: FieldEntrant[]
  phase: TablePhase
  dfsByPlayer: Map<string, DfsValueResult>
  positionCountMap?: Map<number, number>
  onRowClick: (playerId: string) => void
}

/**
 * Table body that renders all player rows with phase-specific cell content.
 */
export function FantasyTableBody({
  entrants,
  phase,
  dfsByPlayer,
  positionCountMap,
  onRowClick,
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
          onRowClick={onRowClick}
        />
      ))}
    </tbody>
  )
}
