'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { PlayerRoundScorecardData } from '../actions/get-player-round-scorecard'
import { ScorecardHeroHeader } from './scorecard-hero-header'
import { ScorecardStatsCards } from './scorecard-stats-cards'
import { ScorecardSegmentedControl } from './scorecard-segmented-control'
import { ScorecardSidebar } from './scorecard-sidebar'
import { ScorecardModalLayout } from './scorecard-modal-layout'
import { ScorecardMobileHero } from './scorecard-mobile-hero'
import { NineHoleScorecard } from './nine-hole-scorecard'
import { ScorecardLegend } from './scorecard-legend'
import { ScorecardPlayerRoundStats } from './scorecard-player-round-stats'
import { cn } from '@/lib/utils'

interface ExpandedPlayerScorecardProps {
  data: PlayerRoundScorecardData
  isLoading?: boolean
  players?: Array<{
    id: string
    playerName: string
  }>
  currentPlayerIndex?: number
  onPlayerChange?: (index: number) => void
}

function StatCard({
  label,
  value,
  accent = 'default',
}: {
  label: string
  value: string | number
  accent?: 'default' | 'emerald'
}) {
  const isNegative = typeof value === 'number' && value < 0
  const accentClass = accent === 'emerald' ? 'text-emerald-400' : isNegative ? 'text-emerald-400' : 'text-white'

  return (
    <div className="rounded-lg border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] px-6 py-4 text-center min-w-fit">
      <div className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
        {label}
      </div>
      <div className={cn('text-2xl font-bold tabular-nums', accentClass)}>
        {value}
      </div>
    </div>
  )
}

export function ExpandedPlayerScorecard({
  data,
  isLoading = false,
  players = [],
  currentPlayerIndex = 0,
  onPlayerChange,
}: ExpandedPlayerScorecardProps) {
  const [selectedRound, setSelectedRound] = useState(data.roundNumber)

  const allHoles = useMemo(() => {
    const holes = [...data.holes]
    while (holes.length < 18) {
      holes.push({
        holeNumber: holes.length + 1,
        score: null,
        par: null,
        toPar: null,
        dkPoints: null,
      })
    }
    return holes.slice(0, 18)
  }, [data.holes])

  const frontNine = allHoles.slice(0, 9)
  const backNine = allHoles.slice(9, 18)

  const calculateTotals = (holes: typeof allHoles) => {
    const strokes = holes.reduce((sum, h) => sum + (h.score || 0), 0)
    const toPar = holes.reduce((sum, h) => sum + (h.toPar || 0), 0)
    const dkPoints = holes.reduce((sum, h) => sum + (h.dkPoints || 0), 0)
    return { strokes, toPar, dkPoints }
  }

  const outTotal = calculateTotals(frontNine)
  const inTotal = calculateTotals(backNine)
  const totTotal = {
    strokes: outTotal.strokes + inTotal.strokes,
    toPar: outTotal.toPar + inTotal.toPar,
    dkPoints: outTotal.dkPoints + inTotal.dkPoints,
  }

  const coursePar = data.courseHoles
    ? data.courseHoles.slice(0, 9).reduce((sum, h) => sum + (h.par || 0), 0) +
      data.courseHoles.slice(9, 18).reduce((sum, h) => sum + (h.par || 0), 0)
    : null

  const rounds = ['R1', 'R2', 'R3', 'R4']

  return (
    <div className="w-full min-w-0">
      {/* Desktop Layout */}
      <div className="hidden lg:block w-full min-w-0 space-y-8">
        {/* TOP: Hero Header */}
        <div className="flex items-start justify-between gap-8">
          {/* Left: Player Info */}
          <div className="flex-1 min-w-0">
            <ScorecardHeroHeader
              playerName={data.playerName}
              headshotUrl={data.headshotUrl ?? null}
              countryCode={null}
              position={data.currentPosition}
              totalScore={data.totalToPar}
              totalStrokes={data.totalStrokes}
            />
          </div>

          {/* Right: Stats Cards (Score, Position, DK Points, Strokes) */}
          <div className="flex-shrink-0 flex gap-4">
            <StatCard label="Score" value={data.totalToPar ?? '—'} accent="emerald" />
            <StatCard label="Position" value={data.currentPosition ? `${data.currentPosition}` : '—'} />
            <StatCard label="DK Points" value={data.totalDkPoints ?? '—'} />
            <StatCard label="Strokes" value={data.totalStrokes ?? '—'} />
          </div>
        </div>

        {/* Round Selector */}
        <div className="flex justify-center">
          <ScorecardSegmentedControl
            rounds={rounds}
            activeRound={`R${selectedRound}`}
            onRoundChange={(round) => setSelectedRound(Number(round[1]))}
          />
        </div>

        {/* BODY: Two-Column Layout (70% Scorecards + 30% Stats) */}
        <div className="grid grid-cols-7 gap-8">
          {/* Left Column: Scorecards (70%) */}
          <div className="col-span-5 space-y-6">
            {/* Front 9 and Back 9 Side-by-Side */}
            <div className="grid grid-cols-2 gap-6">
              <NineHoleScorecard
                label="FRONT 9"
                holes={frontNine}
                courseHoles={data.courseHoles?.slice(0, 9)}
                total={outTotal}
                isDesktop
              />
              <NineHoleScorecard
                label="BACK 9"
                holes={backNine}
                courseHoles={data.courseHoles?.slice(9, 18)}
                total={inTotal}
                totTotal={totTotal}
                isDesktop
              />
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-white/[0.05]">
              <ScorecardLegend isDesktop />
            </div>
          </div>

          {/* Right Column: Round Summary (30%) */}
          <div className="col-span-2">
            <ScorecardPlayerRoundStats
              holes={allHoles}
              courseHoles={data.courseHoles}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout - Stacked, Optimized */}
      <div className="lg:hidden w-full min-w-0 flex flex-col gap-4">
        {/* Compact Player Hero with 2-Column Metrics */}
        <ScorecardMobileHero
          playerName={data.playerName}
          headshotUrl={data.headshotUrl ?? null}
          position={data.currentPosition}
          totalScore={data.totalToPar}
          totalStrokes={data.totalStrokes}
          dkFantasyPoints={data.totalDkPoints}
          courseName={data.courseName}
          coursePar={coursePar}
        />

        {/* Full-Width Round Selector */}
        <div className="w-full">
          <ScorecardSegmentedControl
            rounds={rounds}
            activeRound={`R${selectedRound}`}
            onRoundChange={(round) => setSelectedRound(Number(round[1]))}
          />
        </div>

        {/* Stacked Scorecards - Each Can Scroll Horizontally */}
        <div className="w-full min-w-0 max-w-full space-y-3">
          <NineHoleScorecard
            label="FRONT 9"
            holes={frontNine}
            courseHoles={data.courseHoles?.slice(0, 9)}
            total={outTotal}
            isDesktop={false}
          />
          <NineHoleScorecard
            label="BACK 9"
            holes={backNine}
            courseHoles={data.courseHoles?.slice(9, 18)}
            total={inTotal}
            totTotal={totTotal}
            isDesktop={false}
          />
        </div>

        {/* Legend */}
        <div className="w-full min-w-0 max-w-full pt-2 border-t border-white/[0.05]">
          <ScorecardLegend isDesktop={false} />
        </div>
      </div>
    </div>
  )
}
