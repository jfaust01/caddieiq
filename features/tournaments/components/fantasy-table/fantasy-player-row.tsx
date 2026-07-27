'use client'

import { cn } from '@/lib/utils'
import type { FieldEntrant } from '@/features/tournaments/types'
import type { TablePhase } from '@/features/tournaments/config/phase-table-config'
import type { DfsValueResult } from '@/lib/dfs-value'
import { FantasyRowCells } from './fantasy-row-cells'
import { ScoreLiveRowCells } from './score-live-row-cells'
import { FantasyLiveEnhancedRowCells } from './fantasy-live-enhanced-row-cells'
import { FantasyCompletedEnhancedRowCells } from './fantasy-completed-enhanced-row-cells'
import { ScoringRowCells } from './scoring-row-cells'

interface FantasyPlayerRowProps {
  entrant: FieldEntrant
  phase: TablePhase
  index: number
  dfsResult?: DfsValueResult
  tournamentId?: string
  positionCountMap?: Map<number, number>
  isFavorite?: boolean
  onRowClick: (playerId: string) => void
  onToggleFavorite?: (playerId: string) => void
  onRoundSelect?: (playerId: string, round: number) => void
  selectedRound?: number
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
  tournamentId,
  positionCountMap,
  isFavorite,
  onRowClick,
  onToggleFavorite,
  onRoundSelect,
  selectedRound = 1,
}: FantasyPlayerRowProps) {
  const isScheduled = phase === 'scheduled'

  return (
    <tr
      className="border-b transition-colors duration-150 bg-[#0D1117] hover:bg-[#0F1419]"
      style={{ 
        borderColor: 'rgba(130, 155, 168, 0.12)',
      }}
    >
      {isScheduled ? (
        <FantasyRowCells entrant={entrant} dfsResult={dfsResult} rank={index + 1} onScorecardOpen={onRowClick} />
      ) : phase === 'live' ? (
        <FantasyLiveEnhancedRowCells entrant={entrant} positionCountMap={positionCountMap} tournamentId={tournamentId} onScorecardOpen={onRowClick} onRoundSelect={onRoundSelect} onToggleFavorite={onToggleFavorite} isFavorite={isFavorite} dfsResult={dfsResult} selectedRound={selectedRound} />
      ) : (
        <FantasyCompletedEnhancedRowCells entrant={entrant} positionCountMap={positionCountMap} tournamentId={tournamentId} onScorecardOpen={onRowClick} onRoundSelect={onRoundSelect} onToggleFavorite={onToggleFavorite} isFavorite={isFavorite} dfsResult={dfsResult} selectedRound={selectedRound} />
      )}
    </tr>
  )
}
