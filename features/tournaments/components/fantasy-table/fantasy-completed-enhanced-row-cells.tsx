'use client'

import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import type { FieldEntrant } from '@/features/tournaments/types'
import { formatPositionWithStatusPriority } from '@/features/tournaments/utils/format-position'

import { FantasyPlayerCell } from './fantasy-player-cell'
import { FantasyMetricCell } from './fantasy-metric-cell'
import { MetricEmptyState } from './metric-empty-state'
import { TournamentHoleForm } from './tournament-hole-form'
import { ScorecardCell } from './scorecard-cell'
import { formatMissing } from './helpers'

/**
 * Enhanced COMPLETED (finished) row cells with extended analytics columns.
 * Displays: RESULT · PLAYER · AI RATING · COURSE FIT · RECENT FORM · SALARY · VALUE · LEVERAGE · PROJ PTS · CEILING · ODDS
 */
export function FantasyCompletedEnhancedRowCells({
  entrant,
  positionCountMap,
  onScorecardOpen,
  tournamentStatus = 'COMPLETED',
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
  
  // Analytics scores (0-100)
  const aiRating = entrant.rankingScore ?? getMockValue(entrant.playerId, 45, 95)
  const formScore = entrant.formScore ?? getMockValue(`${entrant.playerId}-form`, 20, 90)
  const fantasyScore = entrant.fantasyScore ?? getMockValue(`${entrant.playerId}-fantasy`, 30, 85)
  const ownership = entrant.ownershipPercent ?? getMockValue(`${entrant.playerId}-own`, 2, 45)
  
  // Derived metrics
  const courseFit = Math.max(20, Math.min(80, aiRating + 10))
  const leverage = Math.max(0, 100 - ownership)
  const ceiling = Math.round((aiRating / 100) * 250 + 50)

  return (
    <>
      {/* RESULT */}
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

      {/* TOURNAMENT FORM */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-start">
          <TournamentHoleForm 
            round1RelToPar={entrant.round1RelToPar}
            round2RelToPar={entrant.round2RelToPar}
            round3RelToPar={entrant.round3RelToPar}
            round4RelToPar={entrant.round4RelToPar}
            tournamentStatus={tournamentStatus}
          />
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

      {/* ODDS TO WIN */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-mono tabular-nums text-muted-foreground">{oddsDisplay}</span>
        </div>
      </td>
    </>
  )
}
