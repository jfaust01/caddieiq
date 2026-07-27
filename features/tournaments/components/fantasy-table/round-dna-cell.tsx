'use client'

import { memo, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

interface HoleResult {
  holeNumber: number
  par: number
  score: number | null
  relativeToPar: number | null
  dkPoints?: number | null
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
  dkPoints?: number | null
}

// Fixed Y offsets for scoring grid (in SVG coordinate space)
// Negative Y = above center line (red, bogey or worse)
// Positive Y = below center line (green, birdie or better)
const SCORE_Y_OFFSET = {
  albatross: 12,
  eagle: 8,
  birdie: 4,
  par: 0,
  bogey: -4,
  double: -8,
  triplePlus: -12,
}

// Helper function to get color based on score status
// Birdie or better (eagle, albatross) = green (down)
// Par = gray (centered)
// Bogey or worse (double, triple+) = red (up)
const getDotColor = (status: string): string => {
  if (status === 'future') return '#3F4855' // dark gray
  if (status === 'missing') return '#4B5563' // muted gray
  
  // Good scores (birdie or better)
  if (status === 'albatross' || status === 'eagle' || status === 'birdie') {
    return '#10B981' // green
  }
  
  // Par
  if (status === 'par') {
    return '#6B7280' // gray
  }
  
  // Bad scores (bogey or worse)
  if (status === 'bogey' || status === 'double' || status === 'triplePlus') {
    return '#EF4444' // red
  }
  
  return '#6B7280' // default gray
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
  round1DkPoints,
  round2DkPoints,
  round3DkPoints,
  round4DkPoints,
  playerId,
  tournamentStatus,
  currentHole,
  onRoundClick,
}: {
  round1RelToPar: number | null
  round2RelToPar: number | null
  round3RelToPar: number | null
  round4RelToPar: number | null
  round1DkPoints?: number | null
  round2DkPoints?: number | null
  round3DkPoints?: number | null
  round4DkPoints?: number | null
  playerId?: string
  tournamentStatus: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
  currentHole?: string | null
  onRoundClick?: (playerId: string, round: number) => void
}) {
  const [hoveredHole, setHoveredHole] = useState<string | null>(null)
  const [hoveredRound, setHoveredRound] = useState<number | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [tooltipHole, setTooltipHole] = useState<HoleResult | null>(null)

  // Hide for scheduled tournaments
  if (tournamentStatus === 'SCHEDULED') {
    return null
  }

  try {
    // Generate hole data for display
    const roundsData = useMemo<RoundData[]>(() => {
      const roundArray = [
        { round: 1, relToPar: round1RelToPar, dkPoints: round1DkPoints },
        { round: 2, relToPar: round2RelToPar, dkPoints: round2DkPoints },
        { round: 3, relToPar: round3RelToPar, dkPoints: round3DkPoints },
        { round: 4, relToPar: round4RelToPar, dkPoints: round4DkPoints },
      ]

      return roundArray
        .filter(r => r.relToPar !== null && r.relToPar !== undefined)
        .map(r => ({
          round: r.round,
          relToPar: r.relToPar!,
          dkPoints: r.dkPoints,
          holes: generateMockHoles(r.relToPar!, r.round),
        }))
    }, [round1RelToPar, round2RelToPar, round3RelToPar, round4RelToPar, round1DkPoints, round2DkPoints, round3DkPoints, round4DkPoints])

    if (roundsData.length === 0) {
      return null
    }

    return (
      <div className="relative w-full flex flex-col gap-0">
        {/* Hole number header */}
        <HoleNumberHeader />
        
        {/* Round rows */}
        {roundsData.map((roundData, idx) => (
          <div key={`round-${roundData.round}`}>
            <RoundDnaRow
              round={roundData.round}
              holes={roundData.holes}
              relToPar={roundData.relToPar}
              dkPoints={roundData.dkPoints}
              playerId={playerId}
              hoveredHole={hoveredHole}
              hoveredRound={hoveredRound}
              onHoleHover={setHoveredHole}
              onRoundHover={setHoveredRound}
              onHoleHoverWithPosition={(holeId, hole, x, y) => {
                setHoveredHole(holeId)
                setTooltipHole(hole)
                setTooltipPosition({ x, y })
              }}
              onHoleHoverEnd={() => {
                setHoveredHole(null)
                setTooltipHole(null)
                setTooltipPosition(null)
              }}
              onRoundClick={onRoundClick}
              currentHole={currentHole}
            />
          </div>
        ))}
        
        {/* Tooltip */}
        {tooltipHole && tooltipPosition && (
          <div
            className="absolute bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs z-50 pointer-events-none shadow-lg"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 8}px`,
              transform: 'translate(-50%, -100%)',
              whiteSpace: 'nowrap',
            }}
          >
            <div className="flex gap-3 font-medium">
              <span>Par: {tooltipHole.par}</span>
              {tooltipHole.score !== null && <span>Score: {tooltipHole.score}</span>}
              {tooltipHole.dkPoints !== null && tooltipHole.dkPoints !== undefined && (
                <span>DK: {tooltipHole.dkPoints.toFixed(1)}</span>
              )}
            </div>
            {/* Tooltip arrow pointing down */}
            <div
              className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-900 border-r border-b border-gray-700"
              style={{
                transform: 'translateX(-50%) rotate(45deg)',
              }}
            />
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('[v0] Round DNA rendering error:', error)
    return <div className="text-xs text-gray-500">—</div>
  }
})

function HoleNumberHeader() {
  // SVG dimensions match RoundDnaRow
  const SVG_WIDTH = 300
  const SVG_HEIGHT = 28
  const PADDING = 8
  const DOT_GAP = 5 // 5px gap between each dot
  const USABLE_WIDTH = SVG_WIDTH - 2 * PADDING
  const STEP_X = (USABLE_WIDTH - DOT_GAP * 17) / 17 + DOT_GAP

  return (
    <div className="w-full h-4 px-0.5 flex items-center gap-0.5">
      {/* Empty space for R label and score */}
      <div className="w-9 flex-shrink-0" />
      <div className="w-7 flex-shrink-0" />
      
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
                y={SVG_HEIGHT - 1}
                textAnchor="middle"
                fontSize="7.5"
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
  dkPoints?: number | null
  playerId?: string
  hoveredHole: string | null
  hoveredRound: number | null
  onHoleHover: (holeId: string | null) => void
  onHoleHoverWithPosition?: (holeId: string, hole: HoleResult, x: number, y: number) => void
  onHoleHoverEnd?: () => void
  onRoundHover: (round: number | null) => void
  onRoundClick?: (playerId: string, round: number) => void
  currentHole?: string | null
}

function RoundDnaRow({
  round,
  holes,
  relToPar,
  dkPoints,
  playerId,
  hoveredHole,
  hoveredRound,
  onHoleHover,
  onHoleHoverWithPosition,
  onHoleHoverEnd,
  onRoundHover,
  onRoundClick,
  currentHole,
}: RoundDnaRowProps) {
  const scoreColor = getScoreColor(relToPar)

  // SVG dimensions and coordinate system
  const SVG_WIDTH = 300
  const SVG_HEIGHT = 40
  const CENTER_Y = SVG_HEIGHT / 2
  const PADDING = 8
  const DOT_GAP = 5 // 5px gap between each dot
  const USABLE_WIDTH = SVG_WIDTH - 2 * PADDING
  const STEP_X = (USABLE_WIDTH - DOT_GAP * 17) / 17 + DOT_GAP

  // Calculate point coordinates (shared between line and dots)
  const points = holes.map((hole, idx) => ({
    x: PADDING + idx * STEP_X,
    y: CENTER_Y + SCORE_Y_OFFSET[hole.status === 'future' || hole.status === 'missing' ? 'par' : hole.status],
    hole,
  }))

  // Filter completed points for line segments
  const completedPoints = points.filter(p => p.hole.status !== 'future' && p.hole.status !== 'missing')

  return (
    <div
      className="relative w-full h-10 cursor-pointer hover:bg-white/[0.02] transition-colors"
      onMouseEnter={() => onRoundHover(round)}
      onMouseLeave={() => onRoundHover(null)}
      onClick={() => playerId && onRoundClick?.(playerId, round)}
    >
      {/* Labels and SVG visualization */}
      <div className="flex items-center gap-0.5 h-full px-0.5">
        {/* Round label */}
        <div className="w-10 text-center text-[9px] font-medium uppercase text-gray-400 flex-shrink-0">
          R{round}
        </div>

        {/* Score */}
        <div className={cn('w-8 text-center text-[10px] font-semibold tabular-nums flex-shrink-0', scoreColor)}>
          {formatScore(relToPar)}
        </div>

        {/* SVG: Lines + Dots */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="flex-1 h-full"
          preserveAspectRatio="none"
          style={{ overflow: 'visible', marginLeft: '0' }}
        >
          {/* Connecting line segments - each line takes color of the next dot */}
          {completedPoints.slice(0, -1).map((startPoint, idx) => {
            const endPoint = completedPoints[idx + 1]
            if (!endPoint) return null
            
            const lineColor = getDotColor(endPoint.hole.status)
            
            return (
              <line
                key={`line-${round}-${idx}`}
                x1={startPoint.x}
                y1={startPoint.y}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke={lineColor}
                strokeWidth="1"
                opacity="0.6"
                strokeLinecap="round"
              />
            )
          })}

          {/* Hole dots */}
          {points.map((point, idx) => {
            const isCurrentHole = currentHole === `R${round}H${point.hole.holeNumber}`
            const isHovered = hoveredHole === `R${round}H${point.hole.holeNumber}`
            const dotRadius = isCurrentHole ? 3.5 : 3
            const hoverRadius = isHovered ? 3.5 : dotRadius

            return (
              <g
                key={`hole-${round}-${point.hole.holeNumber}`}
                onMouseEnter={(e) => {
                  const holeId = `R${round}H${point.hole.holeNumber}`
                  onHoleHover(holeId)
                  if (onHoleHoverWithPosition) {
                    const svg = (e.target as SVGElement).ownerSVGElement
                    if (svg) {
                      const svgRect = svg.getBoundingClientRect()
                      const containerRect = svg.closest('.relative')?.getBoundingClientRect()
                      
                      if (containerRect) {
                        // Convert SVG coordinates to screen coordinates
                        const screenX = svgRect.left + (point.x / parseInt(svg.viewBox.baseVal.width || '480')) * svgRect.width
                        const screenY = svgRect.top + (point.y / parseInt(svg.viewBox.baseVal.height || '32')) * svgRect.height
                        
                        // Convert screen coordinates to container-relative coordinates
                        const relativeX = screenX - containerRect.left
                        const relativeY = screenY - containerRect.top
                        
                        onHoleHoverWithPosition(holeId, point.hole, relativeX, relativeY)
                      }
                    }
                  }
                }}
                onMouseLeave={() => {
                  onHoleHover(null)
                  onHoleHoverEnd?.()
                }}
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
                  fill={getDotColor(point.hole.status)}
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
  if (relToPar === null || relToPar === undefined) return 'text-gray-500'
  // Use exact same colors as getDotColor for consistency
  if (relToPar < 0) return 'text-emerald-500' // #10B981 - green for birdies and better
  if (relToPar === 0) return 'text-gray-500' // #6B7280 - gray for par
  if (relToPar > 0) return 'text-red-500' // #EF4444 - red for bogeys and worse
  return 'text-gray-500'
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
