'use client'

import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import type { FieldEntrant } from '@/features/tournaments/types'
import { formatPositionWithStatusPriority } from '@/features/tournaments/utils/format-position'

import { FantasyPlayerCell } from './fantasy-player-cell'
import { FantasyMetricCell } from './fantasy-metric-cell'
import { MetricEmptyState } from './metric-empty-state'
import { RoundDnaCell } from './round-dna-cell'
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
  tournamentStatus = 'ACTIVE',
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
  onScorecardOpen?: (playerId: string) => void
  tournamentStatus?: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap ?? new Map())
  const salaryDisplay = entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null
  const oddsDisplay = entrant.oddsToWin 
    ? (() => {
        const odds = parseInt(entrant.oddsToWin)
        return isNaN(odds) ? formatMissing(entrant.oddsToWin) : (odds > 0 ? '+' + odds : odds.toString())
      })()
    : '—'
  
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

      {/* TO PAR */}
      <td className="border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-mono text-muted-foreground">
            {entrant.total != null ? entrant.total === 0 ? 'E' : (entrant.total > 0 ? '+' : '') + entrant.total : '—'}
          </span>
        </div>
      </td>

      {/* ROUND DNA */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <RoundDnaCell 
          round1RelToPar={entrant.round1RelToPar}
          round2RelToPar={entrant.round2RelToPar}
          round3RelToPar={entrant.round3RelToPar}
          round4RelToPar={entrant.round4RelToPar}
          tournamentStatus={tournamentStatus}
          currentHole={entrant.thruHole}
        />
      </td>

      {/* AI RATING */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={aiRating}
          valueClassName="text-blue-100"
        />
      </td>

      {/* COURSE FIT */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={courseFit}
          valueClassName="text-cyan-100"
        />
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

      {/* DK SCORE */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          {entrant.dkFantasyPoints != null ? (
            <span className="text-sm font-medium tabular-nums text-emerald-200">{entrant.dkFantasyPoints.toFixed(1)}</span>
          ) : (
            <MetricEmptyState />
          )}
        </div>
      </td>

      {/* VALUE PTS/$1K */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={fantasyScore}
          valueClassName="text-emerald-100"
        />
      </td>

      {/* OWNERSHIP */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={ownership}
          valueClassName="text-rose-100"
        />
      </td>

      {/* LEVERAGE */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <FantasyMetricCell 
          value={leverage}
          valueClassName="text-purple-100"
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
