'use client'

import { cn } from '@/lib/utils'

interface TourChipProps {
  /** Tour affiliation (e.g., "PGA TOUR", "LIV", "DP WORLD TOUR"). */
  tour: string | null
  /** Optional CSS class for additional styling. */
  className?: string
}

/**
 * A compact secondary badge displaying the player's professional tour affiliation.
 *
 * Renders nothing if tour is null.
 */
export function TourChip({ tour, className }: TourChipProps) {
  if (!tour) {
    return null
  }

  return (
    <div
      className={cn(
        'inline-flex items-center px-2 py-0.5',
        'text-xs font-semibold text-muted-foreground',
        'bg-muted rounded border border-muted-foreground/20',
        className,
      )}
    >
      {tour}
    </div>
  )
}
