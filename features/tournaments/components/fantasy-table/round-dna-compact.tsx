'use client'

import { memo, useMemo, useState, useEffect } from 'react'
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

async function fetchRealHoles(tournamentId: string, playerId: string, round: number): Promise<HoleResult[] | null> {
  try {
    const response = await fetch(
      `/api/tournaments/${tournamentId}/players/${playerId}/rounds/${round}/scorecard`
    )
    
    if (!response.ok) {
      return null
    }

    const { data } = await response.json()
    
    if (!data || !data.holes || data.holes.length === 0) {
      return null
    }

    // Convert database hole scores to HoleResult format
    return data.holes.map((hole: any) => {
      let status: HoleResult['status'] = 'par'
      const relToPar = hole.toPar

      if (relToPar === null || relToPar === undefined) {
        status = 'missing'
      } else if (relToPar <= -3) {
        status = 'albatross'
      } else if (relToPar === -2) {
        status = 'eagle'
      } else if (relToPar === -1) {
        status = 'birdie'
      } else if (relToPar === 0) {
        status = 'par'
      } else if (relToPar === 1) {
        status = 'bogey'
      } else if (relToPar === 2) {
        status = 'double'
      } else if (relToPar >= 3) {
        status = 'triplePlus'
      }

      return {
        holeNumber: hole.holeNumber,
        par: hole.par || 4,
        score: hole.score,
        relativeToPar: relToPar,
        dkPoints: hole.dkPoints,
        status,
      }
    })
  } catch (error) {
    return null
  }
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
  tournamentId,
  onRoundClick,
}: {
  round: number
  holes: HoleResult[]
  relToPar: number | null
  playerId?: string
  tournamentId?: string
  onRoundClick?: (playerId: string, round: number) => void
}) {
  const [hoveredHole, setHoveredHole] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [tooltipHole, setTooltipHole] = useState<HoleResult | null>(null)

  const PADDING = 8
  const SVG_WIDTH = 300
  const USABLE_WIDTH = SVG_WIDTH - 2 * PADDING
  const DOT_GAP = 5 // 5px max gap between each dot
  const STEP_X = (USABLE_WIDTH - DOT_GAP * 18) / 18 + DOT_GAP
  const SVG_HEIGHT = 60
  const CENTER_Y = SVG_HEIGHT / 2 + 5 // offset down slightly to make room for labels above

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
      className="relative w-full cursor-pointer"
      onMouseLeave={() => {
        setHoveredHole(null)
        setTooltipHole(null)
        setTooltipPosition(null)
      }}
      onClick={() => playerId && onRoundClick?.(playerId, round)}
    >
      <div className="flex h-full relative">
        <div className="flex-1 min-w-0 overflow-hidden">
          <svg
            className="w-full h-full"
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
              <circle
                key={`dot-${point.hole.holeNumber}`}
                cx={point.x}
                cy={point.y}
                r={3}
                fill={getDotColor(point.hole.status)}
                opacity={point.hole.status === 'future' || point.hole.status === 'missing' ? 0.4 : 1}
                style={{
                  cursor: 'pointer',
                }}
                onMouseEnter={() => {
                  setHoveredHole(`${round}-${point.hole.holeNumber}`)
                  setTooltipHole(point.hole)
                  setTooltipPosition({ x: point.x, y: point.y })
                }}
              />
            ))}

            {/* To-par labels (rendered last to appear in front) */}
            {completedPoints.map((point) => (
              point.hole.relativeToPar !== null && point.hole.relativeToPar !== undefined && (
                <text
                  key={`label-${point.hole.holeNumber}`}
                  x={point.x}
                  y={point.y - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="500"
                  fill={getDotColor(point.hole.status)}
                  pointerEvents="none"
                  style={{ zIndex: 10 }}
                >
                  {point.hole.relativeToPar === 0 ? 'E' : (point.hole.relativeToPar > 0 ? '+' : '') + point.hole.relativeToPar}
                </text>
              )
            ))}


          </svg>
        </div>

        {/* Tooltip - rendered outside overflow-hidden for proper visibility */}
        {tooltipHole && tooltipPosition && (
          <div
            className="absolute bg-gray-800 border border-gray-600 rounded px-2 py-1 pointer-events-none z-50 text-xs text-gray-100"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 100}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold">H{tooltipHole.holeNumber}</div>
            <div className="text-gray-300">Par: {tooltipHole.par}</div>
            <div className="text-gray-300">Score: {tooltipHole.score ?? '-'}</div>
            {tooltipHole.dkPoints !== undefined && tooltipHole.dkPoints !== null && (
              <div className="text-yellow-400">DK: {tooltipHole.dkPoints}</div>
            )}
          </div>
        )}
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
  tournamentId,
  tournamentStatus,
  currentHole,
  onRoundClick,
  skillLevel,
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
  tournamentId?: string
  tournamentStatus: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
  currentHole?: string | null
  onRoundClick?: (playerId: string, round: number) => void
  skillLevel?: number
}) {
  if (tournamentStatus === 'SCHEDULED') {
    return null
  }

  const [realHolesCache, setRealHolesCache] = useState<Record<number, HoleResult[] | null>>({})
  const [loadingRound, setLoadingRound] = useState<number | null>(null)

  // Fetch real holes for selected round when tournament and player IDs are available
  useEffect(() => {
    if (!tournamentId || !playerId || !selectedRound || realHolesCache[selectedRound] !== undefined) {
      return
    }

    setLoadingRound(selectedRound)
    fetchRealHoles(tournamentId, playerId, selectedRound).then((holes) => {
      setRealHolesCache((prev) => ({ ...prev, [selectedRound]: holes }))
      setLoadingRound(null)
    })
  }, [tournamentId, playerId, selectedRound, realHolesCache])

  const roundsData = useMemo<RoundData[]>(() => {
    const roundArray = [
      { round: 1, relToPar: round1RelToPar, dkPoints: round1DkPoints },
      { round: 2, relToPar: round2RelToPar, dkPoints: round2DkPoints },
      { round: 3, relToPar: round3RelToPar, dkPoints: round3DkPoints },
      { round: 4, relToPar: round4RelToPar, dkPoints: round4DkPoints },
    ]

    return roundArray
      .filter((r) => r.relToPar !== null && r.relToPar !== undefined)
      .map((r) => {
        // Use only real holes from cache - no mock generation
        const realHoles = realHolesCache[r.round]
        
        console.log('[v0] RoundDNA: Round data source', {
          round: r.round,
          hasRealData: realHoles !== null && realHoles !== undefined,
          holesCount: realHoles?.length ?? 0,
          source: realHoles !== null && realHoles !== undefined ? 'persisted hole_scores' : 'none - using unavailable state',
          relToPar: r.relToPar,
          dkPoints: r.dkPoints,
          cacheStatus: realHoles === undefined ? 'not_fetched' : realHoles === null ? 'fetched_but_empty' : 'fetched_success'
        })
        
        return {
          round: r.round,
          relToPar: r.relToPar!,
          dkPoints: r.dkPoints,
          holes: realHoles ?? [], // Empty array if no real data
        }
      })
  }, [round1RelToPar, round2RelToPar, round3RelToPar, round4RelToPar, round1DkPoints, round2DkPoints, round3DkPoints, round4DkPoints, realHolesCache, skillLevel])

  const selectedRoundData = roundsData.find((r) => r.round === selectedRound)

  if (!selectedRoundData) {
    return (
      <div className="flex items-center justify-center h-12 text-muted-foreground text-sm">
        Did not play R{selectedRound}
      </div>
    )
  }

  // If no real holes available, show unavailable state
  if (selectedRoundData.holes.length === 0) {
    return (
      <div className="flex items-center justify-center h-12 text-muted-foreground text-sm">
        Scorecard data unavailable
      </div>
    )
  }

  return (
    <RoundDnaRow
      round={selectedRoundData.round}
      holes={selectedRoundData.holes}
      relToPar={selectedRoundData.relToPar}
      playerId={playerId}
      tournamentId={tournamentId}
      onRoundClick={onRoundClick}
    />
  )
})
