'use client'

import { ScorecardMetricCard } from './scorecard-metric-card'
import { ScorecardNineHoleCard } from './scorecard-nine-hole-card'
import { ScorecardLegend } from './scorecard-legend'
import { ScorecardSummaryStrip } from './scorecard-summary-strip'
import { Trophy } from 'lucide-react'

interface HoleData {
  holeNumber: number
  par: number | null
  score: number | null
  toPar: number | null
  dkPoints: number | null
}

interface ScorecardCompletedContentProps {
  holes: HoleData[]
  finalPosition: string | null
  positionLabel?: string
  tournamentScore: number | null
  totalDkPoints: number | null
  fantasyResult?: string
  eagles?: number
  birdies?: number
  pars?: number
  bogeys?: number
  doublePlus?: number
  fairways?: number
  gir?: number
  putts?: number
  isLoading?: boolean
}

/**
 * Tournament recap scorecard layout for completed events.
 * Shows final position, tournament score, DK points, and complete round data.
 * Displays all hole-by-hole scoring with summary statistics.
 */
export function ScorecardCompletedContent({
  holes,
  finalPosition,
  positionLabel,
  tournamentScore,
  totalDkPoints,
  fantasyResult,
  eagles,
  birdies,
  pars,
  bogeys,
  doublePlus,
  fairways,
  gir,
  putts,
  isLoading = false,
}: ScorecardCompletedContentProps) {
  const showTrophy = fantasyResult === 'WINNER'

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
        <ScorecardMetricCard
          label="FINAL POSITION"
          value={finalPosition}
          detail={positionLabel}
          emphasis={true}
          phase="completed"
          isLoading={isLoading}
        />
        <ScorecardMetricCard
          label="TOURNAMENT SCORE"
          value={tournamentScore ? (tournamentScore < 0 ? `−${Math.abs(tournamentScore)}` : `+${tournamentScore}`) : null}
          detail="Final"
          emphasis={false}
          phase="completed"
          isLoading={isLoading}
        />
        <ScorecardMetricCard
          label="TOTAL DK POINTS"
          value={totalDkPoints !== null ? totalDkPoints.toFixed(1) : null}
          detail="Fantasy Score"
          emphasis={false}
          phase="completed"
          isLoading={isLoading}
        />
        <ScorecardMetricCard
          label={showTrophy ? '👑 WINNER' : 'FANTASY RESULT'}
          value={fantasyResult && fantasyResult !== 'WINNER' ? fantasyResult : null}
          detail={showTrophy ? 'Champion' : 'Final Result'}
          emphasis={showTrophy}
          phase="completed"
          isLoading={isLoading}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.05]" />

      {/* Completed Scorecard - Front 9 and Back 9 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScorecardNineHoleCard
          label="FRONT 9"
          holes={holes}
          phase="completed"
          isLoading={isLoading}
        />
        <ScorecardNineHoleCard
          label="BACK 9"
          holes={holes}
          phase="completed"
          isLoading={isLoading}
        />
      </div>

      {/* Legend */}
      <ScorecardLegend phase="completed" />

      {/* Summary Strip */}
      {(eagles !== undefined || birdies !== undefined) && (
        <>
          <div className="border-t border-white/[0.05]" />
          <ScorecardSummaryStrip
            eagles={eagles ?? null}
            birdies={birdies ?? null}
            pars={pars ?? null}
            bogeys={bogeys ?? null}
            doublePlus={doublePlus ?? null}
            fairways={fairways ?? null}
            gir={gir ?? null}
            putts={putts ?? null}
            phase="completed"
          />
        </>
      )}
    </div>
  )
}
