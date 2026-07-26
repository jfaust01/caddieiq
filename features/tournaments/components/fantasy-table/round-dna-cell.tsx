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

// Fixed Y offsets for scoring grid (in SVG coordinate space)
const SCORE_Y_OFFSET = {
  albatross: -12,
  eagle: -8,
  birdie: -4,
  par: 0,
  bogey: 4,
  double: 8,
  triplePlus: 12,
}

const DOT_COLORS = {
  albatross: '#06B6D4', // cyan
  eagle: '#00E676', // bright green
  birdie: '#22C55E', // green
  par: '#6B7280', // gray
  bogey: '#F59E0B', // amber
  double: '#F97316', // orange
  triplePlus: '#EF4444', // red
  future: '#3F4855', // dark gray
  missing: '#4B5563', // muted gray
}

/**
 * Round DNA - Unified SVG-based hole-by-hole scoring visualization.
 * All dots and lines use the same coordinate system to ensure perfect alignment.
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

  try {
    // Generate hole data for display
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
  // SVG dimensions match RoundDnaRow
  const SVG_WIDTH = 720
  const SVG_HEIGHT = 40
  const PADDING = 10
  const USABLE_WIDTH = SVG_WIDTH - 2 * PADDING
  const STEP_X = USABLE_WIDTH / 17

  return (
    <div className="w-full h-6 mb-1 px-1 flex items-center gap-1">
      {/* Empty space for R label and score */}
      <div className="w-12 flex-shrink-0" />
      <div className="w-10 flex-shrink-0" />
      
      {/* Hole numbers in SVG space */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="flex-1 h-full"
        preserveAspectRatio="none"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((holeNum) => {
          const xPos = PADDING + (holeNum - 1) * STEP_X
          const isDivider = holeNum === 10
          
          return (
            <g key={`hole-header-${holeNum}`}>
              {isDivider && (
                <line
                  x1={xPos - STEP_X / 2}
                  y1="0"
                  x2={xPos - STEP_X / 2}
                  y2={SVG_HEIGHT}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.5"
                />
              )}
              <text
                x={xPos}
                y={SVG_HEIGHT - 2}
                textAnchor="middle"
                fontSize="8"
                fill="rgb(107, 114, 128)"
                fontWeight="500"
              >
                {holeNum}
              </text>
            </g>
          )
        })}
      </svg>
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
  currentHole,
}: RoundDnaRowProps) {
  const scoreColor = getScoreColor(relToPar)

  // SVG dimensions and coordinate system
  const SVG_WIDTH = 720
  const SVG_HEIGHT = 40
  const CENTER_Y = SVG_HEIGHT / 2
  const PADDING = 10
  const USABLE_WIDTH = SVG_WIDTH - 2 * PADDING
  const STEP_X = USABLE_WIDTH / 17

  // Calculate point coordinates (shared between line and dots)
  const points = holes.map((hole, idx) => ({
    x: PADDING + idx * STEP_X,
    y: CENTER_Y + SCORE_Y_OFFSET[hole.status === 'future' || hole.status === 'missing' ? 'par' : hole.status],
    hole,
  }))

  // Build polyline for connecting line
  const completedPoints = points.filter(p => p.hole.status !== 'future' && p.hole.status !== 'missing')
  const polylinePoints = completedPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div
      className="relative w-full h-10 cursor-pointer hover:bg-white/[0.02] transition-colors"
      onMouseEnter={() => onRoundHover(round)}
      onMouseLeave={() => onRoundHover(null)}
      onClick={() => onRoundClick?.(round)}
    >
      {/* Labels and SVG visualization */}
      <div className="flex items-center gap-1 h-full">
        {/* Round label */}
        <div className="w-12 text-center text-[10px] font-medium uppercase text-gray-400 flex-shrink-0">
          R{round}
        </div>

        {/* Score */}
        <div className={cn('w-10 text-center text-[11px] font-semibold tabular-nums flex-shrink-0', scoreColor)}>
          {formatScore(relToPar)}
        </div>

        {/* SVG: Lines + Dots */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="flex-1 h-full"
          preserveAspectRatio="none"
          style={{ overflow: 'visible', marginLeft: '0' }}
        >
          {/* Connecting polyline */}
          {polylinePoints && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke={completedPoints[0]?.hole.status === 'albatross' ? DOT_COLORS.albatross : DOT_COLORS.birdie}
              strokeWidth="1"
              opacity="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hole dots */}
          {points.map((point, idx) => {
            const isCurrentHole = currentHole === `R${round}H${point.hole.holeNumber}`
            const isHovered = hoveredHole === `R${round}H${point.hole.holeNumber}`
            const dotRadius = isCurrentHole ? 5 : 4
            const hoverRadius = isHovered ? 5 : dotRadius

            return (
              <g
                key={`hole-${round}-${point.hole.holeNumber}`}
                onMouseEnter={() => onHoleHover(`R${round}H${point.hole.holeNumber}`)}
                onMouseLeave={() => onHoleHover(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Current hole ring */}
                {isCurrentHole && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={6}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                )}

                {/* Dot */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoverRadius}
                  fill={DOT_COLORS[point.hole.status] || DOT_COLORS.par}
                  opacity={point.hole.status === 'future' || point.hole.status === 'missing' ? 0.4 : 1}
                  style={{
                    transition: 'r 0.2s',
                    filter: isHovered ? 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' : 'none',
                  }}
                />

                {/* Outline */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoverRadius}
                  fill="none"
                  stroke={point.hole.status === 'future' || point.hole.status === 'missing' ? 'rgba(200,200,200,0.3)' : 'rgba(255,255,255,0.3)'}
                  strokeWidth="0.75"
                  opacity={point.hole.status === 'future' || point.hole.status === 'missing' ? 0.3 : 0.7}
                />

                {/* Tooltip */}
                <title>{`Hole ${point.hole.holeNumber}: ${point.hole.score ? `${point.hole.score} (${formatRelToPar(point.hole.relativeToPar)})` : '—'}`}</title>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// Utility functions

function generateMockHoles(roundToPar: number, round: number): HoleResult[] {
  const holes: HoleResult[] = []
  let remaining = Math.abs(roundToPar)
  const isUnder = roundToPar < 0

  for (let i = 1; i <= 18; i++) {
    const par = 4 // Simplified: all par 4s
    let score = par
    let status: HoleResult['status'] = 'par'
    let relativeToPar = 0

    if (remaining > 0) {
      const random = Math.sin(round * 1000 + i) * 10000
      const frac = random - Math.floor(random)

      if (frac < 0.02) {
        relativeToPar = -3
        status = 'albatross'
        score = par - 3
        remaining -= 3
      } else if (frac < 0.08) {
        relativeToPar = -2
        status = 'eagle'
        score = par - 2
        remaining -= 2
      } else if (frac < 0.25) {
        relativeToPar = -1
        status = 'birdie'
        score = par - 1
        remaining -= 1
      } else if (frac < 0.55 && remaining > 0) {
        relativeToPar = 0
        status = 'par'
        score = par
      } else if (frac < 0.75 && (isUnder ? remaining > 0 : remaining > 0)) {
        relativeToPar = 1
        status = 'bogey'
        score = par + 1
        remaining -= 1
      } else if (frac < 0.90 && (isUnder ? remaining > 0 : remaining > 1)) {
        relativeToPar = 2
        status = 'double'
        score = par + 2
        remaining -= 2
      } else if (remaining > 0) {
        relativeToPar = 3
        status = 'triplePlus'
        score = par + 3
        remaining -= 3
      }
    }

    holes.push({
      holeNumber: i,
      par,
      score,
      relativeToPar,
      status,
      isCurrentHole: false,
    })
  }

  return holes
}

function getScoreColor(relToPar: number | null): string {
  if (!relToPar) return 'text-gray-400'
  if (relToPar <= -3) return 'text-cyan-400'
  if (relToPar === -2) return 'text-emerald-400'
  if (relToPar === -1) return 'text-green-500'
  if (relToPar === 0) return 'text-gray-400'
  if (relToPar === 1) return 'text-amber-500'
  if (relToPar === 2) return 'text-orange-500'
  return 'text-red-500'
}

function formatScore(relToPar: number | null): string {
  if (!relToPar && relToPar !== 0) return '—'
  if (relToPar === 0) return 'E'
  return (relToPar > 0 ? '+' : '') + relToPar
}

function formatRelToPar(relToPar: number | null): string {
  if (!relToPar && relToPar !== 0) return '—'
  if (relToPar === 0) return 'E'
  return (relToPar > 0 ? '+' : '') + relToPar
}
