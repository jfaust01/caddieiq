'use client'

import type React from 'react'

import { useDragScroll } from '@/features/tournaments/hooks/use-drag-scroll'
import { usePlayerColumnWidth } from '@/features/tournaments/hooks/use-player-column-width'
import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import { TournamentScoreCell } from '@/features/tournaments/components/tournament-score-cell'
import { buildPositionCountMap, formatPositionWithStatusPriority } from '@/features/tournaments/utils/format-position'
import type { FieldEntrant } from '@/features/tournaments/types'
import { type TablePhase, phaseTableConfig } from '@/features/tournaments/config/phase-table-config'
import type { DfsValueResult } from '@/lib/dfs-value'
import { TIER_LABEL } from '@/lib/dfs-value'
import { cn } from '@/lib/utils'

import { FantasyPlayerCell } from './fantasy-player-cell'
import { FantasyMetricCell } from './fantasy-metric-cell'
import { MetricEmptyState } from './metric-empty-state'
import {
  TIER_BADGE_CLASS,
  courseFitScore,
  finishResult,
  formatDraftedPercent,
  formatMissing,
} from './helpers'
import styles from '../tournament-field.module.css'

/**
 * Scheduled (pre-tournament) row cells: rank · player · CaddieIQ rating ·
 * course fit · DFS value tier · DK salary · projected ownership · odds. Every
 * value is authoritative; missing data renders an em-dash.
 */
function FantasyRowCells({
  entrant,
  dfsResult,
  rank,
}: {
  entrant: FieldEntrant
  dfsResult: DfsValueResult | undefined
  rank: number
}) {
  const rating = entrant.fantasyScore
  const fit = courseFitScore(dfsResult)
  const tier = dfsResult?.tier ?? null
  const valueScore = dfsResult?.score ?? null
  const salaryDisplay = entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null
  const oddsDisplay = formatMissing(entrant.oddsToWin)

  return (
    <>
      {/* RANK */}
      <td className="px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">{rank}</span>
        </div>
      </td>

      {/* PLAYER */}
      <td className="px-2 sm:px-3 align-middle">
        <FantasyPlayerCell entrant={entrant} />
      </td>

      {/* CADDIEIQ RATING */}
      <td className="px-1 sm:px-2 align-middle">
        <FantasyMetricCell value={rating ?? null} meterTone="bg-emerald-400/70" valueClassName="text-emerald-300" />
      </td>

      {/* COURSE FIT */}
      <td className="px-1 sm:px-2 align-middle">
        <FantasyMetricCell value={fit} meterTone="bg-sky-400/70" valueClassName="text-foreground" />
      </td>

      {/* DFS VALUE */}
      <td className="border-l border-border/40 px-1 sm:px-2 align-middle">
        <div className="flex h-full flex-col items-center justify-center gap-1">
          {tier ? (
            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold', TIER_BADGE_CLASS[tier])}>
              {TIER_LABEL[tier]}
            </span>
          ) : (
            <MetricEmptyState />
          )}
          {valueScore != null && (
            <span className="text-[11px] tabular-nums text-muted-foreground/70">{valueScore}/100</span>
          )}
        </div>
      </td>

      {/* DK SALARY */}
      <td className="px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center gap-1.5 whitespace-nowrap">
          {salaryDisplay ? (
            <>
              <DraftKingsMark className="h-3 w-auto shrink-0" />
              <span className="text-sm font-semibold tabular-nums text-foreground">{salaryDisplay}</span>
            </>
          ) : (
            <MetricEmptyState />
          )}
        </div>
      </td>

      {/* PROJ OWNERSHIP */}
      <td className="border-l border-border/40 px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          {entrant.ownershipPercent == null ? (
            <MetricEmptyState />
          ) : (
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {Math.round(entrant.ownershipPercent)}%
            </span>
          )}
        </div>
      </td>

      {/* ODDS */}
      <td className="border-l border-border/40 px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-mono tabular-nums text-muted-foreground">{oddsDisplay}</span>
        </div>
      </td>
    </>
  )
}

/**
 * Scoring (live/completed) row cells: position · player · total · [thru] ·
 * R1–R4 · DFS · odds · [result]. THRU is live-only; RESULT is completed-only.
 */
function ScoringRowCells({
  entrant,
  positionCountMap,
  phase,
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
  phase: TablePhase
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap ?? new Map())
  const salaryDisplay = formatMissing(entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null)
  const oddsDisplay = formatMissing(entrant.oddsToWin)

  const isTie = entrant.position != null && (positionCountMap?.get(entrant.position) ?? 0) > 1
  const result = finishResult(entrant, isTie)
  const isWinner =
    phase === 'completed' && entrant.position === 1 && !isTie && entrant.status !== 'CUT' && entrant.cutMade !== false

  return (
    <>
      {/* POS */}
      <td className="w-[52px] min-w-[52px] max-w-[52px] px-1 sm:px-2 align-middle text-center">
        <span className={cn('text-sm font-semibold tabular-nums', isWinner ? 'text-emerald-300' : 'text-foreground')}>
          {positionDisplay}
        </span>
      </td>

      {/* PLAYER */}
      <td className="w-[calc(100vw-256px)] min-w-[190px] max-w-[240px] sm:w-[300px] sm:min-w-[260px] sm:max-w-none px-2 sm:px-3 align-middle text-left">
        <FantasyPlayerCell entrant={entrant} />
      </td>

      {/* TOTAL */}
      <td className="w-[92px] min-w-[92px] max-w-[92px] px-1 sm:px-2 align-middle bg-white/[0.012] border-x border-white/[0.035]">
        <TournamentScoreCell
          primary={entrant.totalStrokes ?? 'E'}
          secondary={entrant.total ?? undefined}
          dkPoints={entrant.dkFantasyPoints}
        />
      </td>

      {/* THRU — live only (real thru-hole + current round score) */}
      {phase === 'live' && (
        <td className="w-[76px] min-w-[76px] max-w-[76px] px-1 sm:px-2 align-middle">
          <div className="flex h-full flex-col items-center justify-center leading-tight">
            <span className="text-sm font-semibold tabular-nums text-foreground">{entrant.thruHole ?? '—'}</span>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {entrant.roundScore == null
                ? '—'
                : entrant.roundScore === 0
                  ? 'E'
                  : entrant.roundScore > 0
                    ? `+${entrant.roundScore}`
                    : entrant.roundScore}
            </span>
          </div>
        </td>
      )}

      {/* R1 */}
      <td className="w-[82px] min-w-[82px] max-w-[82px] px-1 sm:px-3 align-middle">
        <TournamentScoreCell primary={entrant.round1 ?? '—'} secondary={entrant.round1RelToPar ?? undefined} dkPoints={entrant.round1DkPoints} />
      </td>

      {/* R2 */}
      <td className="w-[82px] min-w-[82px] max-w-[82px] px-1 sm:px-3 align-middle">
        <TournamentScoreCell primary={entrant.round2 ?? '—'} secondary={entrant.round2RelToPar ?? undefined} dkPoints={entrant.round2DkPoints} />
      </td>

      {/* R3 */}
      <td className="w-[82px] min-w-[82px] max-w-[82px] px-1 sm:px-3 align-middle">
        <TournamentScoreCell primary={entrant.round3 ?? '—'} secondary={entrant.round3RelToPar ?? undefined} dkPoints={entrant.round3DkPoints} />
      </td>

      {/* R4 */}
      <td className="w-[82px] min-w-[82px] max-w-[82px] px-1 sm:px-3 align-middle">
        <TournamentScoreCell primary={entrant.round4 ?? '—'} secondary={entrant.round4RelToPar ?? undefined} dkPoints={entrant.round4DkPoints} />
      </td>

      {/* DFS */}
      <td className="w-[126px] min-w-[126px] max-w-[126px] border-l border-white/[0.055] px-2 sm:px-4 align-middle bg-orange-500/[0.012]">
        <div className="flex flex-col items-center justify-center gap-1 h-full">
          <div className="inline-flex items-center gap-1 whitespace-nowrap">
            <DraftKingsMark className="h-3 w-auto shrink-0" />
            <span className="text-sm font-semibold tabular-nums text-white">{salaryDisplay}</span>
          </div>
          <div className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
            {formatDraftedPercent(entrant.ownershipPercent)}
          </div>
        </div>
      </td>

      {/* ODDS TO WIN */}
      <td className="w-[80px] min-w-[80px] max-w-[80px] border-l border-white/[0.045] px-1 sm:px-3 align-middle">
        <div className="flex items-center justify-center h-full">
          <span className="text-sm font-mono tabular-nums text-foreground">{oddsDisplay}</span>
        </div>
      </td>

      {/* RESULT — completed only (honest placement from real position/status) */}
      {phase === 'completed' && (
        <td className="w-[88px] min-w-[88px] max-w-[88px] border-l border-white/[0.045] px-1 sm:px-3 align-middle">
          <div className="flex items-center justify-center h-full">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
                result === 'Won'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : result === 'MC' || result === 'WD' || result === 'DQ'
                    ? 'bg-rose-500/10 text-rose-300'
                    : 'bg-white/[0.06] text-foreground',
              )}
            >
              {result}
            </span>
          </div>
        </td>
      )}
    </>
  )
}

export interface FantasyPlayerTableProps {
  phase: TablePhase
  /** Already filtered + sorted entrants to render as rows. */
  entrants: FieldEntrant[]
  /** Full field, used for tie detection and the player-column autosizing. */
  allEntrants: FieldEntrant[]
  /** Total field size, shown in the Players header. */
  fieldSize: number
  /** DFS Value Model lookups for the scheduled fantasy columns. */
  dfsByPlayer: Map<string, DfsValueResult>
  /** Opens the scorecard modal for a player row. */
  onRowClick: (playerId: string) => void
}

/**
 * The single, shared, status-aware fantasy table. The phase config drives the
 * accent, the <colgroup>/<thead> columns, and the footnote; the phase selects
 * which row renderer to use. Scheduled / Live / Completed are configurations of
 * this one component — there are no separate per-phase table implementations.
 */
export function FantasyPlayerTable({
  phase,
  entrants,
  allEntrants,
  fieldSize,
  dfsByPlayer,
  onRowClick,
}: FantasyPlayerTableProps) {
  const config = phaseTableConfig[phase]
  const { accent, columns, footnote } = config
  const isScheduled = phase === 'scheduled'

  // Drag-to-scroll + player-column autosizing live with the table markup.
  const scrollContainerRef = useDragScroll({ dragThreshold: 5 })
  const playerColumnWidth = usePlayerColumnWidth(allEntrants, '.tournament-table-container')
  const positionCountMap = buildPositionCountMap(allEntrants)

  return (
    <div
      className="w-full min-w-0 tournament-table-container"
      style={{ '--player-column-width': playerColumnWidth || '220px' } as React.CSSProperties}
    >
      {/* Premium table wrapper. overflow-clip (NOT overflow-hidden) clips the
          rounded corners WITHOUT creating a scroll container, so the sticky
          header can still pin to the top of the page. */}
      <div className="relative overflow-clip rounded-[20px] border border-white/[0.09] bg-[#101419] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_12px_36px_rgba(0,0,0,0.20)]">
        {/* Decorative clip layer (rounded) — keeps glow/accent inside the card
            corners without creating a clipping context for the table */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]">
          <div className={cn('absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl', accent.glow)} />
          <div className={cn('absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent to-transparent', accent.headerLine)} />
        </div>

        {/* Table content */}
        <div className="relative z-10">
          <div className="sm:hidden text-xs text-muted-foreground mb-2 flex items-center gap-1 px-6 pt-6">
            <span>Scroll for more →</span>
          </div>
          <div
            ref={scrollContainerRef}
            className={cn('overflow-x-auto sm:overflow-x-visible select-none', styles.scrollContainer)}
            style={{ userSelect: 'none', maxWidth: '100%' }}
          >
            <table className="w-max table-fixed border-collapse sm:w-full">
              <colgroup>
                {columns.map((col) => (
                  <col key={col.id} className={col.colClassName} />
                ))}
              </colgroup>
              <thead className="sticky top-0 sm:top-[94px] z-20 bg-[#101419] border-b border-white/[0.06]">
                <tr>
                  {columns.map((col) => (
                    <th key={col.id} className={col.thClassName} title={col.tooltip}>
                      {col.headerKind === 'player' ? (
                        `Players (${fieldSize})`
                      ) : col.headerKind === 'dk' ? (
                        <span className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                          <DraftKingsMark className="h-3 w-auto" />
                          <span>{col.label}</span>
                        </span>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entrants.map((entrant, index) => (
                  <tr
                    key={entrant.playerId}
                    onClick={(event) => {
                      const target = event.target as HTMLElement
                      const interactiveElement = target.closest(
                        'button, a, input, select, textarea, [data-prevent-row-click]',
                      )
                      if (interactiveElement) return
                      onRowClick(entrant.playerId)
                    }}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer h-[72px] border-b border-white/[0.055] bg-transparent transition-colors duration-150 hover:bg-white/[0.025]"
                  >
                    {isScheduled ? (
                      <FantasyRowCells entrant={entrant} dfsResult={dfsByPlayer.get(entrant.playerId)} rank={index + 1} />
                    ) : (
                      <ScoringRowCells entrant={entrant} positionCountMap={positionCountMap} phase={phase} />
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground italic mt-2">{footnote}</div>
    </div>
  )
}
