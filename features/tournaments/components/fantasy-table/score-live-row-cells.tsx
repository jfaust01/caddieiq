'use client'

import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import { TournamentScoreCell } from '@/features/tournaments/components/tournament-score-cell'
import type { FieldEntrant } from '@/features/tournaments/types'
import { formatPositionWithStatusPriority } from '@/features/tournaments/utils/format-position'

import { FantasyPlayerCell } from './fantasy-player-cell'
import { MetricEmptyState } from './metric-empty-state'
import {
  formatMissing,
  formatDraftedPercent,
} from './helpers'

/**
 * Live (in-progress) row cells: pos · player · live DK · total · through ·
 * today · salary · drafted % · odds. Real-time fantasy tracking with mobile-first
 * priority: first four columns visible, rest via horizontal scroll.
 */
export function ScoreLiveRowCells({
  entrant,
  positionCountMap,
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap ?? new Map())
  const salaryDisplay = formatMissing(entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null)
  const oddsDisplay = formatMissing(entrant.oddsToWin)
  const draftedDisplay = formatDraftedPercent(entrant.ownershipPercent)
  const todayDisplay = entrant.roundScore == null ? '—' : entrant.roundScore === 0 ? 'E' : entrant.roundScore > 0 ? `+${entrant.roundScore}` : entrant.roundScore

  return (
    <>
      {/* POS */}
      <td className="w-[54px] sm:w-[64px] min-w-[54px] sm:min-w-[64px] px-1 sm:px-2 align-middle text-center border-r" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
        <span className="text-sm font-medium tabular-nums text-white">{positionDisplay}</span>
      </td>

      {/* PLAYER */}
      <td className="w-[calc(100vw-256px)] min-w-[190px] max-w-[240px] sm:w-[300px] sm:min-w-[260px] sm:max-w-none px-2 sm:px-3 align-middle text-left">
        <FantasyPlayerCell entrant={entrant} />
      </td>

      {/* LIVE DK */}
      <td className="w-[120px] min-w-[120px] max-w-[120px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          {entrant.totalDkFantasyPoints == null ? (
            <MetricEmptyState />
          ) : (
            <span className="text-sm font-semibold tabular-nums text-white">{entrant.totalDkFantasyPoints}</span>
          )}
        </div>
      </td>

      {/* TOTAL */}
      <td className="w-[92px] min-w-[92px] max-w-[92px] px-1 sm:px-2 align-middle bg-white/[0.012] border-x border-white/[0.035]">
        <TournamentScoreCell
          primary={entrant.totalStrokes ?? 'E'}
          secondary={entrant.total ?? undefined}
          dkPoints={entrant.dkFantasyPoints}
        />
      </td>

      {/* THRU */}
      <td className="w-[76px] min-w-[76px] max-w-[76px] px-1 sm:px-2 align-middle">
        <div className="flex h-full flex-col items-center justify-center leading-tight">
          <span className="text-sm font-semibold tabular-nums text-foreground">{entrant.thruHole ?? '—'}</span>
        </div>
      </td>

      {/* TODAY */}
      <td className="w-[76px] min-w-[76px] max-w-[76px] border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-semibold tabular-nums text-foreground">{todayDisplay}</span>
        </div>
      </td>

      {/* SALARY */}
      <td className="w-[110px] min-w-[110px] max-w-[110px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center gap-1 whitespace-nowrap">
          {entrant.dfsSalary ? (
            <>
              <DraftKingsMark className="h-3 w-auto shrink-0" />
              <span className="text-sm font-semibold tabular-nums text-white">{salaryDisplay}</span>
            </>
          ) : (
            <MetricEmptyState />
          )}
        </div>
      </td>

      {/* DRAFTED % */}
      <td className="w-[92px] min-w-[92px] max-w-[92px] border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">{draftedDisplay}</span>
        </div>
      </td>

      {/* ODDS */}
      <td className="w-[80px] min-w-[80px] max-w-[80px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-mono tabular-nums text-foreground">{oddsDisplay}</span>
        </div>
      </td>
    </>
  )
}
