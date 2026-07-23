'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { PlayerRoundScorecardData } from '../actions/get-player-round-scorecard'
import { ScorecardHeroHeader } from './scorecard-hero-header'
import { ScorecardStatsCards } from './scorecard-stats-cards'
import { ScorecardSegmentedControl } from './scorecard-segmented-control'
import { ScorecardSidebar } from './scorecard-sidebar'
import { ScorecardModalLayout } from './scorecard-modal-layout'
import { NineHoleScorecard } from './nine-hole-scorecard'
import { ScorecardLegend } from './scorecard-legend'
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
    <div className="w-full min-w-0">
      {/* Desktop Layout */}
      <div className="hidden lg:block w-full min-w-0">
        <ScorecardModalLayout>
          {/* Hero Header */}
          <div className="mb-6">
            <ScorecardHeroHeader
              playerName={data.playerName}
              headshotUrl={data.headshotUrl ?? null}
              countryCode={null}
              position={data.currentPosition}
              totalScore={data.totalToPar}
              totalStrokes={data.totalStrokes}
            />
          </div>

          {/* Stats Cards */}
          <div className="mb-6">
            <ScorecardStatsCards
              dkFantasyPoints={data.totalDkPoints}
              dfsSalary={data.dfsSalary ?? null}
              ownership={data.ownershipPercent ?? null}
              averageScore={null}
            />
          </div>

          {/* Segmented Control */}
          <div className="mb-6 flex justify-center">
            <ScorecardSegmentedControl
              rounds={rounds}
              activeRound={`R${selectedRound}`}
              onRoundChange={(round) => setSelectedRound(Number(round[1]))}
            />
          </div>

          {/* Two-Column Layout: Scorecard + Sidebar */}
          <div className="grid grid-cols-3 gap-6">
            {/* Main Scorecard Column (75%) */}
            <div className="col-span-2 space-y-4">
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

            {/* Sidebar Column (25%) */}
            <div className="col-span-1">
              <ScorecardSidebar
                items={[
                  { label: 'Course', value: data.courseName },
                  { label: 'Par', value: coursePar },
                  { label: 'Yardage', value: data.courseYardage?.toLocaleString() || null, unit: ' yds' },
                  { label: 'Round', value: `Round ${selectedRound}` },
                  { label: 'Front 9', value: outTotal.strokes, highlight: false },
                  { label: 'Back 9', value: inTotal.strokes, highlight: false },
                ]}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-white/[0.05]">
            <ScorecardLegend isDesktop />
          </div>
        </ScorecardModalLayout>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full min-w-0 px-4">
        <div className="space-y-4">
          {/* Hero Header */}
          <ScorecardHeroHeader
            playerName={data.playerName}
            headshotUrl={data.headshotUrl ?? null}
            countryCode={null}
            position={data.currentPosition}
            totalScore={data.totalToPar}
            totalStrokes={data.totalStrokes}
          />

          {/* Stats Cards */}
          <ScorecardStatsCards
            dkFantasyPoints={data.totalDkPoints}
            dfsSalary={data.dfsSalary ?? null}
            ownership={data.ownershipPercent ?? null}
            averageScore={null}
          />

          {/* Segmented Control */}
          <div className="flex justify-center">
            <ScorecardSegmentedControl
              rounds={rounds}
              activeRound={`R${selectedRound}`}
              onRoundChange={(round) => setSelectedRound(Number(round[1]))}
            />
          </div>

          {/* Mobile Sidebar */}
          <ScorecardSidebar
            items={[
              { label: 'Course', value: data.courseName },
              { label: 'Par', value: coursePar },
              { label: 'Yardage', value: data.courseYardage?.toLocaleString() || null, unit: ' yds' },
            ]}
          />

          {/* Scorecards */}
          <div className="space-y-4">
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
          <div className="pt-4 border-t border-white/[0.05]">
            <ScorecardLegend isDesktop={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
