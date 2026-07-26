'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { PlayerRoundScorecardData } from '../actions/get-player-round-scorecard'
import { ScorecardHeroHeader } from './scorecard-hero-header'
import { ScorecardStatsCards } from './scorecard-stats-cards'
import { ScorecardSidebar } from './scorecard-sidebar'
import { ScorecardModalLayout } from './scorecard-modal-layout'
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
  /** Tournament phase for future layout routing. */
  phase?: 'scheduled' | 'live' | 'completed'
  /** Force mobile layout when rendered inside a drawer. */
  isDrawerContext?: boolean
}

export function ExpandedPlayerScorecard({
  data,
  isLoading = false,
  players = [],
  currentPlayerIndex = 0,
  onPlayerChange,
  phase = 'scheduled',
  isDrawerContext = false,
}: ExpandedPlayerScorecardProps) {


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
      {/* Desktop Layout - lg and above (hidden in drawer context) */}
      <div className={cn(isDrawerContext ? 'hidden' : 'hidden lg:block', 'h-full min-h-0')}>
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

      {/* Mobile Layout - below lg or in drawer context */}
      <div className={cn(isDrawerContext ? 'block' : 'lg:hidden', 'w-full min-w-0 max-w-full flex flex-col gap-4')}>
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
