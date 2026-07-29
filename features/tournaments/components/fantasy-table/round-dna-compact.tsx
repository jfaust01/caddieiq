'use client'

import { memo, useMemo, useState, useEffect, useRef } from 'react'
import { DraftKingsMark } from '../draftkings-mark'
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

/**
 * Normalize hole result to a single true value
 * Priority: (score - par) > provider toPar > null
 */
const normalizeHoleResult = (hole: HoleResult): number | null => {
  // Calculate from score and par if available (most reliable)
  if (typeof hole.score === 'number' && typeof hole.par === 'number') {
    return hole.score - hole.par
  }
  
  // Fall back to provider relativeToPar
  if (typeof hole.relativeToPar === 'number') {
    return hole.relativeToPar
  }
  
  return null
}

const getDotColorFromNormalizedResult = (normalizedResult: number | null): string => {
  if (normalizedResult === null || normalizedResult === undefined) return '#4B5563'
  
  const level = Math.max(-3, Math.min(3, normalizedResult))
  
  // Under par (green shades)
  if (level === -1) return '#10B981' // green
  if (level === -2) return '#059669' // emerald
  if (level <= -3) return '#7C3AED' // purple
  
  // Par (gray)
  if (level === 0) return '#6B7280' // gray
  
  // Over par (red shades) - all positive scores use red to match to-par styling
  if (level === 1) return '#EF4444' // red (matches to-par + color)
  if (level === 2) return '#EF4444' // red
  if (level >= 3) return '#EF4444' // red
  
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
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [tooltipHole, setTooltipHole] = useState<HoleResult | null>(null)

  const PADDING = 8
  const SVG_WIDTH = 300
  const USABLE_WIDTH = SVG_WIDTH - 2 * PADDING
  const DOT_GAP = 5 // 5px max gap between each dot
  const STEP_X = (USABLE_WIDTH - DOT_GAP * 18) / 18 + DOT_GAP
  const SVG_HEIGHT = 60
  const CENTER_Y = SVG_HEIGHT / 2 + 5 // offset down slightly to make room for labels above

  const LEVEL_SPACING = 4 // pixels between each level above/below par
  
  const completedPoints = useMemo(
    () => {
      const levelSpacing = LEVEL_SPACING
      return holes
        .map((hole) => {
          const normalizedResult = normalizeHoleResult(hole)
          const displayLevel = normalizedResult === null ? 0 : Math.max(-3, Math.min(3, normalizedResult))
          const yOffset = -displayLevel * levelSpacing
          
          return {
            x: PADDING + (hole.holeNumber - 1) * STEP_X + STEP_X / 2,
            y: CENTER_Y + yOffset,
            hole,
            normalizedResult,
          }
        })
        .filter((point) => point.hole.score !== null && point.hole.score !== undefined)
    },
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
        <div className="flex-1 min-w-0 overflow-hidden relative" ref={svgContainerRef}>
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

              const lineColor = getDotColorFromNormalizedResult(endPoint.normalizedResult)
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
                fill={getDotColorFromNormalizedResult(point.normalizedResult)}
                opacity={point.hole.score === null ? 0.4 : 1}
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
            
            {/* To-par labels above dots */}
            {completedPoints.map((point) => {
              const labelText = point.normalizedResult === null ? '-' :
                point.normalizedResult === 0 ? 'E' :
                point.normalizedResult > 0 ? `+${point.normalizedResult}` :
                `${point.normalizedResult}`
              
              return (
                <text
                  key={`label-${point.hole.holeNumber}`}
                  x={point.x}
                  y={point.y - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="500"
                  fill={getDotColorFromNormalizedResult(point.normalizedResult)}
                  pointerEvents="none"
                >
                  {labelText}
                </text>
              )
            })}
          </svg>
        </div>
      </div>

        {/* Premium tooltip - rendered outside overflow-hidden container for proper visibility */}
      {tooltipHole && tooltipPosition && (() => {
          const normalizedResult = normalizeHoleResult(tooltipHole)
          
          // Map normalized result to golf terminology
          const getGolfTerminology = (result: number | null) => {
            if (result === null) return 'Unknown'
            if (result <= -3) return 'Albatross'
            if (result === -2) return 'Eagle'
            if (result === -1) return 'Birdie'
            if (result === 0) return 'Par'
            if (result === 1) return 'Bogey'
            if (result === 2) return 'Double Bogey'
            return 'Triple Bogey+'
          }
          
          // Get text color for result (no background)
          const getResultColor = (result: number | null) => {
            if (result === null) return 'text-gray-400'
            if (result <= -3) return 'text-purple-400' // Albatross
            if (result === -2) return 'text-emerald-400' // Eagle
            if (result === -1) return 'text-green-400' // Birdie
            if (result === 0) return 'text-gray-400' // Par
            if (result === 1) return 'text-amber-400' // Bogey
            if (result === 2) return 'text-orange-400' // Double Bogey
            return 'text-red-400' // Triple+
          }
          
          // Get to-par display color
          const getToParColor = (result: number | null) => {
            if (result === null) return 'text-gray-400'
            if (result < 0) return 'text-emerald-400'
            if (result === 0) return 'text-gray-400'
            return 'text-red-400'
          }
          
          // Get DK points color
          const getDkPointsColor = (points: number | null | undefined) => {
            if (points === null || points === undefined) return 'text-gray-400'
            if (points > 0) return 'text-emerald-400'
            if (points === 0) return 'text-gray-400'
            return 'text-red-400'
          }
          
          const golfTerm = getGolfTerminology(normalizedResult)
          const toParDisplay = normalizedResult === null ? '-' : 
            normalizedResult === 0 ? 'E' :
            normalizedResult > 0 ? `+${normalizedResult}` : 
            `${normalizedResult}`
          
          // Calculate viewport coordinates for fixed positioning
          // This prevents clipping since tooltip is no longer constrained by parent overflow
          let viewportLeft = 0
          let viewportTop = 0
          let transformStyle = 'translate(-50%, -100%)'
          
          if (svgContainerRef.current) {
            const rect = svgContainerRef.current.getBoundingClientRect()
            // Convert SVG coordinates to viewport coordinates
            const dotViewportX = rect.left + (tooltipPosition.x / SVG_WIDTH) * rect.width
            const dotViewportY = rect.top + (tooltipPosition.y / SVG_HEIGHT) * rect.height
            
            viewportLeft = dotViewportX
            viewportTop = dotViewportY - 12
            
            // Smart positioning for edges
            const TOOLTIP_WIDTH = 240
            const PADDING = 16
            
            // Check if centered position would go off-screen
            if (dotViewportX - TOOLTIP_WIDTH / 2 < PADDING) {
              // Left edge - align left
              transformStyle = 'translate(0, -100%)'
              viewportLeft = Math.max(PADDING, dotViewportX - 8)
            } else if (dotViewportX + TOOLTIP_WIDTH / 2 > window.innerWidth - PADDING) {
              // Right edge - align right
              transformStyle = 'translate(-100%, -100%)'
              viewportLeft = Math.min(window.innerWidth - PADDING, dotViewportX + 8)
            }
          }
          
          return (
            <div
              className="fixed pointer-events-auto z-50 opacity-100 scale-100 transition-all duration-[120ms] ease-out"
              style={{
                left: `${viewportLeft}px`,
                top: `${viewportTop}px`,
                transform: transformStyle,
              }}
            >
              {/* Premium glass panel tooltip */}
              <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg">
                {/* Header */}
                <div className="px-3 pt-3 pb-2 border-b border-gray-700/30">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-white text-sm">Hole {tooltipHole.holeNumber}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      tooltipHole.par === 3 ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' :
                      tooltipHole.par === 4 ? 'bg-gray-600/20 text-gray-300 border border-gray-500/30' :
                      'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      Par {tooltipHole.par}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="px-3 py-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Score</span>
                    <span className="font-semibold text-white">{tooltipHole.score ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Result</span>
                    <span className={`font-semibold ${getResultColor(normalizedResult)}`}>{golfTerm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">To Par</span>
                    <span className={`font-semibold ${getToParColor(normalizedResult)}`}>{toParDisplay}</span>
                  </div>
                  {tooltipHole.dkPoints !== undefined && tooltipHole.dkPoints !== null && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <DraftKingsMark className="h-3 w-auto" />
                        <span className="text-gray-400">Points</span>
                      </div>
                      <span className="font-semibold text-orange-400">
                        {tooltipHole.dkPoints > 0 ? '+' : ''}{tooltipHole.dkPoints.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
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
