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

function generateMockHoles(relToPar: number, round: number): HoleResult[] {
  const holes: HoleResult[] = []
  const targetDeviation = relToPar
  const holesPerSide = 9
  
  let remainingDeviation = targetDeviation
  
  for (let hole = 1; hole <= 18; hole++) {
    const isBack9 = hole > 9
    const sideDeviation = isBack9 ? targetDeviation * 0.5 : targetDeviation * 0.5
    
    let score = 0
    let status: HoleResult['status'] = 'par'
    
    if (Math.abs(remainingDeviation) > 0.001) {
      if (remainingDeviation >= 2) {
        score = 1
        status = 'double'
        remainingDeviation -= 2
      } else if (remainingDeviation >= 1) {
        score = 1
        status = 'bogey'
        remainingDeviation -= 1
      } else if (remainingDeviation >= 0.5) {
        score = 1
        status = 'bogey'
        remainingDeviation -= 0.5
      } else if (remainingDeviation > 0.001) {
        score = Math.random() > 0.5 ? 1 : 0
        if (score === 1) {
          status = 'bogey'
          remainingDeviation -= 1
        }
      } else if (remainingDeviation <= -2) {
        score = -1
        status = 'eagle'
        remainingDeviation += 2
      } else if (remainingDeviation <= -1) {
        score = -1
        status = 'birdie'
        remainingDeviation += 1
      } else if (remainingDeviation <= -0.5) {
        score = -1
        status = 'birdie'
        remainingDeviation += 0.5
      } else if (remainingDeviation < -0.001) {
        score = Math.random() > 0.5 ? -1 : 0
        if (score === -1) {
          status = 'birdie'
          remainingDeviation += 1
        }
      }
    }
    
    holes.push({
      holeNumber: hole,
      par: 4,
      score: score,
      relativeToPar: score,
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

function HoleNumberHeaderRow() {
  const PADDING = 8
  const USABLE_WIDTH = 480 - 2 * PADDING
  const STEP_X = USABLE_WIDTH / 17
  
  return (
    <svg className="w-full h-6" viewBox="0 0 480 24" preserveAspectRatio="none">
      {Array.from({ length: 18 }).map((_, i) => {
        const holeNum = i + 1
        const xPos = PADDING + i * STEP_X + STEP_X / 2
        return (
          <text
            key={`hole-${holeNum}`}
            x={xPos}
            y={18}
            textAnchor="middle"
            fontSize="7.5"
            fill="rgb(107, 114, 128)"
            fontWeight="500"
          >
            {holeNum}
          </text>
        )
      })}
    </svg>
  )
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
  const STEP_X = USABLE_WIDTH / 17
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
      className="relative w-full h-12 cursor-pointer hover:bg-white/[0.02] transition-colors"
      onMouseLeave={() => {
        setHoveredHole(null)
        setTooltipHole(null)
        setTooltipPosition(null)
      }}
      onClick={() => playerId && onRoundClick?.(playerId, round)}
    >
      <div className="flex items-center justify-between px-2 h-full">
        <div className="w-16 text-center">
          <span className={cn('text-sm font-semibold tabular-nums', getScoreColor(relToPar))}>
            {relToPar === null || relToPar === undefined
              ? '—'
              : relToPar === 0
                ? 'E'
                : (relToPar > 0 ? '+' : '') + relToPar}
          </span>
        </div>

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
        holes: generateMockHoles(r.relToPar!, r.round),
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
    <div className="flex flex-col gap-1">
      <HoleNumberHeaderRow />
      <RoundDnaRow
        round={selectedRoundData.round}
        holes={selectedRoundData.holes}
        relToPar={selectedRoundData.relToPar}
        playerId={playerId}
        onRoundClick={onRoundClick}
      />
    </div>
  )
})
