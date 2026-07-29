'use client'

import { PlayerRoundScorecardData } from '../actions/get-player-round-scorecard'
import { NineHoleScorecard } from './nine-hole-scorecard'
import { ScorecardLegend } from './scorecard-legend'
import { ScorecardRoundSelector } from './scorecard-components/scorecard-round-selector'

interface DesktopScorecardLayoutProps {
  currentRound: number
  onRoundSelect?: (round: number) => void
  data: PlayerRoundScorecardData
  frontNine: Array<{ holeNumber: number; score: number | null; par: number | null; toPar: number | null; dkPoints: number | null }>
  backNine: Array<{ holeNumber: number; score: number | null; par: number | null; toPar: number | null; dkPoints: number | null }>
  outTotal: { strokes: number; toPar: number; dkPoints: number }
  inTotal: { strokes: number; toPar: number; dkPoints: number }
  totTotal: { strokes: number; toPar: number; dkPoints: number }
  coursePar: number | null
}

export function ScorecardDesktopLayout({
  currentRound,
  onRoundSelect,
  data,
  frontNine,
  backNine,
  outTotal,
  inTotal,
  totTotal,
  coursePar,
}: DesktopScorecardLayoutProps) {
  const playerInitials = data.playerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const formatToParDisplay = (value: number | null) => {
    if (value === null) return '—'
    if (value === 0) return 'E'
    return (value > 0 ? '+' : '') + value
  }

  const getToParColor = (value: number | null) => {
    if (value === null) return 'text-white'
    if (value < 0) return 'text-emerald-400'
    if (value === 0) return 'text-white'
    return 'text-red-500'
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-0">
      {/* Round Selector */}
      <div className="flex-shrink-0 px-4 py-4">
        <ScorecardRoundSelector currentRound={currentRound} phase="completed" onRoundSelect={onRoundSelect} />
      </div>

      {/* Main Content Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto mt-5">
        <div className="min-w-0">
          {/* Scorecards */}
          <div className="min-w-0 flex flex-col gap-4">
            {/* Front 9 and Back 9 Stacked */}
            <div className="flex min-w-0 flex-col gap-4">
              <NineHoleScorecard
                label="FRONT 9"
                holes={frontNine}
                courseHoles={data.courseHoles?.slice(0, 9)}
                total={outTotal}
                isDesktop={true}
              />
              <NineHoleScorecard
                label="BACK 9"
                holes={backNine}
                courseHoles={data.courseHoles?.slice(9, 18)}
                total={inTotal}
                totTotal={totTotal}
                isDesktop={true}
              />
            </div>

            {/* Legend */}
            <div className="pt-2">
              <ScorecardLegend isDesktop={true} />
            </div>

            {/* Bottom Stat Strip */}
            <div className="grid grid-cols-8 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] divide-x divide-white/[0.05]">
              <StatSegment label="Eagles" value={frontNine.filter(h => h.toPar! < -1).length + backNine.filter(h => h.toPar! < -1).length} />
              <StatSegment label="Birdies" value={frontNine.filter(h => h.toPar === -1).length + backNine.filter(h => h.toPar === -1).length} color="emerald" />
              <StatSegment label="Pars" value={frontNine.filter(h => h.toPar === 0).length + backNine.filter(h => h.toPar === 0).length} />
              <StatSegment label="Bogeys" value={frontNine.filter(h => h.toPar === 1).length + backNine.filter(h => h.toPar === 1).length} color="red" />
              <StatSegment label="Double+" value={frontNine.filter(h => h.toPar! > 1).length + backNine.filter(h => h.toPar! > 1).length} />
              <StatSegment label="Fairways" value="9/14" />
              <StatSegment label="GIR" value="14/18" color="emerald" />
              <StatSegment label="Putts" value="29" />
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}

function StatSegment({
  label,
  value,
  color = 'default',
}: {
  label: string
  value: number | string
  color?: 'default' | 'emerald' | 'red'
}) {
  const valueColor = {
    default: 'text-white',
    emerald: 'text-emerald-400',
    red: 'text-red-500',
  }[color]

  return (
    <div className="flex flex-col items-center justify-center py-3 px-2">
      <div className={`text-lg font-semibold tabular-nums ${valueColor}`}>
        {value}
      </div>
      <div className="text-xs text-white/60 uppercase tracking-widest mt-1">
        {label}
      </div>
    </div>
  )
}
