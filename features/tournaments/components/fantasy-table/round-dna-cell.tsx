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
const LEVEL_SPACING = 4 // pixels between each level above/below par

/**
 * Normalize hole result to a single true value
 * Priority: (score - par) > provider toPar > null
 * This ensures all rendering uses consistent values
 */
const normalizeHoleResult = (hole: any): number | null => {
  // Calculate from score and par if available (most reliable)
  if (typeof hole.score === 'number' && typeof hole.par === 'number') {
    const calculated = hole.score - hole.par
    if (process.env.NODE_ENV === 'development') {
      console.log(`[v0] Hole ${hole.holeNumber}: par=${hole.par}, score=${hole.score}, providerToPar=${hole.toPar}, calculated=${calculated}`)
    }
    return calculated
  }

  // Fall back to provider toPar
  if (typeof hole.toPar === 'number') {
    return hole.toPar
  }

  return null
}

// Get Y offset based on normalized result
// Positive result (over par) = smaller Y (above baseline)
// Negative result (under par) = larger Y (below baseline)
// result = 0 = baseline Y
const getYOffsetFromNormalizedResult = (normalizedResult: number | null): number => {
  if (normalizedResult === null || normalizedResult === undefined) return 0
  // Clamp to [-3, 3] range and invert for SVG coordinates
  const displayLevel = Math.max(-3, Math.min(3, normalizedResult))
  return -displayLevel * LEVEL_SPACING
}

// Get color based on normalized result
// Under par (negative) = green shades
// Par (0) = gray
// Over par (positive) = red/orange shades
const getDotColorFromNormalizedResult = (normalizedResult: number | null): string => {
  if (normalizedResult === null || normalizedResult === undefined) return '#4B5563' // muted gray for missing
  
  const level = Math.max(-3, Math.min(3, normalizedResult))
  
  // Under par (green shades)
  if (level === -1) return '#10B981' // green
  if (level === -2) return '#059669' // emerald
  if (level <= -3) return '#7C3AED' // purple
  
  // Par (gray)
  if (level === 0) return '#6B7280' // gray
  
  // Over par (red/orange shades)
  if (level === 1) return '#F97316' // amber/red
  if (level === 2) return '#FF8C42' // orange
  if (level >= 3) return '#EF4444' // red
  
  return '#6B7280' // default gray
}

// Legacy function for backwards compatibility (not used in new toPar-based logic)
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
    // Prepare round data with real to-par values only
    // Note: Actual hole data is fetched via RoundDnaCompact's scorecard API
    // This component displays the aggregated round-level scores
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
          // Use placeholder holes array - actual holes fetched from scorecard API
          holes: generatePlaceholderHoles(r.relToPar!, r.round),
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
        {tooltipHole && tooltipPosition && (() => {
          const normalizedResult = normalizeHoleResult(tooltipHole)
          const resultLabel = normalizedResult === null ? '-' : 
            normalizedResult === 0 ? 'E' :
            normalizedResult > 0 ? `+${normalizedResult}` : 
            `${normalizedResult}`
          
          return (
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
                <span>Hole {tooltipHole.holeNumber}</span>
                <span>Par: {tooltipHole.par}</span>
                {tooltipHole.score !== null && <span>{tooltipHole.score}</span>}
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
          )
        })()}
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
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((holeNum, idx) => {
          const xPos = PADDING + idx * STEP_X
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
                fontSize="12"
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

  // Calculate point coordinates based on normalized results
  // All rendering uses the same normalized value
  const points = holes.map((hole, idx) => {
    const normalizedResult = normalizeHoleResult(hole)
    return {
      x: PADDING + idx * STEP_X,
      y: CENTER_Y + getYOffsetFromNormalizedResult(normalizedResult),
      hole,
      normalizedResult,
    }
  })

  // Filter completed points for line segments (holes with actual scores)
  const completedPoints = points.filter(p => p.hole.score !== null && p.hole.score !== undefined)

  return (
    <div
      className="relative w-full h-full cursor-pointer hover:bg-white/[0.02] transition-colors"
      onMouseEnter={() => onRoundHover(round)}
      onMouseLeave={() => onRoundHover(null)}
      onClick={() => playerId && onRoundClick?.(playerId, round)}
    >
      {/* Labels and SVG visualization */}
      <div className="flex items-center gap-1 h-full px-0.5">
        {/* Round label */}
        <div className="w-9 text-center text-[9px] font-medium uppercase text-gray-400 flex-shrink-0">
          R{round}
        </div>

        {/* Score left */}
        <div className={cn('w-7 text-center text-[10px] font-semibold tabular-nums flex-shrink-0', scoreColor)}>
          {formatScore(relToPar)}
        </div>

        {/* SVG: Lines + Dots */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="flex-1 h-full px-2"
          preserveAspectRatio="none"
          style={{ overflow: 'visible', marginLeft: '0' }}
        >
          {/* Connecting line segments - each line takes color of the next dot based on normalized result */}
          {completedPoints.slice(0, -1).map((startPoint, idx) => {
            const endPoint = completedPoints[idx + 1]
            if (!endPoint) return null
            
            const lineColor = getDotColorFromNormalizedResult(endPoint.normalizedResult)
            
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
                  fill={getDotColorFromNormalizedResult(point.normalizedResult)}
                  opacity={point.hole.score === null ? 0.4 : 1}
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
                  stroke={point.hole.score === null ? 'rgba(200,200,200,0.3)' : 'rgba(255,255,255,0.3)'}
                  strokeWidth="0.75"
                  opacity={point.hole.score === null ? 0.3 : 0.7}
                />

                {/* Tooltip */}
                <title>{`Hole ${point.hole.holeNumber}: ${point.hole.score ? `${point.hole.score} (${formatRelToPar(point.hole.relativeToPar)})` : '—'}`}</title>
              </g>
            )
          })}
        </svg>

        {/* To-Par Score on right */}
        <div className={cn('w-7 text-center text-[10px] font-semibold tabular-nums flex-shrink-0', scoreColor)}>
          {formatScore(relToPar)}
        </div>
      </div>
    </div>
  )
}

// Utility functions

/**
 * Generate placeholder holes for UI layout/rendering.
 * Real hole data comes from scorecard API in RoundDnaCompact.
 * This function creates visual placeholders that maintain the correct layout structure
 * while actual per-hole data is fetched asynchronously from the database.
 */
function generatePlaceholderHoles(roundToPar: number, round: number): HoleResult[] {
  // Create 18 simple placeholder holes for layout
  // All values are placeholders - actual data from scorecard API
  const holes: HoleResult[] = []

  for (let i = 1; i <= 18; i++) {
    const par = 4 // Standard par 4 for layout
    holes.push({
      holeNumber: i,
      par,
      score: null,
      relativeToPar: null,
      status: 'missing', // Placeholder status
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
