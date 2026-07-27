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

async function fetchRealHoles(tournamentId: string, playerId: string, round: number): Promise<HoleResult[] | null> {
  try {
    const response = await fetch(
      `/api/tournaments/${tournamentId}/players/${playerId}/rounds/${round}/scorecard`
    )
    
    if (!response.ok) {
      console.error('[v0] Failed to fetch holes:', response.status)
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
    console.error('[v0] Error fetching real holes:', error)
    return null
  }
}

function generateMockHoles(relToPar: number, round: number, playerId: string = '', skillLevel: number = 50): HoleResult[] {
  const holes: HoleResult[] = []
  const targetDeviation = relToPar
  const seed = playerId + '-r' + round
  
  // Skill level affects score distribution (0-100, where 100 is pro level)
  // Higher skill = more birdies and eagles, fewer bogeys
  const skillFactor = Math.max(0, Math.min(100, skillLevel)) / 100
  
  // Generate random scores for all holes with skill-based distribution
  const holeScores: number[] = []
  for (let hole = 1; hole <= 18; hole++) {
    const rand = seededHoleRandom(seed, hole, 0)
    const rand2 = seededHoleRandom(seed, hole, 1)
    let score = 0
    
    // Skill-adjusted weighted distribution with full range of scores
    // Higher skilled players get better scores
    const albatrossThreshold = 0.005 + (skillFactor * 0.015)    // 0.5%-2% albatross
    const eagleThreshold = albatrossThreshold + (0.02 + (skillFactor * 0.08))        // 2%-10% eagles
    const birdieThreshold = eagleThreshold + (0.15 + (skillFactor * 0.15))  // 15%-30% birdies
    const parThreshold = birdieThreshold + (0.35 + ((1 - skillFactor) * 0.2))  // 35%-55% pars
    const bogeyThreshold = parThreshold + (0.25 - (skillFactor * 0.12))  // 13%-25% bogeys
    const doubleThreshold = bogeyThreshold + (0.08 - (skillFactor * 0.05))  // 3%-8% double bogeys
    const tripleThreshold = doubleThreshold + (0.03 - (skillFactor * 0.02))  // 1%-3% triple bogeys
    
    if (rand < albatrossThreshold) {
      score = -3  // Albatross (rare)
    } else if (rand < eagleThreshold) {
      score = -2  // Eagle
    } else if (rand < birdieThreshold) {
      score = -1  // Birdie
    } else if (rand < parThreshold) {
      score = 0   // Par
    } else if (rand < bogeyThreshold) {
      score = 1   // Bogey
    } else if (rand < doubleThreshold) {
      score = 2   // Double Bogey
    } else if (rand < tripleThreshold) {
      score = 3   // Triple Bogey
    } else {
      // Very rare - quadruple or worse (only for lower skilled players)
      score = skillFactor > 0.6 ? 3 : (rand2 < 0.3 ? 4 : 3)
    }
    
    holeScores.push(score)
  }
  
  // Calculate current total and adjust to match target
  let currentTotal = holeScores.reduce((a, b) => a + b, 0)
  let deviation = currentTotal - targetDeviation
  
  // Adjust holes to match target while maintaining variety
  let adjustmentPasses = 0
  while (Math.abs(deviation) > 0.1 && adjustmentPasses < 5) {
    for (let i = 0; i < 18 && Math.abs(deviation) > 0.1; i++) {
      if (deviation > 0.5) {
        // Need to improve score
        if (holeScores[i] < 4) {
          const adjustment = Math.min(1, deviation)
          holeScores[i] += adjustment
          deviation -= adjustment
        }
      } else if (deviation < -0.5) {
        // Need to worsen score
        if (holeScores[i] > -3) {
          const adjustment = Math.min(1, Math.abs(deviation))
          holeScores[i] -= adjustment
          deviation += adjustment
        }
      }
    }
    adjustmentPasses++
  }
  
  // Create hole results with adjusted scores
  for (let hole = 1; hole <= 18; hole++) {
    const holeRelToPar = Math.round(holeScores[hole - 1] * 2) / 2  // Round to nearest 0.5
    
    // Determine status based on hole's relative to par value
    let status: HoleResult['status'] = 'par'
    if (holeRelToPar <= -3) status = 'albatross'
    else if (holeRelToPar === -2) status = 'eagle'
    else if (holeRelToPar === -1) status = 'birdie'
    else if (holeRelToPar === 0) status = 'par'
    else if (holeRelToPar === 1) status = 'bogey'
    else if (holeRelToPar === 2) status = 'double'
    else if (holeRelToPar >= 3) status = 'triplePlus'
    
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
  const USABLE_WIDTH = 480 - 2 * PADDING
  const DOT_GAP = 5 // 5px max gap between each dot
  const STEP_X = (USABLE_WIDTH - DOT_GAP * 18) / 18 + DOT_GAP
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

        {/* Tooltip - rendered outside overflow-hidden for proper visibility */}
        {tooltipHole && tooltipPosition && (
          <div
            className="absolute bg-gray-800 border border-gray-600 rounded px-2 py-1 pointer-events-none z-50 text-xs text-gray-100"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 40}px`,
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
        // Use real holes from cache if available, otherwise generate mock
        const realHoles = realHolesCache[r.round]
        const holes = realHoles ?? generateMockHoles(r.relToPar!, r.round, playerId, skillLevel)
        
        return {
          round: r.round,
          relToPar: r.relToPar!,
          dkPoints: r.dkPoints,
          holes,
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
