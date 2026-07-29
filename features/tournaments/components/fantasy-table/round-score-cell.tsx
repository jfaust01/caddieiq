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
  // Get the round-specific score data
  const roundScoreMap: Record<number, number | null> = {
    1: entrant.round1,
    2: entrant.round2,
    3: entrant.round3,
    4: entrant.round4,
  }

  const roundToParMap: Record<number, number | null> = {
    1: entrant.round1RelToPar,
    2: entrant.round2RelToPar,
    3: entrant.round3RelToPar,
    4: entrant.round4RelToPar,
  }

  const roundScore = roundScoreMap[selectedRound] ?? null
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

  // Format the score display value
  let scoreDisplay = '—'
  if (roundScore !== null && roundScore !== undefined) {
    scoreDisplay = roundScore.toString()
  }

  return (
    <div className="flex flex-col items-center justify-center gap-0.5">
      <div className="text-sm font-semibold font-mono tabular-nums text-foreground">
        {scoreDisplay}
      </div>
      <div className={`text-xs font-medium font-mono tabular-nums ${toParColorClass}`}>
        {toParDisplay}
      </div>
    </div>
  )
}
