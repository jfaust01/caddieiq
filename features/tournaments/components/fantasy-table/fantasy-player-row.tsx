'use client'

import { cn } from '@/lib/utils'
import type { FieldEntrant } from '@/features/tournaments/types'
import type { TablePhase } from '@/features/tournaments/config/phase-table-config'
import type { DfsValueResult } from '@/lib/dfs-value'
import { FantasyRowCells } from './fantasy-row-cells'
import { ScoreLiveRowCells } from './score-live-row-cells'
import { ScoringRowCells } from './scoring-row-cells'

interface FantasyPlayerRowProps {
  entrant: FieldEntrant
  phase: TablePhase
  index: number
  dfsResult?: DfsValueResult
  positionCountMap?: Map<number, number>
  onRowClick: (playerId: string) => void
}

/**
 * Individual player row that renders different cells based on phase.
 * Handles click events to open scorecard modal.
 */
export function FantasyPlayerRow({
  entrant,
  phase,
  index,
  dfsResult,
  positionCountMap,
  onRowClick,
}: FantasyPlayerRowProps) {
  const isScheduled = phase === 'scheduled'

  return (
    <tr
      onClick={(event) => {
        const target = event.target as HTMLElement
        const interactiveElement = target.closest(
          'button, a, input, select, textarea, [data-prevent-row-click]',
        )
        if (interactiveElement) return
        onRowClick(entrant.playerId)
      }}
      role="button"
      tabIndex={0}
      className="h-[68px] border-b border-white/[0.045] bg-transparent transition-colors duration-100 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/[0.2]"
      style={{ cursor: 'pointer' }}
    >
      {isScheduled ? (
        <FantasyRowCells entrant={entrant} dfsResult={dfsResult} rank={index + 1} />
      ) : phase === 'live' ? (
        <ScoreLiveRowCells entrant={entrant} positionCountMap={positionCountMap} />
      ) : (
        <ScoringRowCells entrant={entrant} positionCountMap={positionCountMap} />
      )}
    </tr>
  )
}
