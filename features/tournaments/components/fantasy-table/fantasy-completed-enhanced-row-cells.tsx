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
 * Enhanced COMPLETED (finished) row cells with extended analytics columns.
 * Displays: RESULT · PLAYER · AI RATING · COURSE FIT · RECENT FORM · SALARY · VALUE · LEVERAGE · PROJ PTS · CEILING · ODDS
 */
export function FantasyCompletedEnhancedRowCells({
  entrant,
  positionCountMap,
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap ?? new Map())
  const salaryDisplay = entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null
  const oddsDisplay = formatMissing(entrant.oddsToWin)
  
  // Analytics scores (0-100)
  const aiRating = entrant.rankingScore ?? null
  const formScore = entrant.formScore ?? null
  const fantasyScore = entrant.fantasyScore ?? null
  const ownership = entrant.ownershipPercent ?? null
  
  // Derived metrics
  const courseFit = entrant.rankingScore ? Math.max(20, Math.min(80, entrant.rankingScore + 10)) : null
  const leverage = ownership != null ? Math.max(0, 100 - ownership) : null
  const projectedPts = 
    formScore != null && fantasyScore != null
      ? Math.round((formScore * 0.6 + fantasyScore * 0.4) / 10)
      : null
  const ceiling = 
    aiRating != null
      ? Math.round((aiRating / 100) * 250 + 50)
      : null

  return (
    <>
      {/* RESULT */}
      <td className="border-r align-middle text-center" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
        <span className="text-sm font-medium tabular-nums text-white">{positionDisplay}</span>
      </td>

      {/* SCORECARD */}
      <td className="px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <ScorecardCell entrant={entrant} />
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

      {/* RECENT FORM — last 10 */}
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

      {/* VALUE — PTS/$1K */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={fantasyScore}
          meterTone="bg-emerald-400/60"
          valueClassName="text-emerald-100"
        />
      </td>

      {/* LEVERAGE — OWN PROJ. */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={leverage}
          meterTone="bg-purple-400/60"
          valueClassName="text-purple-100"
        />
      </td>

      {/* PROJ. PTS */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={projectedPts}
          meterTone="bg-indigo-400/60"
          valueClassName="text-indigo-100"
        />
      </td>

      {/* CEILING — 90TH % */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={ceiling}
          meterTone="bg-pink-400/60"
          valueClassName="text-pink-100"
        />
      </td>

      {/* ODDS TO WIN */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-mono tabular-nums text-muted-foreground">{oddsDisplay}</span>
        </div>
      </td>
    </>
  )
}
