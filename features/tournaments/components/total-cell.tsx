'use client'

import { cn } from '@/lib/utils'

interface TotalCellProps {
  /** Tournament total strokes (e.g., 268, 271). */
  score: number | null
  /** Tournament score relative to par (e.g., -12, 0, +3). */
  relToPar: number | null
  /** Tournament DraftKings fantasy points (e.g., 118.5, 92). */
  dkPoints: number | null
  /** Optional CSS class for additional styling. */
  className?: string
}

/**
 * A three-line tournament total cell displaying tournament strokes, relative-to-par,
 * and DK fantasy points with proper visual hierarchy and color coding.
 *
 * Displays:
 * Line 1 (largest): 268 (tournament strokes)
 * Line 2 (medium): -12 (tournament relative-to-par, color-coded)
 * Line 3 (smallest): 118.5 (tournament DK fantasy points)
 */
export function TotalCell({ score, relToPar, dkPoints, className }: TotalCellProps) {
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

  // Format DK points
  const dkDisplay = dkPoints == null ? '—' : dkPoints.toFixed(1)
  const scoreDisplay = score == null ? '—' : score.toString()

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-0.5', className)}>
      {/* Line 1: Tournament Stroke Total (largest, bold) */}
      <div className="text-sm font-bold font-mono tabular-nums leading-none">
        {scoreDisplay}
      </div>

      {/* Line 2: Tournament Relative to Par (medium, color-coded) */}
      <div
        className={cn('text-xs font-mono tabular-nums leading-none', getRelToParColor(relToPar))}
      >
        {formatRelToPar(relToPar)}
      </div>

      {/* Line 3: Tournament DK Fantasy Points (smallest, muted) */}
      <div className="text-xs font-mono tabular-nums text-muted-foreground leading-none">
        {dkDisplay}
      </div>
    </div>
  )
}
