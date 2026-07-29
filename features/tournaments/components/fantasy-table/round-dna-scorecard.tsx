'use client'

import { memo, useMemo, useState, useRef, useEffect } from 'react'
import { DraftKingsMark } from '../draftkings-mark'
import { cn } from '@/lib/utils'

interface HoleScore {
  holeNumber: number
  score: number | null
  par: number | null
  toPar: number | null
  dkPoints?: number | null
}

interface RoundDnaScorecardProps {
  tournamentId: string
  playerId: string
  round: number
  playerName?: string
  onRoundChange?: (round: number) => void
}

const normalizeHoleResult = (hole: HoleScore): number | null => {
  if (typeof hole.score === 'number' && typeof hole.par === 'number') {
    return hole.score - hole.par
  }
  if (typeof hole.toPar === 'number') {
    return hole.toPar
  }
  return null
}

const getToParColor = (result: number | null): string => {
  if (result === null) return 'text-gray-400'
  if (result < 0) return 'text-green-400'
  if (result === 0) return 'text-gray-400'
  if (result === 1) return 'text-orange-400'
  return 'text-red-400'
}

const getToParBgColor = (result: number | null): string => {
  if (result === null) return 'bg-gray-600'
  if (result < 0) return 'bg-green-600'
  if (result === 0) return 'bg-gray-600'
  if (result === 1) return 'bg-orange-600'
  return 'bg-red-600'
}

const ScoreRow = memo(function ScoreRow({
  label,
  values,
}: {
  label: string
  values: (string | number)[]
}) {
  return (
    <div className="flex border-b border-gray-700/30 text-sm">
      <div className="w-32 px-3 py-2 font-medium text-gray-300 bg-gray-900/50">{label}</div>
      {/* Holes 1-9 */}
      <div className="flex flex-1">
        {values.slice(0, 9).map((val, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 px-2 py-2 text-center border-r border-gray-700/20 text-gray-300"
          >
            {val}
          </div>
        ))}
      </div>
      {/* OUT separator */}
      <div className="w-12 px-2 py-2 text-center font-medium border-r border-gray-600 text-gray-200 bg-gray-900/30">
        {values[9]}
      </div>
      {/* Holes 10-18 */}
      <div className="flex flex-1">
        {values.slice(10, 19).map((val, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 px-2 py-2 text-center border-r border-gray-700/20 text-gray-300"
          >
            {val}
          </div>
        ))}
      </div>
      {/* IN separator */}
      <div className="w-12 px-2 py-2 text-center font-medium border-r border-gray-600 text-gray-200 bg-gray-900/30">
        {values[19]}
      </div>
      {/* TOT */}
      <div className="w-12 px-2 py-2 text-center font-medium text-gray-200 bg-gray-900/30">
        {values[20]}
      </div>
    </div>
  )
})

const CumulativeScoreRow = memo(function CumulativeScoreRow({
  values,
}: {
  values: (string | number)[]
}) {
  return (
    <div className="flex border-b border-gray-700/30 text-sm">
      <div className="w-32 px-3 py-2 font-medium text-gray-300 bg-gray-900/50">
        CUMULATIVE<br />SCORE (TO PAR)
      </div>
      {/* Holes 1-9 */}
      <div className="flex flex-1">
        {values.slice(0, 9).map((val, i) => {
          const numVal = typeof val === 'number' ? val : parseInt(val as string) || 0
          return (
            <div
              key={i}
              className={`flex-1 min-w-0 px-2 py-2 text-center border-r border-gray-700/20 font-medium text-sm ${getToParColor(numVal)}`}
            >
              {val}
            </div>
          )
        })}
      </div>
      {/* OUT separator */}
      <div
        className={`w-12 px-2 py-2 text-center font-medium border-r border-gray-600 text-sm bg-gray-900/30 ${getToParColor(
          typeof values[9] === 'number' ? values[9] : parseInt(values[9] as string) || 0
        )}`}
      >
        {values[9]}
      </div>
      {/* Holes 10-18 */}
      <div className="flex flex-1">
        {values.slice(10, 19).map((val, i) => {
          const numVal = typeof val === 'number' ? val : parseInt(val as string) || 0
          return (
            <div
              key={i}
              className={`flex-1 min-w-0 px-2 py-2 text-center border-r border-gray-700/20 font-medium text-sm ${getToParColor(numVal)}`}
            >
              {val}
            </div>
          )
        })}
      </div>
      {/* IN separator */}
      <div
        className={`w-12 px-2 py-2 text-center font-medium border-r border-gray-600 text-sm bg-gray-900/30 ${getToParColor(
          typeof values[19] === 'number' ? values[19] : parseInt(values[19] as string) || 0
        )}`}
      >
        {values[19]}
      </div>
      {/* TOT */}
      <div
        className={`w-12 px-2 py-2 text-center font-medium text-sm bg-gray-900/30 ${getToParColor(
          typeof values[20] === 'number' ? values[20] : parseInt(values[20] as string) || 0
        )}`}
      >
        {values[20]}
      </div>
    </div>
  )
})

const RoundDnaChart = memo(function RoundDnaChart({
  holeScores,
}: {
  holeScores: HoleScore[]
}) {
  const SVG_WIDTH = 300
  const SVG_HEIGHT = 170
  const PADDING = 20
  const CENTER_Y = SVG_HEIGHT / 2
  const STEP_X = (SVG_WIDTH - PADDING * 2) / 17 // 17 gaps for 18 holes

  // Reference lines
  const referenceLines = [-2, -1, 0, 1, 2]
  const LEVEL_SPACING = (SVG_HEIGHT - PADDING * 2) / 5

  // Calculate points
  const points = holeScores.map((hole, idx) => {
    const result = normalizeHoleResult(hole)
    const displayLevel = result === null ? 0 : Math.max(-2.5, Math.min(2.5, result))
    return {
      x: PADDING + idx * STEP_X,
      y: CENTER_Y + displayLevel * LEVEL_SPACING * -1,
      hole,
      result,
    }
  })

  // Find best and worst holes
  const bestHole = holeScores.reduce((best, hole) => {
    const bestResult = normalizeHoleResult(best)
    const holeResult = normalizeHoleResult(hole)
    if (holeResult === null) return best
    if (bestResult === null) return hole
    return holeResult < bestResult ? hole : best
  }, holeScores[0])

  const worstHole = holeScores.reduce((worst, hole) => {
    const worstResult = normalizeHoleResult(worst)
    const holeResult = normalizeHoleResult(hole)
    if (holeResult === null) return worst
    if (worstResult === null) return hole
    return holeResult > worstResult ? hole : worst
  }, holeScores[0])

  const getDotColor = (result: number | null): string => {
    if (result === null) return '#4B5563'
    if (result <= -2) return '#10B981' // emerald
    if (result === -1) return '#10B981' // green
    if (result === 0) return '#6B7280' // gray
    if (result === 1) return '#F97316' // orange
    return '#EF4444' // red
  }

  return (
    <div className="relative w-full bg-gray-800/30 rounded-lg p-4 border border-gray-700/20">
      <svg
        className="w-full"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ minHeight: '170px' }}
      >
        {/* Reference lines */}
        {referenceLines.map((level) => {
          const y = CENTER_Y - level * LEVEL_SPACING
          return (
            <g key={`ref-${level}`}>
              <line
                x1={PADDING}
                y1={y}
                x2={SVG_WIDTH - PADDING}
                y2={y}
                stroke="#374151"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.3"
              />
              <text
                x={PADDING - 8}
                y={y + 3}
                fontSize="10"
                fill="#6B7280"
                textAnchor="end"
              >
                {level === 0 ? 'E' : level > 0 ? `+${level}` : level}
              </text>
            </g>
          )
        })}

        {/* Line connecting dots */}
        {points.filter((p) => p.result !== null).length > 1 && (
          <polyline
            points={points
              .filter((p) => p.result !== null)
              .map((p) => `${p.x},${p.y}`)
              .join(' ')}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="1.5"
            opacity="0.6"
          />
        )}

        {/* Dots */}
        {points.map((point) => (
          <g key={`dot-${point.hole.holeNumber}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill={getDotColor(point.result)}
              opacity={point.result === null ? 0.4 : 1}
            />

            {/* Best hole marker */}
            {point.hole.holeNumber === bestHole.holeNumber && (
              <text x={point.x} y={point.y + 12} textAnchor="middle" fontSize="14">
                ⭐
              </text>
            )}

            {/* Worst hole marker */}
            {point.hole.holeNumber === worstHole.holeNumber && (
              <text x={point.x} y={point.y - 12} textAnchor="middle" fontSize="14">
                🔥
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
})

const ScoreByHoleRow = memo(function ScoreByHoleRow({
  holeScores,
}: {
  holeScores: HoleScore[]
}) {
  const calculateBadgeValue = (hole: HoleScore): number | null => {
    if (hole.score === null) return null
    return hole.score
  }

  const holes1to9 = holeScores.slice(0, 9)
  const holes10to18 = holeScores.slice(9, 18)

  const out = holes1to9.reduce((sum, h) => sum + (h.score || 0), 0)
  const inn = holes10to18.reduce((sum, h) => sum + (h.score || 0), 0)
  const total = out + inn

  const getBadgeColor = (hole: HoleScore): string => {
    const result = normalizeHoleResult(hole)
    if (result === null) return 'bg-gray-600 text-white'
    if (result <= -2) return 'bg-emerald-600 text-white'
    if (result === -1) return 'bg-green-600 text-white'
    if (result === 0) return 'bg-gray-600 text-white'
    if (result === 1) return 'bg-orange-600 text-white'
    return 'bg-red-600 text-white'
  }

  return (
    <div className="flex border-b border-gray-700/30 text-sm">
      <div className="w-32 px-3 py-2 font-medium text-gray-300 bg-gray-900/50">SCORE BY HOLE</div>
      {/* Holes 1-9 */}
      <div className="flex flex-1">
        {holes1to9.map((hole) => {
          const score = calculateBadgeValue(hole)
          return (
            <div
              key={hole.holeNumber}
              className="flex-1 min-w-0 px-2 py-2 flex justify-center border-r border-gray-700/20"
            >
              {score !== null ? (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${getBadgeColor(hole)}`}
                >
                  {score}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 text-gray-500 font-semibold text-xs">-</div>
              )}
            </div>
          )
        })}
      </div>
      {/* OUT */}
      <div className="w-12 px-2 py-2 flex justify-center font-medium border-r border-gray-600 bg-gray-900/30">
        <div className="font-semibold text-gray-200">{out}</div>
      </div>
      {/* Holes 10-18 */}
      <div className="flex flex-1">
        {holes10to18.map((hole) => {
          const score = calculateBadgeValue(hole)
          return (
            <div
              key={hole.holeNumber}
              className="flex-1 min-w-0 px-2 py-2 flex justify-center border-r border-gray-700/20"
            >
              {score !== null ? (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${getBadgeColor(hole)}`}
                >
                  {score}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 text-gray-500 font-semibold text-xs">-</div>
              )}
            </div>
          )
        })}
      </div>
      {/* IN */}
      <div className="w-12 px-2 py-2 flex justify-center font-medium border-r border-gray-600 bg-gray-900/30">
        <div className="font-semibold text-gray-200">{inn}</div>
      </div>
      {/* TOT */}
      <div className="w-12 px-2 py-2 flex justify-center font-medium bg-gray-900/30">
        <div className="font-semibold text-gray-200">{total}</div>
      </div>
    </div>
  )
})

export const RoundDnaScorecard = memo(function RoundDnaScorecard({
  tournamentId,
  playerId,
  round,
  playerName = 'Player',
  onRoundChange,
}: RoundDnaScorecardProps) {
  const [holeScores, setHoleScores] = useState<HoleScore[]>([])
  const [loading, setLoading] = useState(true)
  const [currentRound, setCurrentRound] = useState(round)

  // Fetch scorecard data
  const fetchScorecard = async (roundNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/players/${playerId}/rounds/${roundNum}/scorecard`
      )
      const data = await res.json()

      if (data.data?.holes) {
        setHoleScores(data.data.holes)
      }
    } catch (error) {
      console.error('Error fetching scorecard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Ensure all 18 holes exist
  const allHoles = useMemo(() => {
    const holes: HoleScore[] = []
    for (let i = 1; i <= 18; i++) {
      const found = holeScores.find((h) => h.holeNumber === i)
      if (found) {
        holes.push(found)
      } else {
        holes.push({
          holeNumber: i,
          score: null,
          par: null,
          toPar: null,
          dkPoints: null,
        })
      }
    }
    return holes
  }, [holeScores])

  // Calculate cumulative scores
  const cumulativeScores = useMemo(() => {
    const cumulative: number[] = []
    let runningTotal = 0

    for (let i = 0; i < 18; i++) {
      const hole = allHoles[i]
      const result = normalizeHoleResult(hole)
      if (result !== null) {
        runningTotal += result
      }
      cumulative.push(runningTotal)
    }

    const out = cumulative[8]
    const inn = cumulative[17]
    const total = out + inn

    return {
      holes: cumulative,
      out,
      inn,
      total,
    }
  }, [allHoles])

  // Handle round change
  const handleRoundChange = (newRound: number) => {
    if (newRound !== currentRound) {
      setCurrentRound(newRound)
      fetchScorecard(newRound)
      onRoundChange?.(newRound)
    }
  }

  // Initialize data on mount
  useEffect(() => {
    fetchScorecard(currentRound)
  }, [])

  if (loading && holeScores.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        Loading scorecard...
      </div>
    )
  }

  const holeLabels = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '10', '11', '12', '13', '14', '15', '16', '17', '18',
  ]
  const parValues = allHoles.map((h) => h.par || '-')
  const scoreValues = allHoles.map((h) => h.score || '-')
  const cumulativeValues = [
    ...cumulativeScores.holes.slice(0, 9),
    cumulativeScores.out,
    ...cumulativeScores.holes.slice(9),
    cumulativeScores.inn,
    cumulativeScores.total,
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">ROUND DNA</h2>

        {/* Round Selector */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4].map((r) => (
            <button
              key={r}
              onClick={() => handleRoundChange(r)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-120 ${
                currentRound === r
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-gray-300'
              }`}
            >
              R{r}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 text-xs text-gray-400 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="text-purple-400">🦅</div>
            <span>Eagle or Better</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>Birdie</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span>Par</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span>Bogey</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span>Double+</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">⭐</span>
            <span>Best Hole</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">🔥</span>
            <span>Worst Hole</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900/50 border border-gray-700/30 rounded-2xl overflow-hidden">
        {/* HOLE row */}
        <ScoreRow
          label="HOLE"
          values={[...holeLabels.slice(0, 9), 'OUT', ...holeLabels.slice(9), 'IN', 'TOT']}
        />

        {/* PAR row */}
        <ScoreRow label="PAR" values={parValues} />

        {/* CUMULATIVE row */}
        <CumulativeScoreRow values={cumulativeValues} />

        {/* SCORE row */}
        <ScoreRow label="SCORE" values={scoreValues} />

        {/* ROUND DNA CHART row */}
        <div className="border-b border-gray-700/30 px-3 py-4">
          <div className="flex gap-3">
            <div className="w-32 font-medium text-gray-300 text-sm">ROUND DNA</div>
            <div className="flex-1">
              <RoundDnaChart holeScores={allHoles} />
            </div>
          </div>
        </div>

        {/* SCORE BY HOLE row */}
        <ScoreByHoleRow holeScores={allHoles} />
      </div>
    </div>
  )
})
