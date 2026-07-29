'use client'

import type { FieldEntrant } from '@/features/tournaments/types'

/**
 * Round Score Cell - displays the current round to-par and total score.
 * Matches the Round DNA visualization for the selected round.
 * 
 * Format: +1 (72) - to-par value with total strokes in parentheses
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
    <div className="flex items-center justify-center">
      <div className={`text-[18px] font-semibold font-mono tabular-nums ${toParColorClass}`}>
        {toParDisplay}
        <span className="text-[18px] font-normal text-muted-foreground ml-1">
          ({scoreDisplay})
        </span>
      </div>
    </div>
  )
}
