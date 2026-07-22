'use client'

import { cn } from '@/lib/utils'
import { normalizeTournamentTour } from '@/lib/utils/normalize-tournament-tour'
import type { TournamentTour } from '@/features/tournaments/types'

interface TournamentTourChipProps {
  /** Tournament tour object with name and code. Can be null. */
  tour?: TournamentTour | null
  /** Optional CSS class for additional styling. */
  className?: string
}

/**
 * A compact secondary badge displaying the tournament's official tour.
 *
 * Always renders exactly one chip. Uses normalizeTournamentTour to standardize the display value.
 * "No Tour" chips are visually quieter than affiliated tour chips.
 */
export function TournamentTourChip({ tour, className }: TournamentTourChipProps) {
  const normalizedTour = normalizeTournamentTour(tour?.name ?? null, tour?.code ?? null)
  const isNoTour = normalizedTour === 'No Tour'

  return (
    <div
      className={cn(
        'inline-flex items-center px-1.5 py-0',
        'text-[10px] font-medium leading-none',
        isNoTour
          ? 'text-muted-foreground/60 bg-muted/40 border border-muted-foreground/10'
          : 'text-muted-foreground/80 bg-muted/60 border border-muted-foreground/15',
        'rounded-sm h-4',
        className,
      )}
    >
      {normalizedTour}
    </div>
  )
}
