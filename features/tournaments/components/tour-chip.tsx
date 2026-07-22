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
