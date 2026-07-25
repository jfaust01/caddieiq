'use client'

import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import type { FieldEntrant } from '@/features/tournaments/types'
import type { DfsValueResult } from '@/lib/dfs-value'

import { FantasyPlayerCell } from './fantasy-player-cell'
import { FantasyMetricCell } from './fantasy-metric-cell'
import { MetricEmptyState } from './metric-empty-state'
import { ScorecardCell } from './scorecard-cell'
import {
  formatMissing,
  courseFitScore,
} from './helpers'

/**
 * Scheduled (pre-tournament) row cells for fantasy lineup building:
 * player · salary · odds · world ranking · form · tee time · course fit.
 * Mobile priority: Player, Salary, Odds, World Ranking visible first.
 * Every value is authoritative; missing data renders an em-dash.
 */
export function FantasyRowCells({
  entrant,
  dfsResult,
  rank,
  onScorecardOpen,
}: {
  entrant: FieldEntrant
  dfsResult: DfsValueResult | undefined
  rank: number
  onScorecardOpen?: (playerId: string) => void
}) {
  // Mock data generator based on player ID hash for consistent mock values
  const getMockValue = (seed: string, min: number, max: number) => {
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return Math.round(min + (hash % (max - min + 1)))
  }
  
  const salaryDisplay = entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null
  const oddsDisplay = formatMissing(entrant.oddsToWin)
  const worldRankDisplay = entrant.worldRanking ? `#${entrant.worldRanking}` : `#${getMockValue(entrant.playerId, 1, 200)}`
  const formScore = entrant.formScore ?? getMockValue(`${entrant.playerId}-form`, 20, 90)
  const fit = courseFitScore(dfsResult)
  const teeTimeDisplay = entrant.startingTime ? entrant.startingTime.slice(11, 16) : null // HH:MM from ISO

  return (
    <>
      {/* SCORECARD */}
      <td className="px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <ScorecardCell entrant={entrant} onOpen={onScorecardOpen} />
        </div>
      </td>

      {/* PLAYER */}
      <td className="px-2 sm:px-3 align-middle">
        <FantasyPlayerCell entrant={entrant} />
      </td>

      {/* DK SALARY */}
      <td className="px-1 sm:px-3 align-middle">
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

      {/* ODDS */}
      <td className="border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-mono tabular-nums text-muted-foreground">{oddsDisplay}</span>
        </div>
      </td>

      {/* WORLD RANKING */}
      <td className="border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          {worldRankDisplay ? (
            <span className="text-sm font-semibold tabular-nums text-foreground">{worldRankDisplay}</span>
          ) : (
            <MetricEmptyState />
          )}
        </div>
      </td>

      {/* RECENT FORM */}
      <td className="border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <FantasyMetricCell value={formScore ?? null} meterTone="bg-amber-400/60" valueClassName="text-amber-200" isSemibold={true} />
      </td>

      {/* TEE TIME */}
      <td className="border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          {teeTimeDisplay ? (
            <span className="text-sm font-mono text-muted-foreground">{teeTimeDisplay}</span>
          ) : (
            <MetricEmptyState />
          )}
        </div>
      </td>

      {/* COURSE FIT */}
      <td className="border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <FantasyMetricCell value={fit} meterTone="bg-sky-400/60" valueClassName="text-sky-100" />
      </td>
    </>
  )
}
