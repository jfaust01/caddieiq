'use client'

import { cn } from '@/lib/utils'
import { DraftKingsMark } from './draftkings-mark'

type TournamentScoreCellProps = {
  primary: React.ReactNode
  secondary?: number | null
  dkPoints?: number | null
  isMobile?: boolean
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
 * - Row 1 (16px): Stroke score (small, muted)
 * - Row 2 (23px): Relative-to-par value (large, bold, color-coded)
 * - Row 3 (17px): DraftKings logo and points (small, muted)
 * All columns share identical internal spacing and alignment.
 */
export function TournamentScoreCell({
  primary,
  secondary,
  dkPoints,
  isMobile = false,
}: TournamentScoreCellProps) {
  if (isMobile) {
    return (
      <div className="grid h-[50px] grid-rows-[14px_20px_14px] place-items-center gap-0 w-full">
        {/* Row 1: Stroke score (14px) */}
        <div className="flex h-[14px] items-center justify-center">
          <span className="text-[10px] font-medium leading-none tabular-nums text-muted-foreground">
            {primary}
          </span>
        </div>

        {/* Row 2: Relative-to-Par Value (20px, bold, color-coded) */}
        <div className="flex h-[20px] items-center justify-center">
          <span className={cn(
            'text-base font-semibold leading-none tabular-nums',
            getToParClass(secondary)
          )}>
            {formatToPar(secondary)}
          </span>
        </div>

        {/* Row 3: DraftKings Logo and Points (14px) */}
        <div className="flex h-[14px] items-center justify-center">
          <div className="inline-flex items-center gap-0.5 whitespace-nowrap text-[9px] leading-none tabular-nums text-muted-foreground">
            <DraftKingsMark className="h-2 w-auto shrink-0 opacity-90" />
            <span>{typeof dkPoints === 'number' ? dkPoints.toFixed(1) : '—'}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid h-[58px] grid-rows-[16px_23px_17px] place-items-center gap-0 w-full">
      {/* Row 1: Stroke score (16px) */}
      <div className="flex h-[16px] items-center justify-center">
        <span className="text-xs font-medium leading-none tabular-nums text-muted-foreground">
          {primary}
        </span>
      </div>

      {/* Row 2: Relative-to-Par Value (23px, bold, color-coded) */}
      <div className="flex h-[23px] items-center justify-center">
        <span className={cn(
          'text-lg font-semibold leading-none tabular-nums',
          getToParClass(secondary)
        )}>
          {formatToPar(secondary)}
        </span>
      </div>

      {/* Row 3: DraftKings Logo and Points (17px) */}
      <div className="flex h-[17px] items-center justify-center">
        <div className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] leading-none tabular-nums text-muted-foreground">
          <DraftKingsMark className="h-2.5 w-auto shrink-0 opacity-90" />
          <span>{typeof dkPoints === 'number' ? dkPoints.toFixed(1) : '—'}</span>
        </div>
      </div>
    </div>
  )
}
