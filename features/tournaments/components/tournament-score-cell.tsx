'use client'

import { cn } from '@/lib/utils'
import { DraftKingsMark } from './draftkings-mark'

type TournamentScoreCellProps = {
  primary: React.ReactNode
  secondary?: number | null
  dkPoints?: number | null
}

/**
 * Format relative-to-par value for display
 */
function formatToPar(value: number | null | undefined): string {
  if (value == null) {
    return '—'
  }

  if (value === 0) {
    return 'E'
  }

  return value > 0 ? `+${value}` : `${value}`
}

/**
 * Get color class for relative-to-par value
 */
function getToParClass(value: number | null | undefined): string {
  if (value == null) {
    return 'text-muted-foreground'
  }

  if (value < 0) {
    return 'text-emerald-400'
  }

  if (value > 0) {
    return 'text-red-400'
  }

  return 'text-foreground'
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
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-0.5">
        {/* Row 1: Stroke score (small, muted) */}
        <div className="text-xs font-medium tabular-nums text-muted-foreground">
          {primary}
        </div>

        {/* Row 2: Relative-to-Par Value (largest, bold, color-coded) */}
        <div className={cn('text-lg font-bold leading-none tabular-nums', getToParClass(secondary))}>
          {formatToPar(secondary)}
        </div>

        {/* Row 3: DraftKings Logo and Points (smallest, muted) */}
        <div className="mt-1 inline-flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground">
          <DraftKingsMark className="h-2.5 w-auto opacity-80" />
          <span>{typeof dkPoints === 'number' ? dkPoints.toFixed(1) : '—'}</span>
        </div>
      </div>
    </div>
  )
}
