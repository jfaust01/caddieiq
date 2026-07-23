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
    <div className="grid h-[96px] w-full grid-rows-[32px_24px_28px] content-center items-center justify-items-center text-center">
      {/* Row 1: Primary Score */}
      <div className="flex h-8 w-full items-center justify-center text-xl font-semibold tabular-nums">
        {primary}
      </div>

      {/* Row 2: Secondary Value or Spacer */}
      <div className="flex h-6 w-full items-center justify-center text-base tabular-nums text-[#9EA5B1]">
        {secondary ?? (
          <span aria-hidden="true" className="invisible">
            —
          </span>
        )}
      </div>

      {/* Row 3: DraftKings Points */}
      <div className="flex h-7 w-full items-center justify-center">
        <div className="inline-flex items-center gap-1 whitespace-nowrap">
          <DraftKingsMark className="h-4 w-auto shrink-0" />
          <span className="tabular-nums text-xs font-mono text-muted-foreground">
            {typeof dkPoints === 'number' ? dkPoints.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
