'use client'

import { DraftKingsMark } from './draftkings-mark'

type TournamentScoreCellProps = {
  primary: React.ReactNode
  secondary?: React.ReactNode
  dkPoints?: number | null
}

/**
 * Reusable score cell for tournament table
 * Uses a consistent three-row grid layout for all columns (TOTAL, R1, R2, R3, R4)
 * Row 1: Primary score (strokes for rounds, total for TOTAL)
 * Row 2: Secondary value (relative-to-par) or invisible spacer
 * Row 3: DraftKings logo and points
 */
export function TournamentScoreCell({
  primary,
  secondary,
  dkPoints,
}: TournamentScoreCellProps) {
  return (
    <div className="grid h-[96px] w-full grid-rows-[24px_32px_24px] content-center items-center justify-items-center text-center">
      {/* Row 1: Primary Score (smaller, not bold) */}
      <div className="flex h-6 w-full items-center justify-center text-sm font-normal tabular-nums text-foreground">
        {primary}
      </div>

      {/* Row 2: Relative-to-Par Value (larger, bold) */}
      <div className="flex h-8 w-full items-center justify-center text-xl font-bold tabular-nums">
        {secondary ?? (
          <span aria-hidden="true" className="invisible">
            —
          </span>
        )}
      </div>

      {/* Row 3: DraftKings Logo and Points */}
      <div className="flex h-6 w-full items-center justify-center">
        <div className="inline-flex items-center gap-0.5 whitespace-nowrap">
          <DraftKingsMark className="h-2 w-auto shrink-0" />
          <span className="text-xs font-normal tabular-nums text-[#FF6600]">
            {typeof dkPoints === 'number' ? dkPoints.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
