'use client'

import { cn } from '@/lib/utils'

interface TotalCellProps {
  /** Tournament score relative to par (e.g., -12, 0, +3). */
  relToPar: number | null
  /** Optional CSS class for additional styling. */
  className?: string
}

/**
 * A single-value tournament total cell displaying only relative-to-par
 * in large format with color coding.
 *
 * Displays:
 * -12 (large, green - negative/better)
 * E (large, neutral - even)
 * +3 (large, red - positive/worse)
 */
export function TotalCell({ relToPar, className }: TotalCellProps) {
  // Format relative-to-par with color coding
  const formatRelToPar = (value: number | null) => {
    if (value == null) return '—'
    if (value === 0) return 'E'
    return (value > 0 ? '+' : '') + value
  }

  // Determine color for relative-to-par: green (negative/better), neutral (even), red (positive/worse)
  const getRelToParColor = (value: number | null) => {
    if (value == null) return 'text-muted-foreground'
    if (value < 0) return 'text-green-600 dark:text-green-500'
    if (value === 0) return 'text-muted-foreground'
    return 'text-red-600 dark:text-red-500'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      {/* Single large value: Relative to Par (color-coded) */}
      <div
        className={cn(
          'text-lg font-bold font-mono tabular-nums',
          getRelToParColor(relToPar),
        )}
      >
        {formatRelToPar(relToPar)}
      </div>
    </div>
  )
}
