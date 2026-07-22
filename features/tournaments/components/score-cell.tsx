'use client'

import { cn } from '@/lib/utils'

interface ScoreCellProps {
  /** Actual score in strokes (e.g., 68, 70, 72). */
  score: number | null
  /** Score relative to par (e.g., -4, 0, +3). */
  relToPar: number | null
  /** DraftKings fantasy points for this round/tournament. */
  dkPoints: number | null
  /** Optional CSS class for additional styling. */
  className?: string
}

/**
 * A compact three-line score cell displaying stroke total, relative-to-par,
 * and DK fantasy points with proper visual hierarchy and color coding.
 */
export function ScoreCell({ score, relToPar, dkPoints, className }: ScoreCellProps) {
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
      {/* Line 1: Score (largest, bold) */}
      <div className="text-sm font-bold font-mono tabular-nums leading-none">
        {scoreDisplay}
      </div>

      {/* Line 2: Relative to Par (medium, color-coded) */}
      <div
        className={cn('text-xs font-mono tabular-nums leading-none', getRelToParColor(relToPar))}
      >
        {formatRelToPar(relToPar)}
      </div>

      {/* Line 3: DK Fantasy Points (smallest, muted) */}
      <div className="text-xs font-mono tabular-nums text-muted-foreground leading-none">
        {dkDisplay}
      </div>
    </div>
  )
}
