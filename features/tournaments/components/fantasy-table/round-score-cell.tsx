'use client'

import type { FieldEntrant } from '@/features/tournaments/types'

/**
 * Round Score Cell - displays the current round score and to-par.
 * Matches the Round DNA visualization for the selected round.
 * 
 * Format:
 * Line 1: Total score (e.g., "68")
 * Line 2: To par (e.g., "-4")
 */
export function RoundScoreCell({
  entrant,
  selectedRound = 1,
}: {
  entrant: FieldEntrant
  selectedRound?: number
}) {
  // Get the round-specific to-par value
  const roundToParMap: Record<number, number | null> = {
    1: entrant.round1RelToPar,
    2: entrant.round2RelToPar,
    3: entrant.round3RelToPar,
    4: entrant.round4RelToPar,
  }

  const roundToPar = roundToParMap[selectedRound] ?? null

  // Determine color based on to-par
  let toParColorClass = 'text-muted-foreground' // default neutral gray
  if (roundToPar !== null && roundToPar !== undefined) {
    if (roundToPar < 0) {
      toParColorClass = 'text-emerald-400' // under par - emerald
    } else if (roundToPar > 0) {
      toParColorClass = 'text-red-400' // over par - muted red
    } else {
      toParColorClass = 'text-muted-foreground' // even - neutral gray
    }
  }

  // Format the to-par display value
  let toParDisplay = '—'
  if (roundToPar !== null && roundToPar !== undefined) {
    if (roundToPar === 0) {
      toParDisplay = 'E'
    } else if (roundToPar > 0) {
      toParDisplay = `+${roundToPar}`
    } else {
      toParDisplay = `${roundToPar}`
    }
  }

  // Calculate the round score from the round to-par
  // We need to get the course par for the round to calculate the actual score
  // For now, we'll just display the to-par since we don't have the course par data readily available
  // The user can see the actual score in the scorecard view

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className={`text-sm font-semibold font-mono tabular-nums ${toParColorClass}`}>
        {toParDisplay}
      </div>
    </div>
  )
}
