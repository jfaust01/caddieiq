'use client'

import { cn } from '@/lib/utils'

/**
 * COURSE FIT CELL
 * Displays course fit score (0-100) from the Course Fit engine with progress bar.
 * Uses semantic colors: green for high fit, yellow for moderate, red for low.
 */
export function CourseFitCell({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-muted-foreground">—</span>
      </div>
    )
  }

  // Determine semantic color based on score
  let colorClass = 'text-red-400'
  let barFillColor = 'bg-red-400'
  let barBgColor = 'bg-red-400/20'

  if (score >= 70) {
    colorClass = 'text-emerald-400'
    barFillColor = 'bg-emerald-400'
    barBgColor = 'bg-emerald-400/20'
  } else if (score >= 50) {
    colorClass = 'text-amber-400'
    barFillColor = 'bg-amber-400'
    barBgColor = 'bg-amber-400/20'
  }

  const percentage = Math.min((score / 100) * 100, 100)

  return (
    <div className="flex flex-col gap-2 items-center py-1">
      <div className={cn('font-semibold text-sm sm:text-base tabular-nums', colorClass)}>
        {score}
      </div>
      <div className={cn('w-full h-1.5 rounded-full overflow-hidden', barBgColor)}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', barFillColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
