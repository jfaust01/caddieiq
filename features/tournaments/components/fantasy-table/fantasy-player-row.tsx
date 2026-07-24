'use client'

import { cn } from '@/lib/utils'
import type { FieldEntrant } from '@/features/tournaments/types'
import type { TablePhase } from '@/features/tournaments/config/phase-table-config'
import type { DfsValueResult } from '@/lib/dfs-value'
import { FantasyRowCells } from './fantasy-row-cells'
import { ScoreLiveRowCells } from './score-live-row-cells'
import { FantasyLiveEnhancedRowCells } from './fantasy-live-enhanced-row-cells'
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onRowClick(entrant.playerId)
    }
  }

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
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="h-[68px] border-b transition-colors duration-150 bg-[#0D1117] hover:bg-[#0F1419] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/50"
      style={{ 
        cursor: 'pointer',
        borderColor: 'rgba(130, 155, 168, 0.12)',
      }}
    >
      {isScheduled ? (
        <FantasyRowCells entrant={entrant} dfsResult={dfsResult} rank={index + 1} />
      ) : phase === 'live' ? (
        <FantasyLiveEnhancedRowCells entrant={entrant} positionCountMap={positionCountMap} />
      ) : (
        <ScoringRowCells entrant={entrant} positionCountMap={positionCountMap} />
      )}
    </tr>
  )
}
