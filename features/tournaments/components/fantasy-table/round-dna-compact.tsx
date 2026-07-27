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

const SCORE_Y_OFFSET = {
  albatross: 12,
  eagle: 8,
  birdie: 4,
  par: 0,
  bogey: -4,
  double: -8,
  triplePlus: -12,
}

const getDotColor = (status: string): string => {
  if (status === 'future') return '#3F4855'
  if (status === 'missing') return '#4B5563'
  
  if (status === 'albatross' || status === 'eagle' || status === 'birdie') {
    return '#10B981'
  }
  
  if (status === 'par') {
    return '#6B7280'
  }
  
  if (status === 'bogey' || status === 'double' || status === 'triplePlus') {
    return '#EF4444'
  }
  
  return '#6B7280'
}

function seededHoleRandom(seed: string, holeNumber: number, index: number): number {
  let hash = 0
  const combined = seed + '|' + holeNumber + '|' + index
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  hash = hash >>> 0
  return (hash % 1000) / 1000
}

function generateMockHoles(relToPar: number, round: number, playerId: string = ''): HoleResult[] {
  const holes: HoleResult[] = []
  const targetDeviation = relToPar
  const seed = playerId + '-r' + round
  
  // Generate random scores for all holes first
  const holeScores: number[] = []
  for (let hole = 1; hole <= 18; hole++) {
    const rand = seededHoleRandom(seed, hole, 0)
    let score = 0
    
    // Weighted distribution to create varied scores
    if (rand < 0.05) {
      score = -2  // Eagle (5%)
    } else if (rand < 0.25) {
      score = -1  // Birdie (20%)
    } else if (rand < 0.70) {
      score = 0   // Par (45%)
    } else if (rand < 0.95) {
      score = 1   // Bogey (25%)
    } else {
      score = 2   // Double Bogey (5%)
    }
    
    holeScores.push(score)
  }
  
  // Calculate current total and adjust to match target
  let currentTotal = holeScores.reduce((a, b) => a + b, 0)
  let deviation = currentTotal - targetDeviation
  
  // Adjust holes to match target while maintaining variety
  let holesRemaining = 18
  while (Math.abs(deviation) > 0.001 && holesRemaining > 0) {
    for (let i = 0; i < 18 && Math.abs(deviation) > 0.001; i++) {
      if (deviation > 0.5) {
        // Need to improve score
        if (holeScores[i] < 2) {
          const adjustment = Math.min(1, deviation)
          holeScores[i] += adjustment
          deviation -= adjustment
        }
      } else if (deviation < -0.5) {
        // Need to worsen score
        if (holeScores[i] > -2) {
          const adjustment = Math.min(1, Math.abs(deviation))
          holeScores[i] -= adjustment
          deviation += adjustment
        }
      }
    }
    holesRemaining--
  }
  
  // Create hole results with adjusted scores
  for (let hole = 1; hole <= 18; hole++) {
    const holeRelToPar = holeScores[hole - 1]
    
    // Determine status based on hole's relative to par value
    let status: HoleResult['status'] = 'par'
    if (holeRelToPar <= -2) status = 'eagle'
    else if (holeRelToPar === -1) status = 'birdie'
    else if (holeRelToPar === 0) status = 'par'
    else if (holeRelToPar === 1) status = 'bogey'
    else if (holeRelToPar >= 2) status = 'double'
    
    holes.push({
      holeNumber: hole,
      par: 4,
      score: holeRelToPar,
      relativeToPar: holeRelToPar,
      status,
    })
  }
  
  return holes
}

function getScoreColor(relToPar: number | null): string {
  if (relToPar === null || relToPar === undefined) return 'text-gray-500'
  if (relToPar < 0) return 'text-emerald-500'
  if (relToPar === 0) return 'text-gray-500'
  if (relToPar > 0) return 'text-red-500'
  return 'text-gray-500'
}

function RoundDnaRow({
  round,
  holes,
  relToPar,
  playerId,
  onRoundClick,
}: {
  round: number
  holes: HoleResult[]
  relToPar: number | null
  playerId?: string
  onRoundClick?: (playerId: string, round: number) => void
}) {
  const [hoveredHole, setHoveredHole] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [tooltipHole, setTooltipHole] = useState<HoleResult | null>(null)

  const PADDING = 8
  const USABLE_WIDTH = 480 - 2 * PADDING
  const STEP_X = USABLE_WIDTH / 18
  const SVG_WIDTH = 480
  const SVG_HEIGHT = 40
  const CENTER_Y = SVG_HEIGHT / 2

  const completedPoints = useMemo(
    () =>
      holes
        .map((hole, idx) => ({
          x: PADDING + (hole.holeNumber - 1) * STEP_X + STEP_X / 2,
          y: CENTER_Y + SCORE_Y_OFFSET[hole.status as keyof typeof SCORE_Y_OFFSET],
          hole,
        }))
        .filter((point) => point.hole.status !== 'future' && point.hole.status !== 'missing'),
    [holes]
  )

  return (
    <div
      className="relative w-full cursor-pointer hover:bg-white/[0.02] transition-colors"
      onMouseLeave={() => {
        setHoveredHole(null)
        setTooltipHole(null)
        setTooltipPosition(null)
      }}
      onClick={() => playerId && onRoundClick?.(playerId, round)}
    >
      <div className="flex h-full">
        <div className="flex-1 min-w-0">
          <svg
            className="w-full"
            height={SVG_HEIGHT}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="none"
            style={{ userSelect: 'none' }}
          >
            {/* Center line */}
            <line x1={PADDING} y1={CENTER_Y} x2={SVG_WIDTH - PADDING} y2={CENTER_Y} stroke="#3F4855" strokeWidth="1" />

            {/* Connecting line segments */}
            {completedPoints.slice(0, -1).map((startPoint, idx) => {
              const endPoint = completedPoints[idx + 1]
              if (!endPoint) return null

              const lineColor = getDotColor(endPoint.hole.status)
              return (
                <line
                  key={`line-${idx}`}
                  x1={startPoint.x}
                  y1={startPoint.y}
                  x2={endPoint.x}
                  y2={endPoint.y}
                  stroke={lineColor}
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              )
            })}

            {/* Dots */}
            {completedPoints.map((point) => (
              <g
                key={`dot-${point.hole.holeNumber}`}
                style={{
                  cursor: 'pointer',
                }}
                onMouseEnter={() => {
                  setHoveredHole(`${round}-${point.hole.holeNumber}`)
                  setTooltipHole(point.hole)
                  setTooltipPosition({ x: point.x, y: point.y })
                }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={3}
                  fill={getDotColor(point.hole.status)}
                  opacity={point.hole.status === 'future' || point.hole.status === 'missing' ? 0.4 : 1}
                />
              </g>
            ))}

            {/* Tooltip */}
            {tooltipHole && tooltipPosition && (
              <g pointerEvents="none">
                <rect
                  x={tooltipPosition.x - 25}
                  y={tooltipPosition.y - 20}
                  width={50}
                  height={18}
                  fill="#1F2937"
                  rx={3}
                  stroke="#4B5563"
                  strokeWidth="0.5"
                />
                <text
                  x={tooltipPosition.x}
                  y={tooltipPosition.y - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#F3F4F6"
                  fontWeight="500"
                >
                  {`H${tooltipHole.holeNumber} ${tooltipHole.relativeToPar === 0 ? 'E' : (tooltipHole.relativeToPar ?? 0) > 0 ? '+' + tooltipHole.relativeToPar : tooltipHole.relativeToPar}`}
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  )
}

export const RoundDnaCompact = memo(function RoundDnaCompact({
  round1RelToPar,
  round2RelToPar,
  round3RelToPar,
  round4RelToPar,
  round1DkPoints,
  round2DkPoints,
  round3DkPoints,
  round4DkPoints,
  selectedRound,
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
  selectedRound: number
  playerId?: string
  tournamentStatus: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
  currentHole?: string | null
  onRoundClick?: (playerId: string, round: number) => void
}) {
  if (tournamentStatus === 'SCHEDULED') {
    return null
  }

  const roundsData = useMemo<RoundData[]>(() => {
    const roundArray = [
      { round: 1, relToPar: round1RelToPar, dkPoints: round1DkPoints },
      { round: 2, relToPar: round2RelToPar, dkPoints: round2DkPoints },
      { round: 3, relToPar: round3RelToPar, dkPoints: round3DkPoints },
      { round: 4, relToPar: round4RelToPar, dkPoints: round4DkPoints },
    ]

    return roundArray
      .filter((r) => r.relToPar !== null && r.relToPar !== undefined)
      .map((r) => ({
        round: r.round,
        relToPar: r.relToPar!,
        dkPoints: r.dkPoints,
        holes: generateMockHoles(r.relToPar!, r.round, playerId),
      }))
  }, [round1RelToPar, round2RelToPar, round3RelToPar, round4RelToPar, round1DkPoints, round2DkPoints, round3DkPoints, round4DkPoints])

  const selectedRoundData = roundsData.find((r) => r.round === selectedRound)

  if (!selectedRoundData) {
    return (
      <div className="flex items-center justify-center h-12 text-muted-foreground text-sm">
        Did not play R{selectedRound}
      </div>
    )
  }

  return (
    <RoundDnaRow
      round={selectedRoundData.round}
      holes={selectedRoundData.holes}
      relToPar={selectedRoundData.relToPar}
      playerId={playerId}
      onRoundClick={onRoundClick}
    />
  )
})
