'use client'

import { cn } from '@/lib/utils'
import { normalizeTournamentTour } from '@/lib/utils/normalize-tournament-tour'
import type { TournamentTour } from '@/features/tournaments/types'

interface TournamentTourChipProps {
  /** Tournament tour object with name and code. Can be null. */
  tour?: TournamentTour | null
  /** Optional CSS class for additional styling. */
  className?: string
  /** Size variant for the chip. */
  variant?: 'compact' | 'default'
}

/**
 * Get background and text colors for a tour.
 * 
 * Color mapping:
 * - PGA → blue
 * - LIV → red
 * - DP → purple
 * - KFT → green
 * - LPGA → pink
 * - CHAMP → amber
 * - (A) → neutral gray
 * - No Tour → muted gray
 */
function getTourColors(normalizedTour: string): { bg: string; text: string; border: string } {
  switch (normalizedTour) {
    case 'PGA':
      return {
        bg: 'bg-blue-100 dark:bg-blue-950',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
      }
    case 'LIV':
      return {
        bg: 'bg-red-100 dark:bg-red-950',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
      }
    case 'DP':
      return {
        bg: 'bg-purple-100 dark:bg-purple-950',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
      }
    case 'KFT':
      return {
        bg: 'bg-green-100 dark:bg-green-950',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
      }
    case 'LPGA':
      return {
        bg: 'bg-pink-100 dark:bg-pink-950',
        text: 'text-pink-700 dark:text-pink-300',
        border: 'border-pink-200 dark:border-pink-800',
      }
    case 'CHAMP':
      return {
        bg: 'bg-amber-100 dark:bg-amber-950',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
      }
    case '(A)':
      return {
        bg: 'bg-slate-100 dark:bg-slate-900',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-800',
      }
    default:
      // No Tour
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground/60',
        border: 'border-muted-foreground/10',
      }
  }
}

/**
 * A compact badge displaying the tournament's official tour with tour-specific colors.
 *
 * Always renders exactly one chip. Uses normalizeTournamentTour to standardize the display value.
 * Each tour receives a distinct color for visual identification.
 */
export function TournamentTourChip({
  tour,
  className,
  variant = 'default',
}: TournamentTourChipProps) {
  const normalizedTour = normalizeTournamentTour(tour?.name ?? null, tour?.code ?? null)
  const colors = getTourColors(normalizedTour)

  const baseSizing =
    variant === 'compact'
      ? 'px-2 py-1 text-[10px] h-6'
      : 'px-2.5 py-1.5 text-xs h-7'

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center',
        'font-medium leading-none rounded-full',
        'border',
        baseSizing,
        colors.bg,
        colors.text,
        colors.border,
        className,
      )}
    >
      {normalizedTour}
    </div>
  )
}
