'use client'

import { ScorecardMetricCard } from './scorecard-metric-card'
import { ScorecardRoundSelector } from './scorecard-round-selector'
import { ScorecardNineHoleCard } from './scorecard-nine-hole-card'
import { ScorecardLegend } from './scorecard-legend'
import { ScorecardSummaryStrip } from './scorecard-summary-strip'
import { ScorecardEmptyState } from './scorecard-empty-state'
import { cn } from '@/lib/utils'
import { Radio } from 'lucide-react'

interface HoleData {
  holeNumber: number
  par: number | null
  score: number | null
  toPar: number | null
  dkPoints: number | null
}

interface ScorecardLiveContentProps {
  currentRound: number
  holes: HoleData[]
  position: string | null
  positionMovement?: string
  tournamentScore: number | null
  holesCompleted: number | null
  liveDkPoints: number | null
  projectedDkPoints: number | null
  currentRound: number
  currentHole?: number
  lastUpdated?: string
  hotStreak?: string
  strokesGained?: string
  projectedFinish?: string
  eagles?: number
  birdies?: number
  pars?: number
  bogeys?: number
  doublePlus?: number
  isLoading?: boolean
}

/**
 * Live tournament performance scorecard layout.
 * Shows real-time position, score, DK points, current hole highlighting, and live insights.
 * Updates are only shown when backed by real data.
 */
export function ScorecardLiveContent({
  currentRound,
  holes,
  position,
  positionMovement,
  tournamentScore,
  holesCompleted,
  liveDkPoints,
  projectedDkPoints,
  currentRound,
  currentHole,
  lastUpdated,
  hotStreak,
  strokesGained,
  projectedFinish,
  eagles,
  birdies,
  pars,
  bogeys,
  doublePlus,
  isLoading = false,
}: ScorecardLiveContentProps) {
  const holesDisplay = holesCompleted ? `Thru ${holesCompleted}` : 'Thru —'

  return (
    <div className="space-y-6">
      {/* Live Context Bar */}
      <div className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
        'px-4 py-3 rounded-lg',
        'bg-amber-400/[0.06] border border-amber-400/20'
      )}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Radio className="size-3 text-amber-400 animate-pulse" aria-hidden="true" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Live</span>
          </div>
          <span className="text-xs text-foreground/70">
            Round {currentRound}
            {currentHole && ` • Hole ${currentHole}`}
          </span>
        </div>
        {lastUpdated && (
          <span className="text-xs text-foreground/50">
            Updated {lastUpdated}
          </span>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScorecardMetricCard
          label="POSITION"
          value={position}
          detail={positionMovement}
          emphasis={true}
          phase="live"
          isLoading={isLoading}
        />
        <ScorecardMetricCard
          label="TOURNAMENT SCORE"
          value={tournamentScore ? (tournamentScore < 0 ? `−${Math.abs(tournamentScore)}` : `+${tournamentScore}`) : null}
          detail={holesDisplay}
          emphasis={false}
          phase="live"
          isLoading={isLoading}
        />
        <ScorecardMetricCard
          label="LIVE DK POINTS"
          value={liveDkPoints !== null ? liveDkPoints.toFixed(1) : null}
          detail="Current"
          emphasis={false}
          phase="live"
          isLoading={isLoading}
        />
        <ScorecardMetricCard
          label="PROJECTED DK"
          value={projectedDkPoints !== null ? projectedDkPoints.toFixed(1) : null}
          detail="Proj. Total"
          emphasis={false}
          phase="live"
          isLoading={isLoading}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.05]" />

      {/* Round Selector */}
      <ScorecardRoundSelector currentRound={currentRound} phase="live" />

      {/* Live Scorecard - Front 9 and Back 9 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScorecardNineHoleCard
          label="FRONT 9"
          holes={holes}
          phase="live"
          isLive={true}
          currentHole={currentHole}
          isLoading={isLoading}
        />
        <ScorecardNineHoleCard
          label="BACK 9"
          holes={holes}
          phase="live"
          isLive={true}
          currentHole={currentHole}
          isLoading={isLoading}
        />
      </div>

      {/* Legend */}
      <ScorecardLegend phase="live" />

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
            phase="live"
          />
        </>
      )}

      {/* Live Insight Bar */}
      {(hotStreak || strokesGained || projectedFinish) && (
        <>
          <div className="border-t border-white/[0.05]" />
          <div className={cn(
            'px-4 py-3 rounded-lg text-xs',
            'bg-amber-400/[0.06] border border-amber-400/20',
            'text-foreground/70 leading-relaxed'
          )}>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {hotStreak && (
                <>
                  <span className="text-amber-400 font-semibold">🔥 {hotStreak}</span>
                  <span className="text-foreground/40">•</span>
                </>
              )}
              {strokesGained && (
                <>
                  <span>Strokes Gained: {strokesGained}</span>
                  <span className="text-foreground/40">•</span>
                </>
              )}
              {projectedFinish && (
                <span>Projected Finish: {projectedFinish}</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
