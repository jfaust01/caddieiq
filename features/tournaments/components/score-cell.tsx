'use client'

import { cn } from '@/lib/utils'

interface ScoreCellProps {
  /** Actual score in strokes (e.g., 68, 70, 72). */
  strokes: number | null
  /** Score relative to par (e.g., -4, 0, +3). */
  relativeToPar: number | null
  /** DraftKings fantasy points for this round/tournament. */
  dkPoints: number | null
  /** Emphasis level: 'total' for tournament summary, 'round' for individual rounds. */
  emphasis?: 'total' | 'round'
  /** Optional CSS class for additional styling. */
  className?: string
}

/**
 * A compact three-line score cell displaying strokes, relative-to-par,
 * and DK fantasy points with proper visual hierarchy and color coding.
 *
 * Line 1 (largest, bold): Stroke score or tournament strokes
 * Line 2 (medium): Relative-to-par (color-coded: green for negative, neutral for even, red for positive)
 * Line 3 (smallest, muted): "DK" label followed by fantasy points value
 *
 * When emphasis='total', line 1 uses font-bold. When emphasis='round' (or undefined),
 * line 1 uses regular weight.
 */
export function ScoreCell({
  strokes,
  relativeToPar,
  dkPoints,
  emphasis = 'round',
  className,
}: ScoreCellProps) {
  if (emphasis === 'total' && strokes === null) {
    console.log('[v0] TOTAL ScoreCell props:', { strokes, relativeToPar, dkPoints, emphasis })
  }

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

  // Format DK points with label
  const dkDisplay = dkPoints == null ? '—' : dkPoints.toFixed(1)
  const strokesDisplay = strokes == null ? '—' : strokes.toString()
  const isTotalEmphasis = emphasis === 'total'
  
  // For TOTAL emphasis: display relative-to-par as main value (line 1), then DK points (line 3)
  // For regular rounds: display strokes as main value (line 1), relative-to-par (line 2), then DK points (line 3)
  const mainDisplay = isTotalEmphasis ? formatRelToPar(relativeToPar) : strokesDisplay
  const mainColor = isTotalEmphasis ? getRelToParColor(relativeToPar) : ''

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-0.5', className)}>
      {/* Line 1: Main Score Value (largest; bold if total, regular if round) */}
      <div
        className={cn(
          'text-sm font-mono tabular-nums leading-none',
          isTotalEmphasis ? 'font-bold' : 'font-semibold',
          mainColor,
        )}
      >
        {mainDisplay}
      </div>

      {/* Line 2: Relative to Par (medium, color-coded) - only for rounds, not total */}
      {!isTotalEmphasis && (
        <div
          className={cn('text-xs font-mono tabular-nums leading-none', getRelToParColor(relativeToPar))}
        >
          {formatRelToPar(relativeToPar)}
        </div>
      )}

      {/* Line 3: DK Label + Points (tertiary; label much smaller than value) */}
      <div className="flex items-baseline justify-center gap-0.5 leading-none">
        <span className="text-[0.5rem] font-medium text-muted-foreground/65">DK</span>
        <span className="text-xs font-mono tabular-nums text-muted-foreground">{dkDisplay}</span>
      </div>
    </div>
  )
}
