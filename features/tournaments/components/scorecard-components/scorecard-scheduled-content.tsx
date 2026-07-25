'use client'

import { ScorecardMetricCard } from './scorecard-metric-card'
import { ScorecardRoundTabs } from './scorecard-round-tabs'
import { ScorecardNineHoleCard } from './scorecard-nine-hole-card'
import { ScorecardLegend } from './scorecard-legend'
import { ScorecardEmptyState } from './scorecard-empty-state'
import { cn } from '@/lib/utils'

interface HoleData {
  holeNumber: number
  par: number | null
  avgScore: number | null
  projectedScore: number | null
}

interface ScorecardScheduledContentProps {
  selectedRound: number
  onSelectRound: (round: number) => void
  holes: HoleData[]
  projectedScore: number | null
  makeCutProbability: number | null
  top10Probability: number | null
  fantasyProjection: number | null
  ownershipProjection: number | null
  teetime?: string
  courseFit?: number
  isLoading?: boolean
}

/**
 * Pre-tournament preview scorecard layout.
 * Shows projected scores, make-cut probability, course fit, and tee time.
 * Only displays projections backed by real data; uses honest empty states otherwise.
 */
export function ScorecardScheduledContent({
  selectedRound,
  onSelectRound,
  holes,
  projectedScore,
  makeCutProbability,
  top10Probability,
  fantasyProjection,
  ownershipProjection,
  teetime,
  courseFit,
  isLoading = false,
}: ScorecardScheduledContentProps) {
  const hasProjectionData = projectedScore !== null || makeCutProbability !== null || fantasyProjection !== null

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScorecardMetricCard
          label="PROJECTED SCORE"
          value={projectedScore ? (projectedScore < 0 ? `−${Math.abs(projectedScore)}` : `+${projectedScore}`) : null}
          detail={projectedScore ? 'Proj. Total' : undefined}
          emphasis={true}
          phase="scheduled"
          isLoading={isLoading}
        />
        <ScorecardMetricCard
          label="MAKE CUT"
          value={makeCutProbability !== null ? `${Math.round(makeCutProbability)}%` : null}
          detail="Probability"
          emphasis={false}
          phase="scheduled"
          isLoading={isLoading}
        />
        <ScorecardMetricCard
          label="TOP 10"
          value={top10Probability !== null ? `${Math.round(top10Probability)}%` : null}
          detail="Probability"
          emphasis={false}
          phase="scheduled"
          isLoading={isLoading}
        />
        <ScorecardMetricCard
          label="FANTASY PROJECTION"
          value={fantasyProjection !== null ? fantasyProjection.toFixed(1) : null}
          detail="DK Points"
          emphasis={false}
          phase="scheduled"
          isLoading={isLoading}
        />
      </div>

      {/* Optional: Ownership Projection and Course Fit in secondary row */}
      {(ownershipProjection !== null || courseFit !== null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ownershipProjection !== null && (
            <ScorecardMetricCard
              label="OWNERSHIP PROJECTION"
              value={`${Math.round(ownershipProjection)}%`}
              detail="Leverage"
              emphasis={false}
              phase="scheduled"
              isLoading={isLoading}
            />
          )}
          {courseFit !== null && (
            <ScorecardMetricCard
              label="COURSE FIT"
              value={`${Math.round(courseFit)}`}
              detail="Score"
              emphasis={false}
              phase="scheduled"
              isLoading={isLoading}
            />
          )}
        </div>
      )}

      {/* No projection data state */}
      {!hasProjectionData && (
        <ScorecardEmptyState
          message="Projections unavailable"
          detail="Tournament projections will appear when available for this player."
        />
      )}

      {/* Divider */}
      <div className="border-t border-white/[0.05]" />

      {/* Round Tabs */}
      <ScorecardRoundTabs
        selectedRound={selectedRound}
        onSelectRound={onSelectRound}
        phase="scheduled"
        isLoading={isLoading}
      />

      {/* Preview Scorecard - Front 9 and Back 9 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScorecardNineHoleCard
          label="FRONT 9"
          holes={holes}
          phase="scheduled"
          isLoading={isLoading}
        />
        <ScorecardNineHoleCard
          label="BACK 9"
          holes={holes}
          phase="scheduled"
          isLoading={isLoading}
        />
      </div>

      {/* Legend */}
      <ScorecardLegend phase="scheduled" />

      {/* Optional Footer Info */}
      {(teetime || courseFit) && (
        <div className="px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-foreground/60 space-y-2">
          {teetime && <div>• Tee time: {teetime}</div>}
          {courseFit && <div>• Course fit score: {courseFit}/100</div>}
        </div>
      )}
    </div>
  )
}
