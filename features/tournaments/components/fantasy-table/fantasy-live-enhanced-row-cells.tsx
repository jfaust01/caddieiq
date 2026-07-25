'use client'

import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import type { FieldEntrant } from '@/features/tournaments/types'
import { formatPositionWithStatusPriority } from '@/features/tournaments/utils/format-position'

import { FantasyPlayerCell } from './fantasy-player-cell'
import { FantasyMetricCell } from './fantasy-metric-cell'
import { MetricEmptyState } from './metric-empty-state'
import { FormSparkline } from './form-sparkline'
import { ScorecardCell } from './scorecard-cell'
import { formatMissing } from './helpers'

/**
 * Enhanced LIVE (in-progress) row cells with extended analytics columns.
 * Displays: POS · PLAYER · AI RATING · COURSE FIT · RECENT FORM · SALARY · VALUE · OWNERSHIP · LEVERAGE · PROJ POINTS · CEILING · ODDS
 */
export function FantasyLiveEnhancedRowCells({
  entrant,
  positionCountMap,
  onScorecardOpen,
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
  onScorecardOpen?: (playerId: string) => void
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap ?? new Map())
  const salaryDisplay = entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null
  const oddsDisplay = formatMissing(entrant.oddsToWin)
  
  // Mock data generator based on player ID hash for consistent mock values
  const getMockValue = (seed: string, min: number, max: number) => {
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return Math.round(min + (hash % (max - min + 1)))
  }
  
  // Analytics scores (0-100) - render with FantasyMetricCell
  const aiRating = entrant.rankingScore ?? getMockValue(entrant.playerId, 45, 95) // Overall rating
  const formScore = entrant.formScore ?? getMockValue(`${entrant.playerId}-form`, 20, 90) // Recent form trend
  const fantasyScore = entrant.fantasyScore ?? getMockValue(`${entrant.playerId}-fantasy`, 30, 85) // Fantasy production
  const ownership = entrant.ownershipPercent ?? getMockValue(`${entrant.playerId}-own`, 2, 45) // Ownership %
  
  // Derived metrics (Phase 2 calculations)
  // Course Fit: estimated from ranking vs field
  const courseFit = Math.max(20, Math.min(80, aiRating + 10))
  
  // Leverage: inverse of ownership (low owned = high leverage)
  const leverage = Math.max(0, 100 - ownership)
  
  // Projected Points: estimated from form score and fantasy production
  const projectedPts = Math.round((formScore * 0.6 + fantasyScore * 0.4) / 10)
  
  // Ceiling: estimated from ranking (higher rank = higher ceiling)
  const ceiling = Math.round((aiRating / 100) * 250 + 50) // Scale to realistic ceiling range

  return (
    <>
      {/* POS */}
      <td className="border-r align-middle text-center" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
        <span className="text-sm font-medium tabular-nums text-white">{positionDisplay}</span>
      </td>

      {/* SCORECARD */}
      <td className="px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <ScorecardCell entrant={entrant} onOpen={onScorecardOpen} />
        </div>
      </td>

      {/* PLAYER */}
      <td className="px-2 sm:px-3 align-middle text-left">
        <FantasyPlayerCell entrant={entrant} />
      </td>

      {/* AI RATING */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={aiRating}
          meterTone="bg-blue-400/60"
          valueClassName="text-blue-100"
        />
      </td>

      {/* COURSE FIT */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={courseFit}
          meterTone="bg-cyan-400/60"
          valueClassName="text-cyan-100"
        />
      </td>

      {/* RECENT FORM */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          {formScore != null ? (
            <FormSparkline formScore={formScore} />
          ) : (
            <MetricEmptyState />
          )}
        </div>
      </td>

      {/* SALARY */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center gap-1.5 whitespace-nowrap">
          {salaryDisplay ? (
            <>
              <DraftKingsMark className="h-3 w-auto shrink-0" />
              <span className="text-sm font-medium tabular-nums text-foreground">{salaryDisplay}</span>
            </>
          ) : (
            <MetricEmptyState />
          )}
        </div>
      </td>

      {/* VALUE PTS/$1K */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={fantasyScore}
          meterTone="bg-emerald-400/60"
          valueClassName="text-emerald-100"
        />
      </td>

      {/* OWNERSHIP */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={ownership}
          meterTone="bg-rose-400/60"
          valueClassName="text-rose-100"
        />
      </td>

      {/* LEVERAGE */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={leverage}
          meterTone="bg-purple-400/60"
          valueClassName="text-purple-100"
        />
      </td>

      {/* PROJ-K PTS */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={projectedPts}
          meterTone="bg-indigo-400/60"
          valueClassName="text-indigo-100"
        />
      </td>

      {/* CEILING */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={ceiling}
          meterTone="bg-pink-400/60"
          valueClassName="text-pink-100"
        />
      </td>

      {/* ODDS */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-mono tabular-nums text-muted-foreground">{oddsDisplay}</span>
        </div>
      </td>
    </>
  )
}
