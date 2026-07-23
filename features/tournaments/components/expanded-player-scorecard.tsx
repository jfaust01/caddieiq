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
    <div className="bg-[#0F1117] text-white w-full min-w-0 max-w-full overflow-hidden">
      {/* Desktop Layout */}
      <div className="hidden lg:block w-full min-w-0">
        <div className="bg-[#151922] border border-[#343944] rounded-lg overflow-hidden w-full min-w-0">
          {/* Desktop Header */}
          <div className="w-full min-w-0 overflow-hidden">
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
          </div>

          {/* Desktop Round Selector */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#343944] min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 flex-shrink-0">
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
            <div className="flex items-center gap-2 text-xs text-[#9EA5B1] flex-shrink-1 min-w-0 overflow-hidden">
              <span className="truncate">{data.courseName}</span>
              <span className="flex-shrink-0">•</span>
              <span className="flex-shrink-0">Par {coursePar || '—'}</span>
              <span className="flex-shrink-0">•</span>
              <span className="flex-shrink-0">{data.courseYardage?.toLocaleString() || '—'} yds</span>
              <button className="p-1 hover:bg-[#222836] rounded transition-colors flex-shrink-0">
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Scorecards */}
          <div className="w-full min-w-0 overflow-x-auto p-3">
            <div className="grid w-full min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="w-full min-w-0 overflow-hidden">
                <NineHoleScorecard
                  label="FRONT 9"
                  holes={frontNine}
                  courseHoles={data.courseHoles?.slice(0, 9)}
                  total={outTotal}
                  isDesktop
                />
              </div>
              <div className="w-full min-w-0 overflow-hidden">
                <NineHoleScorecard
                  label="BACK 9"
                  holes={backNine}
                  courseHoles={data.courseHoles?.slice(9, 18)}
                  total={inTotal}
                  totTotal={totTotal}
                  isDesktop
                />
              </div>
            </div>
          </div>

          {/* Desktop Legend */}
          <div className="border-t border-[#343944] px-4 py-3 w-full min-w-0 overflow-hidden">
            <ScorecardLegend isDesktop />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full min-w-0 overflow-hidden">
        <div className="bg-[#151922] border border-[#343944] rounded-lg overflow-hidden w-full min-w-0">
          {/* Mobile Sticky Header */}
          <div className="sticky top-0 z-20 bg-[#151922] border-b border-[#343944] px-3 py-2 flex items-center justify-between flex-shrink-0">
            <button
              onClick={handlePreviousPlayer}
              className="p-1 hover:bg-[#222836] rounded transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center min-w-0 overflow-hidden">
              <div className="text-sm font-semibold truncate">{data.playerName}</div>
              {data.tour && <TourChip tour={data.tour} />}
            </div>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-1 hover:bg-[#222836] rounded transition-colors flex-shrink-0"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
            </button>
          </div>

          {/* Mobile Round Tabs */}
          <div className="w-full min-w-0 overflow-hidden">
            <ScorecardRoundTabs
              selectedRound={selectedRound}
              onRoundChange={setSelectedRound}
            />
          </div>

          {/* Mobile Round Summary */}
          <div className="w-full min-w-0 overflow-hidden">
            <ScorecardRoundSummary
              round={selectedRound}
              courseName={data.courseName}
              coursePar={coursePar}
              courseYardage={data.courseYardage}
            />
          </div>

          {/* Mobile Scorecards */}
          <div className="w-full min-w-0 overflow-hidden px-2 py-3 space-y-3">
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
          <div className="px-3 py-2 border-t border-[#343944] w-full min-w-0 overflow-hidden">
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
