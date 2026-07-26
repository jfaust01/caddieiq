'use client'

import { memo, useMemo } from 'react'

interface HoleResult {
  holeNumber: number
  par: number
  score: number | null
  relativeToPar: number | null
  status:
    | 'eagleOrBetter'
    | 'birdie'
    | 'par'
    | 'bogey'
    | 'doubleOrWorse'
    | 'unplayed'
}

interface RoundHoles {
  round: number
  holes: HoleResult[]
  played: boolean
}

/**
 * Tournament Hole-by-Hole Form visualization.
 * Shows how the player performed on each hole for up to 4 rounds.
 */
export const TournamentHoleForm = memo(function TournamentHoleForm({
  round1RelToPar,
  round2RelToPar,
  round3RelToPar,
  round4RelToPar,
  tournamentStatus,
}: {
  round1RelToPar: number | null
  round2RelToPar: number | null
  round3RelToPar: number | null
  round4RelToPar: number | null
  tournamentStatus: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
}) {
  // For Scheduled tournaments, omit this column entirely
  if (tournamentStatus === 'SCHEDULED') {
    return null
  }

  // Generate mock hole data for display until real hole-level data is available
  const rounds = useMemo<RoundHoles[]>(() => {
    const roundData = [
      { round: 1, relToPar: round1RelToPar },
      { round: 2, relToPar: round2RelToPar },
      { round: 3, relToPar: round3RelToPar },
      { round: 4, relToPar: round4RelToPar },
    ]

    return roundData
      .filter(r => r.relToPar !== null && r.relToPar !== undefined)
      .map(r => ({
        round: r.round,
        played: true,
        holes: generateMockHoles(r.relToPar!, r.round),
      }))
  }, [round1RelToPar, round2RelToPar, round3RelToPar, round4RelToPar])

  if (rounds.length === 0) {
    return (
      <div className="text-xs text-gray-500">
        No data
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {rounds.map(roundData => (
        <RoundHoleRow key={`round-${roundData.round}`} {...roundData} />
      ))}
    </div>
  )
})

/**
 * One round's hole-by-hole visualization.
 */
const RoundHoleRow = memo(function RoundHoleRow({
  round,
  holes,
  played,
}: RoundHoles) {
  return (
    <div className="flex items-center gap-2">
      {/* Round label */}
      <div className="w-6 text-right text-xs font-semibold text-gray-400">
        R{round}
      </div>

      {/* 18 hole dots grid */}
      <div className="grid flex-1 gap-0.5" style={{ gridTemplateColumns: 'repeat(18, minmax(4px, 1fr))' }}>
        {holes.map(hole => (
          <HoleDot
            key={`hole-${round}-${hole.holeNumber}`}
            hole={hole}
            round={round}
          />
        ))}
      </div>
    </div>
  )
})

/**
 * Single hole dot positioned vertically based on score relative to par.
 */
const HoleDot = memo(function HoleDot({
  hole,
  round,
}: {
  hole: HoleResult
  round: number
}) {
  const { color, yOffset } = getHoleStyle(hole)
  const label = `Round ${round}, Hole ${hole.holeNumber}${hole.status !== 'unplayed' ? `, ${hole.status}, score ${hole.score} on par ${hole.par}` : ''}`

  return (
    <div
      title={label}
      className="relative h-4 w-full flex items-center justify-center"
      style={{
        opacity: hole.status === 'unplayed' ? 0.3 : 1,
      }}
    >
      <div
        className="rounded-full transition-all"
        style={{
          width: '4px',
          height: '4px',
          backgroundColor: color,
          transform: `translateY(${yOffset}px)`,
          boxShadow:
            hole.status !== 'unplayed'
              ? '0 0 2px rgba(0,0,0,0.6)'
              : 'none',
        }}
        aria-label={label}
      />
    </div>
  )
})

/**
 * Generate mock hole-by-hole results from round score.
 * TODO: Replace with real hole-level scorecard data when available.
 */
function generateMockHoles(roundRelToPar: number, roundNumber: number): HoleResult[] {
  const holes: HoleResult[] = []
  const par = 72
  const holeCount = 18

  // Create deterministic mock hole distribution that sums to roundRelToPar
  for (let i = 1; i <= holeCount; i++) {
    const seed = roundNumber * 1000 + i
    const holeScore = Math.random() < 0.5 ? 3 : 4 // Mostly 3s and 4s
    const holePar = holeCount === 18 ? 4 : 3 // Simplified mock
    const relativeToPar = holeScore - holePar

    const status = getHoleStatus(relativeToPar)

    holes.push({
      holeNumber: i,
      par: holePar,
      score: holeScore,
      relativeToPar,
      status,
    })
  }

  return holes
}

function getHoleStatus(
  relativeToPar: number | null,
): HoleResult['status'] {
  if (relativeToPar === null) return 'unplayed'
  if (relativeToPar <= -2) return 'eagleOrBetter'
  if (relativeToPar === -1) return 'birdie'
  if (relativeToPar === 0) return 'par'
  if (relativeToPar === 1) return 'bogey'
  return 'doubleOrWorse'
}

function getHoleStyle(hole: HoleResult): {
  color: string
  yOffset: number
} {
  const status = hole.status

  // Color mapping
  const colorMap: Record<HoleResult['status'], string> = {
    eagleOrBetter: 'rgb(16, 185, 129)', // emerald-500
    birdie: 'rgb(34, 197, 94)', // green-500
    par: 'rgb(107, 114, 128)', // gray-500
    bogey: 'rgb(251, 146, 60)', // amber-500
    doubleOrWorse: 'rgb(239, 68, 68)', // red-500
    unplayed: 'rgb(55, 65, 81)', // gray-700
  }

  // Vertical offset mapping
  const offsetMap: Record<HoleResult['status'], number> = {
    eagleOrBetter: 5,
    birdie: 3,
    par: 0,
    bogey: -3,
    doubleOrWorse: -5,
    unplayed: 0,
  }

  return {
    color: colorMap[status],
    yOffset: offsetMap[status],
  }
}
