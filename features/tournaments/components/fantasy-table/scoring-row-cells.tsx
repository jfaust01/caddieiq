'use client'

import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import type { FieldEntrant } from '@/features/tournaments/types'
import { formatPositionWithStatusPriority } from '@/features/tournaments/utils/format-position'
import { cn } from '@/lib/utils'

import { FantasyPlayerCell } from './fantasy-player-cell'
import { MetricEmptyState } from './metric-empty-state'
import {
  formatMissing,
  formatDraftedPercent,
  finishResult,
  calculateFinalValue,
} from './helpers'

/**
 * Completed (finished) row cells: pos · player · total DK · score · salary ·
 * value (PTS/$1K) · ownership % · result · odds. Recap table for analyzing
 * final tournament and fantasy results. Mobile priority: Position, Player,
 * Total DK, Score visible first.
 */
export function ScoringRowCells({
  entrant,
  positionCountMap,
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap ?? new Map())
  const salaryDisplay = formatMissing(entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null)
  const oddsDisplay = formatMissing(entrant.oddsToWin)
  const ownershipDisplay = formatDraftedPercent(entrant.ownershipPercent)
  const finalValue = calculateFinalValue(entrant.totalDkFantasyPoints, entrant.dfsSalary)

  const isTie = entrant.position != null && (positionCountMap?.get(entrant.position) ?? 0) > 1
  const result = finishResult(entrant, isTie)
  const isWinner = entrant.position === 1 && !isTie && entrant.status !== 'CUT' && entrant.cutMade !== false

  return (
    <>
      {/* POS */}
      <td className="w-[54px] sm:w-[64px] min-w-[54px] sm:min-w-[64px] px-1 sm:px-2 align-middle text-center border-r" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
        <span className={cn('text-sm font-medium tabular-nums', isWinner ? 'text-emerald-300' : 'text-white')}>
          {positionDisplay}
        </span>
      </td>

      {/* PLAYER */}
      <td className="w-[calc(100vw-256px)] min-w-[190px] max-w-[240px] sm:w-[300px] sm:min-w-[260px] sm:max-w-none px-2 sm:px-3 align-middle text-left">
        <FantasyPlayerCell entrant={entrant} />
      </td>

      {/* TOTAL DK */}
      <td className="w-[120px] min-w-[120px] max-w-[120px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          {entrant.totalDkFantasyPoints == null ? (
            <MetricEmptyState />
          ) : (
            <span className="text-sm font-semibold tabular-nums text-emerald-100">{entrant.totalDkFantasyPoints}</span>
          )}
        </div>
      </td>

      {/* FINAL SCORE */}
      <td className="w-[125px] min-w-[125px] max-w-[125px] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-sm font-medium tabular-nums text-foreground">
              {entrant.totalStrokes ?? '—'}
            </span>
            {entrant.total !== undefined && entrant.total !== null && (
              <span className={cn(
                'text-xs font-medium tabular-nums',
                entrant.total < 0 ? 'text-emerald-200' : entrant.total > 0 ? 'text-rose-200' : 'text-foreground'
              )}>
                ({entrant.total > 0 ? '+' : ''}{entrant.total})
              </span>
            )}
          </div>
        </div>
      </td>

      {/* SALARY */}
      <td className="w-[115px] min-w-[115px] max-w-[115px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center gap-1.5 whitespace-nowrap">
          {entrant.dfsSalary ? (
            <>
              <DraftKingsMark className="h-3 w-auto shrink-0" />
              <span className="text-sm font-medium tabular-nums text-foreground">{salaryDisplay}</span>
            </>
          ) : (
            <MetricEmptyState />
          )}
        </div>
      </td>

      {/* VALUE (PTS/$1K) */}
      <td className="w-[115px] min-w-[115px] max-w-[115px] border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          {finalValue == null ? (
            <MetricEmptyState />
          ) : (
            <span className="text-sm font-semibold tabular-nums text-emerald-200">{finalValue}</span>
          )}
        </div>
      </td>

      {/* OWNERSHIP % */}
      <td className="w-[110px] min-w-[110px] max-w-[110px] border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-medium tabular-nums text-foreground/60">
            {entrant.ownershipPercent == null ? '—' : `${Math.round(entrant.ownershipPercent)}%`}
          </span>
        </div>
      </td>

      {/* RESULT */}
      <td className="w-[90px] min-w-[90px] max-w-[90px] border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex items-center justify-center h-full">
          <span
            className={cn(
              'inline-flex items-center rounded-[8px] px-2.5 py-1 text-xs font-medium tabular-nums',
              result === 'Won'
                ? 'bg-emerald-500/20 text-emerald-200'
                : result === 'MC' || result === 'WD' || result === 'DQ'
                  ? 'bg-rose-500/15 text-rose-200'
                  : 'bg-white/[0.08] text-white/70',
            )}
          >
            {result}
          </span>
        </div>
      </td>

      {/* ODDS */}
      <td className="w-[95px] min-w-[95px] max-w-[95px] border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex items-center justify-center h-full">
          <span className="text-sm font-medium tabular-nums text-foreground/60">{oddsDisplay}</span>
        </div>
      </td>
    </>
  )
}
