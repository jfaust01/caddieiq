'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Heart, Info } from 'lucide-react'
import { PlayerRoundScorecardData } from '../actions/get-player-round-scorecard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TourChip } from './tour-chip'
import { ScorecardPlayerHeader } from './scorecard-player-header'
import { ScorecardRoundTabs } from './scorecard-round-tabs'
import { ScorecardRoundSummary } from './scorecard-round-summary'
import { NineHoleScorecard } from './nine-hole-scorecard'
import { ScorecardLegend } from './scorecard-legend'
import { MobilePlayerNavigation } from './mobile-player-navigation'

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
  const [isFavorite, setIsFavorite] = useState(false)

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

  const handlePreviousPlayer = () => {
    if (currentPlayerIndex > 0 && onPlayerChange) {
      onPlayerChange(currentPlayerIndex - 1)
    }
  }

  const handleNextPlayer = () => {
    if (currentPlayerIndex < players.length - 1 && onPlayerChange) {
      onPlayerChange(currentPlayerIndex + 1)
    }
  }

  return (
    <div className="bg-[#0F1117] text-white w-full">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="bg-[#151922] border border-[#343944] rounded-lg overflow-hidden">
          {/* Desktop Header */}
          <ScorecardPlayerHeader
            playerName={data.playerName}
            headshotUrl={data.headshotUrl}
            tour={data.tour}
            position={data.currentPosition}
            scoreToPar={data.totalToPar}
            round1={data.round1Score}
            round2={data.round2Score}
            round3={data.round3Score}
            round4={data.round4Score}
            dfsSalary={data.dfsSalary}
            ownershipPercent={data.ownershipPercent}
            isDesktop
          />

          {/* Desktop Round Selector */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#343944]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#9EA5B1]">Round</span>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1a1f26] border border-[#343944] text-white rounded px-3 py-1 text-sm"
              >
                {[1, 2, 3, 4].map((r) => (
                  <option key={r} value={r}>
                    Round {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#9EA5B1]">
              <span>{data.courseName}</span>
              <span>•</span>
              <span>Par {coursePar || '—'}</span>
              <span>•</span>
              <span>{data.courseYardage?.toLocaleString() || '—'} yds</span>
              <button className="p-1 hover:bg-[#222836] rounded transition-colors">
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Scorecards */}
          <div className="grid grid-cols-2 gap-6 p-6">
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

          {/* Desktop Legend */}
          <div className="border-t border-[#343944] px-6 py-4">
            <ScorecardLegend isDesktop />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="bg-[#151922] border border-[#343944] rounded-lg overflow-hidden">
          {/* Mobile Sticky Header */}
          <div className="sticky top-0 z-20 bg-[#151922] border-b border-[#343944] px-4 py-3 flex items-center justify-between">
            <button
              onClick={handlePreviousPlayer}
              className="p-1 hover:bg-[#222836] rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              <div className="text-sm font-semibold">{data.playerName}</div>
              {data.tour && <TourChip tour={data.tour} />}
            </div>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-1 hover:bg-[#222836] rounded transition-colors"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
            </button>
          </div>

          {/* Mobile Round Tabs */}
          <ScorecardRoundTabs
            selectedRound={selectedRound}
            onRoundChange={setSelectedRound}
          />

          {/* Mobile Round Summary */}
          <ScorecardRoundSummary
            round={selectedRound}
            courseName={data.courseName}
            coursePar={coursePar}
            courseYardage={data.courseYardage}
          />

          {/* Mobile Scorecards */}
          <div className="px-4 py-4 space-y-4">
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

          {/* Mobile Legend */}
          <div className="px-4 py-3 border-t border-[#343944]">
            <ScorecardLegend isDesktop={false} />
          </div>

          {/* Mobile Player Navigation */}
          {players.length > 1 && (
            <MobilePlayerNavigation
              currentIndex={currentPlayerIndex}
              players={players}
              onPreviousClick={handlePreviousPlayer}
              onNextClick={handleNextPlayer}
            />
          )}
        </div>
      </div>
    </div>
  )
}
