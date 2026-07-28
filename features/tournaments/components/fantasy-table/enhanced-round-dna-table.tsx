'use client'

import { useMemo, useState } from 'react'
import { HoleScoreCircle } from './hole-score-circle'
import {
  calculateCumulativeScores,
  calculateXPosition,
  calculateYPosition,
  generateTrendLinePath,
  formatToPar,
  getHoleDotColor,
  getHoleStatus,
  findBestAndWorstHoles,
  calculateRoundTotals,
  HoleData,
  RoundDnaPoint
} from '@/features/tournaments/utils/round-dna-helpers'

interface EnhancedRoundDnaTableProps {
  holes: HoleData[]
  round: number
}

const SVG_WIDTH = 400
const SVG_HEIGHT = 60
const SCALE = { min: -15, max: 15 }
const PADDING = 8

export function EnhancedRoundDnaTable({ holes, round }: EnhancedRoundDnaTableProps) {
  const [hoveredHole, setHoveredHole] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [tooltipHole, setTooltipHole] = useState<HoleData | null>(null)
  
  const completedHoles = useMemo(() => holes.filter(h => h.toPar !== null), [holes])
  const { bestHole, worstHole } = useMemo(() => findBestAndWorstHoles(holes), [holes])
  const cumulativeMap = useMemo(() => calculateCumulativeScores(completedHoles), [completedHoles])
  
  const points: RoundDnaPoint[] = useMemo(() => {
    return completedHoles.map(hole => {
      const cumulativeToPar = cumulativeMap.get(hole.holeNumber) || 0
      return {
        holeNumber: hole.holeNumber,
        x: calculateXPosition(hole.holeNumber, SVG_WIDTH),
        y: calculateYPosition(cumulativeToPar, SVG_HEIGHT, SCALE),
        toPar: hole.toPar || 0,
        cumulativeToPar,
        hole
      }
    })
  }, [completedHoles, cumulativeMap])
  
  const trendLinePath = useMemo(() => generateTrendLinePath(points), [points])
  const totals = useMemo(() => calculateRoundTotals(holes), [holes])
  
  if (completedHoles.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-white/40 text-sm">
        No scorecard data
      </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-4">
      {/* Main SVG Chart */}
      <div className="relative overflow-x-auto bg-white/[0.02] border border-white/[0.05] rounded-lg p-4">
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="min-w-max"
        >
          {/* Horizontal baseline (Par = 0) */}
          <line
            x1={PADDING}
            y1={SVG_HEIGHT / 2}
            x2={SVG_WIDTH - PADDING}
            y2={SVG_HEIGHT / 2}
            stroke="rgb(75, 85, 99)"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.5"
          />
          
          {/* Trend line */}
          {trendLinePath && (
            <path
              d={trendLinePath}
              fill="none"
              stroke="rgb(99, 102, 241)"
              strokeWidth="1.5"
              opacity="0.7"
            />
          )}
          
          {/* Dots with labels */}
          {points.map(point => {
            const isHovered = hoveredHole === point.holeNumber
            const isBest = bestHole?.holeNumber === point.holeNumber && point.toPar <= -1
            const isWorst = worstHole?.holeNumber === point.holeNumber && point.toPar >= 2
            const color = getHoleDotColor(getHoleStatus(point.toPar))
            
            return (
              <g key={`dot-${point.holeNumber}`}>
                {/* Highlight rings */}
                {isBest && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={7}
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                )}
                {isWorst && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={7}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                )}
                
                {/* To-par label */}
                <text
                  x={point.x}
                  y={point.y - 8}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="500"
                  fill={color}
                  pointerEvents="none"
                >
                  {formatToPar(point.toPar)}
                </text>
                
                {/* Dot */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={3}
                  fill={color}
                  opacity={isHovered ? 1 : 0.8}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => {
                    setHoveredHole(point.holeNumber)
                    setTooltipHole(point.hole)
                    setTooltipPos({ x: point.x, y: point.y })
                  }}
                  onMouseLeave={() => {
                    setHoveredHole(null)
                    setTooltipPos(null)
                  }}
                />
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* Hole numbers */}
      <div className="flex gap-1 px-4 text-7px text-white/60 font-mono">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i + 1} className="w-5 text-center">
            {i + 1}
          </div>
        ))}
      </div>
      
      {/* Hole scores */}
      <div className="flex gap-1 px-4">
        {holes.map(hole => (
          <div key={`score-${hole.holeNumber}`} className="w-5 flex justify-center">
            <HoleScoreCircle
              score={hole.score}
              par={hole.par}
              toPar={hole.toPar}
              size="sm"
            />
          </div>
        ))}
      </div>
      
      {/* Front 9 / Back 9 totals */}
      <div className="grid grid-cols-3 gap-4 px-4 text-xs">
        <div className="flex items-center gap-2 text-white/70">
          <span className="text-7px font-semibold">OUT</span>
          <span className="text-sm font-bold text-white">
            {formatToPar(totals.outScore)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <span className="text-7px font-semibold">IN</span>
          <span className="text-sm font-bold text-white">
            {formatToPar(totals.inScore)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <span className="text-7px font-semibold">TOTAL</span>
          <span className="text-sm font-bold text-emerald-300">
            {formatToPar(totals.totalScore)}
          </span>
        </div>
      </div>
    </div>
  )
}
