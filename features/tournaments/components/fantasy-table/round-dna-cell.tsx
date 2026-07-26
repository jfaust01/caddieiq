'use client'

import { memo, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

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
    | 'triplePlus'
    | 'future'
    | 'missing'
  isCurrentHole?: boolean
}

interface RoundData {
  round: number
  holes: HoleResult[]
  relToPar: number | null
}

/**
 * Round DNA - Premium hole-by-hole scoring visualization.
 * Shows R1-R4 with connected hole dots, vertical positioning based on score vs par,
 * and semantic coloring for results (albatross through triple bogey+).
 */
export const RoundDnaCell = memo(function RoundDnaCell({
  round1RelToPar,
  round2RelToPar,
  round3RelToPar,
  round4RelToPar,
  tournamentStatus,
  currentHole,
  onRoundClick,
}: {
  round1RelToPar: number | null
  round2RelToPar: number | null
  round3RelToPar: number | null
  round4RelToPar: number | null
  tournamentStatus: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
  currentHole?: string | null
  onRoundClick?: (round: number) => void
}) {
  const [hoveredHole, setHoveredHole] = useState<string | null>(null)
  const [hoveredRound, setHoveredRound] = useState<number | null>(null)

  // Hide for scheduled tournaments
  if (tournamentStatus === 'SCHEDULED') {
    return null
  }

  const isLive = tournamentStatus === 'ACTIVE'

  try {
    // Generate mock hole data for display
    const roundsData = useMemo<RoundData[]>(() => {
      const roundArray = [
        { round: 1, relToPar: round1RelToPar },
        { round: 2, relToPar: round2RelToPar },
        { round: 3, relToPar: round3RelToPar },
        { round: 4, relToPar: round4RelToPar },
      ]

      return roundArray
        .filter(r => r.relToPar !== null && r.relToPar !== undefined)
        .map(r => ({
          round: r.round,
          relToPar: r.relToPar!,
          holes: generateMockHoles(r.relToPar!, r.round),
        }))
    }, [round1RelToPar, round2RelToPar, round3RelToPar, round4RelToPar])

    if (roundsData.length === 0) {
      return null
    }

    return (
      <div className="w-full flex flex-col gap-0">
        {/* Hole number header */}
        <HoleNumberHeader />
        
        {/* Round rows */}
        {roundsData.map((roundData, idx) => (
          <div key={`round-${roundData.round}`}>
            <RoundDnaRow
              round={roundData.round}
              holes={roundData.holes}
              relToPar={roundData.relToPar}
              hoveredHole={hoveredHole}
              hoveredRound={hoveredRound}
              onHoleHover={setHoveredHole}
              onRoundHover={setHoveredRound}
              onRoundClick={onRoundClick}
              isLive={isLive}
              currentHole={currentHole}
            />
            {idx < roundsData.length - 1 && (
              <div className="h-px bg-white/[0.07]" />
            )}
          </div>
        ))}
      </div>
    )
  } catch (error) {
    console.error('[v0] Round DNA rendering error:', error)
    return <div className="text-xs text-gray-500">—</div>
  }
})

function HoleNumberHeader() {
  return (
    <div className="grid gap-0 h-6 items-center mb-1" style={{ gridTemplateColumns: '42px 34px repeat(18, minmax(18px, 1fr))' }}>
      {/* Round label space */}
      <div />
      {/* Score space */}
      <div />
      
      {/* Hole numbers 1-18 */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((holeNum) => (
        <div
          key={`hole-header-${holeNum}`}
          className={cn(
            'text-center text-[8px] sm:text-[9px] font-medium text-gray-500',
            holeNum === 10 && 'border-l border-white/[0.15]'
          )}
        >
          {holeNum}
        </div>
      ))}
    </div>
  )
}

interface RoundDnaRowProps {
  round: number
  holes: HoleResult[]
  relToPar: number | null
  hoveredHole: string | null
  hoveredRound: number | null
  onHoleHover: (hole: string | null) => void
  onRoundHover: (round: number | null) => void
  onRoundClick?: (round: number) => void
  isLive: boolean
  currentHole?: string | null
}

function RoundDnaRow({
  round,
  holes,
  relToPar,
  hoveredHole,
  hoveredRound,
  onHoleHover,
  onRoundHover,
  onRoundClick,
  isLive,
  currentHole,
}: RoundDnaRowProps) {
  const scoreColor = getScoreColor(relToPar)

  return (
    <div
      className="relative w-full cursor-pointer hover:bg-white/[0.02] transition-colors"
      onMouseEnter={() => onRoundHover(round)}
      onMouseLeave={() => onRoundHover(null)}
      onClick={() => onRoundClick?.(round)}
    >
      {/* SVG connecting lines overlay - positioned absolutely */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        {holes.slice(0, -1).map((hole, idx) => {
          const nextHole = holes[idx + 1]
          if (!nextHole) return null

          const { color: color1, yOffset: y1 } = getHoleStyle(hole)
          const { color: color2, yOffset: y2 } = getHoleStyle(nextHole)
          
          // Calculate percentage positions: 42px + 34px + hole positions
          // Each hole occupies roughly 5.56% of the holes area (100/18)
          const prefixWidth = (42 + 34) / 1000 * 100 // Approximate in %
          const holeWidth = (100 - prefixWidth) / 18
          const x1Percent = prefixWidth + (idx + 0.5) * holeWidth
          const x2Percent = prefixWidth + (idx + 1.5) * holeWidth
          const yBase = 50

          return (
            <line
              key={`line-${round}-${idx}`}
              x1={`${x1Percent}%`}
              y1={`calc(50% + ${y1}px)`}
              x2={`${x2Percent}%`}
              y2={`calc(50% + ${y2}px)`}
              stroke={color1}
              strokeWidth="1"
              opacity="0.6"
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {/* Grid container with labels and holes */}
      <div
        className="grid gap-0 items-center h-7 relative"
        style={{ gridTemplateColumns: '42px 34px repeat(18, minmax(18px, 1fr))' }}
      >
        {/* Round label */}
        <div className="text-center text-[10px] font-medium uppercase text-gray-400 z-10">
          R{round}
        </div>

        {/* Score */}
        <div className={cn('text-center text-[11px] font-semibold tabular-nums z-10', scoreColor)}>
          {formatScore(relToPar)}
        </div>

        {/* Hole dots and placeholders */}
        {holes.map((hole) => (
          <RoundDnaHoleDot
            key={`hole-${round}-${hole.holeNumber}`}
            hole={hole}
            round={round}
            hoveredHole={hoveredHole}
            isHovered={hoveredHole === `R${round}H${hole.holeNumber}`}
            onHover={() => onHoleHover(`R${round}H${hole.holeNumber}`)}
            onHoverEnd={() => onHoleHover(null)}
          />
        ))}
      </div>
    </div>
  )
}

interface RoundDnaHoleDotProps {
  hole: HoleResult
  round: number
  hoveredHole: string | null
  isHovered: boolean
  onHover: () => void
  onHoverEnd: () => void
}

function RoundDnaHoleDot({
  hole,
  round,
  isHovered,
  onHover,
  onHoverEnd,
}: RoundDnaHoleDotProps) {
  const { color, yOffset } = getHoleStyle(hole)
  const dotSize = hole.isCurrentHole ? 10 : 8
  const hoverScale = 1.4

  // Grid column: hole number maps to column index (2 + holeNumber, since 0-1 are R label and score)
  const gridColumn = hole.holeNumber + 1

  return (
    <div
      className="flex items-center justify-center pointer-events-auto col-span-1"
      style={{ 
        gridColumn: `${gridColumn}`,
        justifySelf: 'center',
        alignSelf: 'center',
        width: `${dotSize}px`,
        height: `${dotSize}px`,
        marginTop: `${yOffset}px`,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      {hole.status === 'future' ? (
        // Future hole placeholder
        <div
          className="rounded-full border w-full h-full"
          style={{
            borderColor: '#2B3440',
            opacity: 0.4,
          }}
        />
      ) : hole.status === 'missing' ? (
        // Missing hole (no data)
        <div
          className="rounded-full border w-full h-full"
          style={{
            borderColor: '#6B7280',
            opacity: 0.3,
          }}
        />
      ) : (
        // Completed hole
        <div
          className={cn(
            'rounded-full transition-all cursor-pointer w-full h-full',
            isHovered && 'shadow-lg',
            hole.isCurrentHole && 'ring-2'
          )}
          style={{
            backgroundColor: color,
            transform: `scale(${isHovered ? hoverScale : 1})`,
            outline: hole.isCurrentHole ? `2px solid #10B981` : `2px solid rgba(255, 255, 255, 0.4)`,
            outlineOffset: '-1px',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.2)',
            zIndex: isHovered ? 10 : 1,
          }}
          title={`Hole ${hole.holeNumber} (Par ${hole.par}): Score ${hole.score ?? '—'}`}
        />
      )}
    </div>
  )
}

// Utility functions

function generateMockHoles(roundToPar: number, round: number): HoleResult[] {
  // Generate deterministic but varied mock holes based on round total
  const holes: HoleResult[] = []
  let remaining = Math.abs(roundToPar)
  const isUnder = roundToPar < 0

  for (let i = 1; i <= 18; i++) {
    const par = i <= 9 ? 4 : 4 // Simplified: assume par 4s
    let score = par
    let status: HoleResult['status'] = 'par'

    // Distribute the round's to-par across holes
    if (remaining > 0) {
      const random = Math.sin(round * 1000 + i) * 10000
      const threshold = remaining / (18 - i + 1)

      if (random % 10 < 1 && Math.abs(remaining) > 5) {
        // Eagle
        score = par - 2
        status = 'eagle'
        remaining -= 2
      } else if (random % 10 < 2 && (isUnder ? remaining > 0 : remaining > 1)) {
        // Birdie
        score = par - 1
        status = 'birdie'
        remaining -= 1
      } else if (random % 10 < 3 && Math.abs(remaining) > 0) {
        // Bogey
        score = par + 1
        status = 'bogey'
        remaining -= -1
      } else if (remaining > 0 && random % 10 < 1) {
        // Double bogey
        score = par + 2
        status = 'double'
        remaining -= -2
      }
    }

    holes.push({
      holeNumber: i,
      par,
      score,
      relativeToPar: score - par,
      status,
    })
  }

  return holes
}

function getHoleStyle(hole: HoleResult): { color: string; yOffset: number } {
  const offsetMap: Record<HoleResult['status'], number> = {
    albatross: -9,
    eagle: -6,
    birdie: -3,
    par: 0,
    bogey: 3,
    double: 6,
    triplePlus: 9,
    future: 0,
    missing: 0,
  }

  const colorMap: Record<HoleResult['status'], string> = {
    albatross: '#22D3EE',
    eagle: '#00E676',
    birdie: '#22C55E',
    par: '#6B7280',
    bogey: '#F59E0B',
    double: '#F97316',
    triplePlus: '#EF4444',
    future: '#2B3440',
    missing: '#4B5563',
  }

  return {
    color: colorMap[hole.status],
    yOffset: offsetMap[hole.status],
  }
}

function getScoreColor(relToPar: number | null): string {
  if (relToPar === null) return 'text-gray-400'
  if (relToPar < 0) return 'text-emerald-400'
  if (relToPar === 0) return 'text-gray-300'
  return 'text-red-400'
}

function formatScore(relToPar: number | null): string {
  if (relToPar === null) return '—'
  if (relToPar === 0) return 'E'
  return (relToPar > 0 ? '+' : '') + relToPar
}
