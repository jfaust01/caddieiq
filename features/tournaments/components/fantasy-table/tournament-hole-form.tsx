'use client'

import { memo, useMemo, useState } from 'react'

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
  relToPar: number | null
}

/**
 * Tournament Hole-by-Hole Form visualization - Scoring Fingerprint.
 * Shows how the player performed on each hole for up to 4 rounds.
 * Creates a visual scoring fingerprint that's immediately readable at a glance.
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
  const [hoveredHole, setHoveredHole] = useState<string | null>(null)

  // For Scheduled tournaments, show empty placeholder
  if (tournamentStatus === 'SCHEDULED') {
    return <div className="text-xs text-gray-500">—</div>
  }

  try {
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
          relToPar: r.relToPar!,
          holes: generateMockHoles(r.relToPar!, r.round),
        }))
    }, [round1RelToPar, round2RelToPar, round3RelToPar, round4RelToPar])

    if (rounds.length === 0) {
      return (
        <div className="text-xs text-gray-500">
          —
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-0 w-full">
        {rounds.map((roundData, index) => (
          <div key={`round-${roundData.round}`} className="w-full">
            <RoundHoleRow {...roundData} hoveredHole={hoveredHole} onHoleHover={setHoveredHole} />
            {index < rounds.length - 1 && (
              <div className="h-px bg-white/[0.07] my-0.5" />
            )}
          </div>
        ))}
      </div>
    )
  } catch (error) {
    return (
      <div className="text-xs text-gray-500">
        Error
      </div>
    )
  }
})

/**
 * One round's hole-by-hole visualization with improved layout and baseline.
 */
const RoundHoleRow = memo(function RoundHoleRow({
  round,
  holes,
  played,
  relToPar,
  hoveredHole,
  onHoleHover,
}: RoundHoles & { hoveredHole: string | null; onHoleHover: (id: string | null) => void }) {
  // Format relative to par display with semantic coloring
  const toParDisplay = relToPar !== null ? (relToPar === 0 ? 'E' : relToPar > 0 ? `+${relToPar}` : String(relToPar)) : '—'
  const toParColor = relToPar === null ? 'text-gray-500' : relToPar < 0 ? 'text-emerald-400' : relToPar > 0 ? 'text-red-400' : 'text-gray-400'

  return (
    <div className="flex items-stretch gap-2 w-full h-20">
      {/* Round label */}
      <div className="flex flex-col items-end justify-center gap-1">
        <div className="text-[9px] font-semibold text-gray-500 uppercase">
          R{round}
        </div>
        {/* Round score badge */}
        <div className={`text-xs font-bold tabular-nums ${toParColor}`}>
          {toParDisplay}
        </div>
      </div>

      {/* 18 hole dots grid with baseline */}
      <div className="flex-1 relative flex items-center">
        {/* Par baseline */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="w-full h-px bg-white/[0.05]" />
        </div>

        {/* Hole dots grid */}
        <div className="grid w-full h-full gap-0" style={{ gridTemplateColumns: 'repeat(18, 1fr)' }}>
          {holes.map(hole => (
            <HoleDot
              key={`hole-${round}-${hole.holeNumber}`}
              hole={hole}
              round={round}
              isHovered={hoveredHole === `R${round}H${hole.holeNumber}`}
              onHover={() => onHoleHover(`R${round}H${hole.holeNumber}`)}
              onHoverEnd={() => onHoleHover(null)}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

/**
 * Single hole dot positioned vertically based on score relative to par.
 * Uses larger offsets for clearer visual distinction between scores.
 */
const HoleDot = memo(function HoleDot({
  hole,
  round,
  isHovered,
  onHover,
  onHoverEnd,
}: {
  hole: HoleResult
  round: number
  isHovered: boolean
  onHover: () => void
  onHoverEnd: () => void
}) {
  const { color, yOffset } = getHoleStyle(hole)
  
  // Accessible label with semantic description
  const holeResultText = hole.status === 'unplayed' ? '' : getHoleResultText(hole.status)
  const label = `Round ${round}, Hole ${hole.holeNumber}${hole.status !== 'unplayed' ? ` - Par ${hole.par}, Score ${hole.score}, ${holeResultText}` : ''}`

  return (
    <div
      className="relative w-full h-full flex items-center justify-center group cursor-pointer"
      style={{
        opacity: hole.status === 'unplayed' ? 0.25 : 1,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      role="img"
      aria-label={label}
    >
      {/* Baseline reference */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="w-px h-px" />
      </div>

      {/* Dot with hover state */}
      <div
        className="rounded-full transition-all duration-150"
        style={{
          width: isHovered ? '7px' : '5px',
          height: isHovered ? '7px' : '5px',
          backgroundColor: color,
          transform: `translateY(${yOffset}px)`,
          boxShadow: isHovered
            ? `0 0 8px ${color}4D, 0 0 0 2px rgba(255,255,255,0.1)`
            : hole.status !== 'unplayed'
              ? `0 0 1px rgba(0,0,0,0.8)`
              : 'none',
        }}
      />

      {/* Compact tooltip on hover */}
      {isHovered && hole.status !== 'unplayed' && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-2 py-1 bg-black/80 rounded-md text-[10px] text-white border border-white/10 pointer-events-none">
          <div className="font-semibold">{holeResultText}</div>
          <div className="text-gray-300">H{hole.holeNumber} • Par {hole.par} • {hole.score}</div>
        </div>
      )}
    </div>
  )
})

/**
 * Generate mock hole-by-hole results from round score.
 * TODO: Replace with real hole-level scorecard data when available.
 * Uses deterministic seeding to avoid hydration mismatches.
 */
function generateMockHoles(roundRelToPar: number, roundNumber: number): HoleResult[] {
  const holes: HoleResult[] = []
  const holeCount = 18

  // Create deterministic mock hole distribution using seeded pseudo-random
  for (let i = 1; i <= holeCount; i++) {
    const seed = roundNumber * 1000 + i
    // Deterministic seed-based randomization
    const pseudo = Math.sin(seed * 0.1) * 10000
    const frac = pseudo - Math.floor(pseudo)
    
    // Mostly pars and birdies
    const holePar = 4
    let relativeToPar = 0 // Default to par
    
    if (frac < 0.3) {
      relativeToPar = -1 // Birdie
    } else if (frac < 0.05) {
      relativeToPar = 1 // Bogey
    } else if (frac < 0.02) {
      relativeToPar = 2 // Double
    }

    const status = getHoleStatus(relativeToPar)
    const score = holePar + relativeToPar

    holes.push({
      holeNumber: i,
      par: holePar,
      score,
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

  // Semantic color mapping with increased visual distinction
  const colorMap: Record<HoleResult['status'], string> = {
    eagleOrBetter: '#10b981', // emerald-500 - bright and distinct
    birdie: '#34d399', // emerald-400 - lighter than eagle
    par: '#6b7280', // gray-500 - neutral baseline
    bogey: '#f97316', // orange-500 - clear warning
    doubleOrWorse: '#ef4444', // red-500 - obvious mistake
    unplayed: '#374151', // gray-700 - very muted
  }

  // Increased vertical offset for clearer visual movement
  // Positive = down (good), Negative = up (bad)
  const offsetMap: Record<HoleResult['status'], number> = {
    eagleOrBetter: 6,  // 6px down
    birdie: 3,         // 3px down
    par: 0,            // centered
    bogey: -3,         // 3px up
    doubleOrWorse: -6, // 6px up
    unplayed: 0,       // centered
  }

  return {
    color: colorMap[status],
    yOffset: offsetMap[status],
  }
}

function getHoleResultText(status: HoleResult['status']): string {
  const resultMap: Record<HoleResult['status'], string> = {
    eagleOrBetter: 'Eagle or Better',
    birdie: 'Birdie',
    par: 'Par',
    bogey: 'Bogey',
    doubleOrWorse: 'Double or Worse',
    unplayed: 'Unplayed',
  }
  return resultMap[status]
}
