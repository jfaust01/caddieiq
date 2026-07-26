'use client'

import type { FieldEntrant } from '@/features/tournaments/types'
import type { DfsValueResult } from '@/lib/dfs-value'
import { formatPositionWithStatusPriority } from '@/features/tournaments/utils/format-position'

import { FantasyPlayerCell } from './fantasy-player-cell'
import { RoundDnaCell } from './round-dna-cell'
import { ScorecardCell } from './scorecard-cell'
import { AiIntelligenceCell, FantasyOutlookCell, MarketCell } from './premium-metric-cells'

/**
 * Enhanced COMPLETED (finished) row cells with combined premium metrics.
 * Displays: RESULT · PLAYER · TO PAR · ROUND DNA · AI INTELLIGENCE · FANTASY OUTLOOK · MARKET
 */
export function FantasyCompletedEnhancedRowCells({
  entrant,
  positionCountMap,
  onScorecardOpen,
  onRoundSelect,
  tournamentStatus = 'COMPLETED',
  dfsResult,
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
  onScorecardOpen?: (playerId: string) => void
  onRoundSelect?: (playerId: string, round: number) => void
  tournamentStatus?: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
  dfsResult?: DfsValueResult
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap ?? new Map())

  return (
    <>
      {/* RESULT */}
      <td className="border-r align-middle text-center" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
        <span className="text-sm font-medium tabular-nums text-white">{positionDisplay}</span>
      </td>

      {/* SCORECARD */}
      <td className="px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <ScorecardCell entrant={entrant} onOpen={onScorecardOpen} />
        </div>
      </td>

      {/* PLAYER */}
      <td className="px-2 sm:px-3 align-middle text-left">
        <FantasyPlayerCell entrant={entrant} />
      </td>

      {/* TO PAR */}
      <td className="border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-mono text-muted-foreground">
            {entrant.total != null ? entrant.total === 0 ? 'E' : (entrant.total > 0 ? '+' : '') + entrant.total : '—'}
          </span>
        </div>
      </td>

      {/* ROUND DNA */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <RoundDnaCell 
          round1RelToPar={entrant.round1RelToPar}
          round2RelToPar={entrant.round2RelToPar}
          round3RelToPar={entrant.round3RelToPar}
          round4RelToPar={entrant.round4RelToPar}
          playerId={entrant.playerId}
          tournamentStatus={tournamentStatus}
          onRoundClick={onRoundSelect}
        />
      </td>

      {/* AI INTELLIGENCE */}
      <AiIntelligenceCell entrant={entrant} />

      {/* FANTASY OUTLOOK */}
      <FantasyOutlookCell entrant={entrant} dfsResult={dfsResult} />

      {/* MARKET */}
      <MarketCell entrant={entrant} />
    </>
  )
}
