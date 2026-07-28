'use client'

import type { FieldEntrant } from '@/features/tournaments/types'
import type { DfsValueResult } from '@/lib/dfs-value'
import { formatPositionWithStatusPriority } from '@/features/tournaments/utils/format-position'

import { FantasyPlayerCell } from './fantasy-player-cell'
import { RoundDnaCompact } from './round-dna-compact'
import { FavoriteCell } from './favorite-cell'
import { ScorecardCell } from './scorecard-cell'
import { AiRatingCell, RecentFormCell, SalaryCell, DkScoreCell, DkValuePerDollarCell, OwnershipCell, MarketCell } from './premium-metric-cells'

/**
 * Enhanced COMPLETED (finished) row cells with combined premium metrics and compact round DNA.
 * Displays: RESULT · PLAYER · TO PAR · ROUND DNA (one round) · AI INTELLIGENCE · FANTASY OUTLOOK · MARKET
 */
export function FantasyCompletedEnhancedRowCells({
  entrant,
  positionCountMap,
  tournamentId,
  onScorecardOpen,
  onRoundSelect,
  onToggleFavorite,
  isFavorite,
  tournamentStatus = 'COMPLETED',
  dfsResult,
  selectedRound = 1,
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
  tournamentId?: string
  onScorecardOpen?: (playerId: string) => void
  onRoundSelect?: (playerId: string, round: number) => void
  onToggleFavorite?: (playerId: string) => void
  isFavorite?: boolean
  tournamentStatus?: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
  dfsResult?: DfsValueResult
  selectedRound?: number
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap ?? new Map())

  return (
    <>
      {/* RESULT */}
      <td className="border-r align-middle text-center" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
        <span className="text-sm font-medium tabular-nums text-white">{positionDisplay}</span>
      </td>

      {/* FAVORITES */}
      <td className="border-l border-r border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <FavoriteCell
            playerId={entrant.playerId}
            isFavorite={isFavorite ?? false}
            onToggle={onToggleFavorite ?? (() => {})}
          />
        </div>
      </td>

      {/* PLAYER */}
      <td className="px-2 sm:px-3 py-[10px] align-middle text-left">
        <FantasyPlayerCell entrant={entrant} />
      </td>

      {/* TO PAR */}
      <td className="border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-lg font-semibold font-mono tabular-nums" style={{color: entrant.total !== null && entrant.total !== undefined ? (entrant.total < 0 ? '#10b981' : entrant.total > 0 ? '#ef4444' : '#9ca3af') : '#9ca3af'}}>
            {entrant.total != null ? entrant.total === 0 ? 'E' : (entrant.total > 0 ? '+' : '') + entrant.total : '—'}
          </span>
        </div>
      </td>

      {/* SCORECARD */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <ScorecardCell entrant={entrant} onOpen={onScorecardOpen} />
        </div>
      </td>

      {/* ROUND DNA */}
      <td 
        className="border-l border-white/[0.055] px-[8px] align-middle w-[400px]"
      >
        <RoundDnaCompact 
          round1RelToPar={entrant.round1RelToPar}
          round2RelToPar={entrant.round2RelToPar}
          round3RelToPar={entrant.round3RelToPar}
          round4RelToPar={entrant.round4RelToPar}
          playerId={entrant.playerId}
          tournamentId={tournamentId}
          tournamentStatus={tournamentStatus}
          selectedRound={selectedRound}
          onRoundClick={onRoundSelect}
          skillLevel={entrant.rankingScore}
        />
      </td>

      {/* AI RATING */}
      <AiRatingCell entrant={entrant} />

      {/* RECENT FORM */}
      <RecentFormCell entrant={entrant} />

      {/* SALARY */}
      <SalaryCell entrant={entrant} />

      {/* DK SCORE */}
      <DkScoreCell entrant={entrant} />

      {/* DK VALUE PER DOLLAR */}
      <DkValuePerDollarCell entrant={entrant} />

      {/* OWNERSHIP */}
      <OwnershipCell entrant={entrant} />

      {/* MARKET */}
      <MarketCell entrant={entrant} />
    </>
  )
}
