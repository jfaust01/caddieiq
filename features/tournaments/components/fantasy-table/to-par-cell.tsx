'use client'

import type { FieldEntrant } from '@/features/tournaments/types'

/**
 * To Par Cell - displays tournament total score relative to par using semantic colors.
 * Uses provider data (entrant.total) - does not calculate from Round DNA.
 *
 * Format: -12, -4, E, +1, +8
 * Colors:
 *   Under par (negative): emerald (text-emerald-400 in dark mode)
 *   Even: neutral gray (text-muted-foreground)
 *   Over par (positive): muted red (text-red-400 in dark mode)
 */
export function ToParCell({ entrant }: { entrant: FieldEntrant }) {
  // Use provider data (entrant.total) directly
  const total = entrant.total

  // Determine color based on score
  let colorClass = 'text-muted-foreground' // default neutral gray for null/undefined
  if (total !== null && total !== undefined) {
    if (total < 0) {
      colorClass = 'text-emerald-400' // under par - emerald
    } else if (total > 0) {
      colorClass = 'text-red-400' // over par - muted red
    } else {
      colorClass = 'text-muted-foreground' // even - neutral gray
    }
  }

  // Format the display value
  let displayValue = '—'
  if (total !== null && total !== undefined) {
    if (total === 0) {
      displayValue = 'E'
    } else if (total > 0) {
      displayValue = `+${total}`
    } else {
      displayValue = `${total}`
    }
  }

  return (
    <span className={`text-lg font-semibold font-mono tabular-nums ${colorClass}`}>
      {displayValue}
    </span>
  )
}
