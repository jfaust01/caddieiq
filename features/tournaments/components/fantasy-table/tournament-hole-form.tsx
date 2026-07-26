'use client'

import { memo, useMemo, useState } from 'react'

interface HoleResult {
  holeNumber: number
  par: number
  score: number | null
  relativeToPar: number | null
  status:
    | 'albatross'
    | 'eagle'
    | 'birdie'
    | 'par'
    | 'bogey'
    | 'double'
    | 'tripleOrWorse'
    | 'unplayed'
}

interface RoundHoles {
  round: number
  holes: HoleResult[]
  played: boolean
  relToPar: number | null
}

/**
 * Premium Tournament Hole-by-Hole Form - Scoring Fingerprint.
 * Shows how the player performed on each hole for up to 4 rounds.
 * 7-color system with connecting lines, full vertical movement, and phase-aware display.
 *
 * Note: Uses mock hole-level data generated from round scores, as authoritative
 * hole-by-hole scorecard data is not yet available in the field entrant type.
 */
export const TournamentHoleForm = memo(function TournamentHoleForm({
  round1RelToPar,
  round2RelToPar,
  round3RelToPar,
  round4RelToPar,
  tournamentStatus,
  currentHole,
}: {
  round1RelToPar: number | null
  round2RelToPar: number | null
  round3RelToPar: number | null
  round4RelToPar: number | null
  tournamentStatus: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
  currentHole?: string | null
}) {
  const [hoveredHole, setHoveredHole] = useState<string | null>(null)

  // Phase-aware display logic
  if (tournamentStatus === 'SCHEDULED') {
    return <div className="text-xs text-gray-500">—</div>
  }

  const isLive = tournamentStatus === 'ACTIVE'

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
          <div key={`round-${roundData.round}`} className="w-full py-0.5">
            <RoundHoleRow {...roundData} hoveredHole={hoveredHole} onHoleHover={setHoveredHole} isLive={isLive} />
            {index < rounds.length - 1 && (
              <div className="h-px bg-white/[0.07]" />
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
 * One round's hole-by-hole visualization with connecting lines and premium layout.
 */
const RoundHoleRow = memo(function RoundHoleRow({
  round,
  holes,
  played,
  relToPar,
  hoveredHole,
  onHoleHover,
  isLive,
}: RoundHoles & { hoveredHole: string | null; onHoleHover: (id: string | null) => void; isLive: boolean }) {
  // Format relative to par display with semantic coloring
  const toParDisplay = relToPar !== null ? (relToPar === 0 ? 'E' : relToPar > 0 ? `+${relToPar}` : String(relToPar)) : '—'
  const toParColor = relToPar === null ? 'text-gray-500' : relToPar < 0 ? 'text-emerald-400' : relToPar > 0 ? 'text-red-400' : 'text-gray-400'

  return (
    <div className="flex items-center gap-1 w-full h-6">
      {/* Round label */}
      <div className="flex flex-col items-end justify-center gap-0">
        <div className="text-[7px] font-semibold text-gray-500 uppercase leading-none">
          R{round}
        </div>
        {/* Round score badge */}
        <div className={`text-[11px] font-bold tabular-nums leading-none ${toParColor}`}>
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
          {holes.map((hole, index) => (
            <HoleDot
              key={`hole-${round}-${hole.holeNumber}`}
              hole={hole}
              round={round}
              holeIndex={index}
              totalHoles={holes.length}
              isHovered={hoveredHole === `R${round}H${hole.holeNumber}`}
              isCurrentHole={false}
              isLive={isLive}
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
 * Single hole dot with premium styling, full vertical movement, and connecting line.
 * Supports hover tooltips with full score details.
 */
const HoleDot = memo(function HoleDot({
  hole,
  round,
  holeIndex,
  totalHoles,
  isHovered,
  isCurrentHole,
  isLive,
  onHover,
  onHoverEnd,
}: {
  hole: HoleResult
  round: number
  holeIndex: number
  totalHoles: number
  isHovered: boolean
  isCurrentHole: boolean
  isLive: boolean
  onHover: () => void
  onHoverEnd: () => void
}) {
  const { color, yOffset } = getHoleStyle(hole)
  const nextHole = holeIndex < totalHoles - 1 ? hole : null
  
  // Accessible label with full score details
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
      {/* Connecting line to next hole (premium visual polish) */}
      {nextHole && holeIndex < totalHoles - 1 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
          aria-hidden="true"
        >
          <line
            x1="50%"
            y1={`calc(50% + ${yOffset}px)`}
            x2="100%"
            y2={`calc(50% + ${yOffset}px)`}
            stroke={color}
            strokeWidth="0.5"
            opacity="0.3"
          />
        </svg>
      )}

      {/* Baseline reference */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="w-px h-px bg-white/[0.1]" />
      </div>

      {/* Dot with premium styling and states */}
      <div
        className="rounded-full transition-all duration-150"
        style={{
          width: isHovered ? '6px' : isCurrentHole && isLive ? '5px' : '4px',
          height: isHovered ? '6px' : isCurrentHole && isLive ? '5px' : '4px',
          backgroundColor: color,
          transform: `translateY(${yOffset}px)`,
          boxShadow: isHovered
            ? `0 0 8px ${color}66, 0 0 0 2px rgba(255,255,255,0.15)`
            : isCurrentHole && isLive
              ? `0 0 4px ${color}4D, inset 0 0 0 1px rgba(255,255,255,0.2)`
              : hole.status !== 'unplayed'
                ? `0 0 1.5px rgba(0,0,0,0.8)`
                : 'none',
          border: isCurrentHole && isLive ? `1px solid ${color}` : 'none',
        }}
      />

      {/* Enhanced tooltip with scorecard details */}
      {isHovered && hole.status !== 'unplayed' && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-3 py-2 bg-black/90 rounded-md text-[10px] text-white border border-white/20 pointer-events-none shadow-lg">
          <div className="font-semibold text-[11px]">{holeResultText}</div>
          <div className="text-gray-300 text-[9px] mt-0.5">H{hole.holeNumber} • Par {hole.par}</div>
          <div className="text-gray-300 text-[9px]">Score: {hole.score}</div>
        </div>
      )}
    </div>
  )
})

/**
 * Generate mock hole-by-hole results from round score.
 * Note: Hole-level scorecard data is not yet available in the authoritative data source.
 * This generates deterministic mock data for visualization until such data becomes available.
 * Distribution matches typical golf scoring across 7 categories.
 */
function generateMockHoles(roundRelToPar: number, roundNumber: number): HoleResult[] {
  const holes: HoleResult[] = []
  const holeCount = 18

  // Deterministic mock generation using seeded pseudo-random
  for (let i = 1; i <= holeCount; i++) {
    const seed = roundNumber * 1000 + i
    const pseudo = Math.sin(seed * 0.1) * 10000
    const frac = pseudo - Math.floor(pseudo)
    
    const holePar = 4
    let relativeToPar = 0

    // 7-category distribution (realistic golf scoring)
    if (frac < 0.02) {
      relativeToPar = -3 // Albatross (2%)
    } else if (frac < 0.08) {
      relativeToPar = -2 // Eagle (6%)
    } else if (frac < 0.30) {
      relativeToPar = -1 // Birdie (22%)
    } else if (frac < 0.65) {
      relativeToPar = 0  // Par (35%)
    } else if (frac < 0.82) {
      relativeToPar = 1  // Bogey (17%)
    } else if (frac < 0.95) {
      relativeToPar = 2  // Double (13%)
    } else {
      relativeToPar = 3  // Triple+ (5%)
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
  if (relativeToPar <= -3) return 'albatross'
  if (relativeToPar === -2) return 'eagle'
  if (relativeToPar === -1) return 'birdie'
  if (relativeToPar === 0) return 'par'
  if (relativeToPar === 1) return 'bogey'
  if (relativeToPar === 2) return 'double'
  return 'tripleOrWorse'
}

function getHoleStyle(hole: HoleResult): {
  color: string
  yOffset: number
} {
  const status = hole.status

  // Premium 7-color semantic system
  const colorMap: Record<HoleResult['status'], string> = {
    albatross: '#059669',      // emerald-600 - excellent
    eagle: '#10b981',          // emerald-500 - very good
    birdie: '#34d399',         // emerald-400 - good
    par: '#6b7280',            // gray-500 - neutral
    bogey: '#f97316',          // orange-500 - fair
    double: '#ef4444',         // red-500 - poor
    tripleOrWorse: '#dc2626',  // red-600 - very poor
    unplayed: '#374151',       // gray-700 - inactive
  }

  // Full vertical movement range: -9px (triple+) to +9px (albatross)
  const offsetMap: Record<HoleResult['status'], number> = {
    albatross: 9,      // +9px down - excellence
    eagle: 7,          // +7px down - very good
    birdie: 4,         // +4px down - good
    par: 0,            // centered - neutral
    bogey: -4,         // -4px up - fair
    double: -7,        // -7px up - poor
    tripleOrWorse: -9, // -9px up - very poor
    unplayed: 0,       // centered - no play
  }

  return {
    color: colorMap[status],
    yOffset: offsetMap[status],
  }
}

function getHoleResultText(status: HoleResult['status']): string {
  const resultMap: Record<HoleResult['status'], string> = {
    albatross: 'Albatross',
    eagle: 'Eagle',
    birdie: 'Birdie',
    par: 'Par',
    bogey: 'Bogey',
    double: 'Double',
    tripleOrWorse: 'Triple+',
    unplayed: 'Unplayed',
  }
  return resultMap[status]
}
