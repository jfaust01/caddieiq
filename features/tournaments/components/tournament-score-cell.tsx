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
 * Uses a consistent fixed three-row CSS Grid layout for all columns (TOTAL, R1, R2, R3, R4)
 * - Row 1 (18px): Stroke score (small, muted)
 * - Row 2 (24px): Relative-to-par value (large, bold, color-coded)
 * - Row 3 (18px): DraftKings logo and points (small, muted)
 * All columns share identical internal spacing and alignment.
 */
export function TournamentScoreCell({
  primary,
  secondary,
  dkPoints,
}: TournamentScoreCellProps) {
  return (
    <div className="grid h-[66px] grid-rows-[18px_24px_18px] place-items-center gap-0 w-full">
      {/* Row 1: Stroke score (18px) */}
      <div className="flex h-[18px] items-center justify-center">
        <span className="text-sm font-medium leading-none tabular-nums text-muted-foreground">
          {primary}
        </span>
      </div>

      {/* Row 2: Relative-to-Par Value (24px, bold, color-coded) */}
      <div className="flex h-[24px] items-center justify-center">
        <span className={cn(
          'text-xl font-bold leading-none tabular-nums',
          getToParClass(secondary)
        )}>
          {formatToPar(secondary)}
        </span>
      </div>

      {/* Row 3: DraftKings Logo and Points (18px) */}
      <div className="flex h-[18px] items-center justify-center">
        <div className="inline-flex items-center gap-1 whitespace-nowrap text-sm leading-none tabular-nums text-muted-foreground">
          <DraftKingsMark className="h-2.5 w-auto shrink-0" />
          <span>{typeof dkPoints === 'number' ? dkPoints.toFixed(1) : '—'}</span>
        </div>
      </div>
    </div>
  )
}
