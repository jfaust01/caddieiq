'use client'

import { cn } from '@/lib/utils'
import { normalizePlayerTour } from '@/lib/utils/normalize-player-tour'

interface TourChipProps {
  /** Tour affiliation (raw, unnormalized). Can be null, undefined, or any string value. */
  tour?: string | null
  /** Optional CSS class for additional styling. */
  className?: string
}

/**
 * A compact secondary badge displaying the player's professional tour affiliation.
 *
 * Always renders exactly one chip. Uses normalizePlayerTour to standardize the display value.
 * "No Tour" chips are visually quieter than affiliated tour chips.
 */
export function TourChip({ tour, className }: TourChipProps) {
  const normalizedTour = normalizePlayerTour(tour)
  const isNoTour = normalizedTour === 'No Tour'

  return (
    <div
      className={cn(
        'inline-flex items-center px-1 py-0.5',
        'text-[11px] font-medium',
        isNoTour
          ? 'text-muted-foreground/60 bg-muted/40 border border-muted-foreground/10'
          : 'text-muted-foreground/80 bg-muted/60 border border-muted-foreground/15',
        'rounded-sm h-5',
        className,
      )}
    >
      {normalizedTour}
    </div>
  )
}
