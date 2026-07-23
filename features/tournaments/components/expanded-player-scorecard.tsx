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
import { ScorecardDesktopLayout } from './scorecard-desktop-layout'
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
    <div className="w-full h-full min-w-0 max-w-full flex flex-col">
      {/* Desktop Layout - lg and above */}
      <div className="hidden lg:block h-full min-h-0">
        <ScorecardDesktopLayout
          data={data}
          selectedRound={selectedRound}
          onRoundChange={setSelectedRound}
          frontNine={frontNine}
          backNine={backNine}
          outTotal={outTotal}
          inTotal={inTotal}
          totTotal={totTotal}
          coursePar={coursePar}
        />
      </div>

      {/* Mobile Layout - below lg */}
      <div className="lg:hidden w-full min-w-0 max-w-full flex flex-col gap-4">
          {/* Compact Player Hero with 2-Column Metrics */}
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
          <div className="w-full min-w-0">
            <ScorecardSegmentedControl
              rounds={rounds}
              activeRound={`R${selectedRound}`}
              onRoundChange={(round) => setSelectedRound(Number(round[1]))}
            />
          </div>

          {/* Stacked Scorecards - Responsive to container width */}
          <div className="w-full min-w-0 max-w-full grid gap-3 @4xl/scorecard:grid-cols-2">
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
