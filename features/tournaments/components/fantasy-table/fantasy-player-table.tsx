'use client'

import React from 'react'

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
  formatMissing,
  formatDraftedPercent,
  finishResult,
  calculateFinalValue,
  courseFitScore,
} from './helpers'
import styles from '../tournament-field.module.css'

/**
 * Scheduled (pre-tournament) row cells for fantasy lineup building:
 * player · salary · odds · world ranking · form · tee time · course fit.
 * Mobile priority: Player, Salary, Odds, World Ranking visible first.
 * Every value is authoritative; missing data renders an em-dash.
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
  const salaryDisplay = entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null
  const oddsDisplay = formatMissing(entrant.oddsToWin)
  const worldRankDisplay = entrant.worldRanking ? `#${entrant.worldRanking}` : null
  const formScore = entrant.formScore
  const fit = courseFitScore(dfsResult)
  const teeTimeDisplay = entrant.startingTime ? entrant.startingTime.slice(11, 16) : null // HH:MM from ISO

  return (
    <>
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
              <span className="text-sm font-semibold tabular-nums text-foreground">{salaryDisplay}</span>
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
        <FantasyMetricCell value={formScore ?? null} meterTone="bg-amber-400/70" valueClassName="text-amber-300" />
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
        <FantasyMetricCell value={fit} meterTone="bg-sky-400/70" valueClassName="text-foreground" />
      </td>
    </>
  )
}

/**
 * Live (in-progress) row cells: pos · player · live DK · total · through ·
 * today · salary · drafted % · odds. Real-time fantasy tracking with mobile-first
 * priority: first four columns visible, rest via horizontal scroll.
 */
function ScoreLiveRowCells({
  entrant,
  positionCountMap,
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap ?? new Map())
  const salaryDisplay = formatMissing(entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null)
  const oddsDisplay = formatMissing(entrant.oddsToWin)
  const draftedDisplay = formatDraftedPercent(entrant.ownershipPercent)
  const todayDisplay = entrant.roundScore == null ? '—' : entrant.roundScore === 0 ? 'E' : entrant.roundScore > 0 ? `+${entrant.roundScore}` : entrant.roundScore

  return (
    <>
      {/* POS */}
      <td className="w-[52px] min-w-[52px] max-w-[52px] px-1 sm:px-2 align-middle text-center">
        <span className="text-sm font-semibold tabular-nums text-foreground">{positionDisplay}</span>
      </td>

      {/* PLAYER */}
      <td className="w-[calc(100vw-256px)] min-w-[190px] max-w-[240px] sm:w-[300px] sm:min-w-[260px] sm:max-w-none px-2 sm:px-3 align-middle text-left">
        <FantasyPlayerCell entrant={entrant} />
      </td>

      {/* LIVE DK */}
      <td className="w-[120px] min-w-[120px] max-w-[120px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          {entrant.totalDkFantasyPoints == null ? (
            <MetricEmptyState />
          ) : (
            <span className="text-sm font-semibold tabular-nums text-white">{entrant.totalDkFantasyPoints}</span>
          )}
        </div>
      </td>

      {/* TOTAL */}
      <td className="w-[92px] min-w-[92px] max-w-[92px] px-1 sm:px-2 align-middle bg-white/[0.012] border-x border-white/[0.035]">
        <TournamentScoreCell
          primary={entrant.totalStrokes ?? 'E'}
          secondary={entrant.total ?? undefined}
          dkPoints={entrant.dkFantasyPoints}
        />
      </td>

      {/* THRU */}
      <td className="w-[76px] min-w-[76px] max-w-[76px] px-1 sm:px-2 align-middle">
        <div className="flex h-full flex-col items-center justify-center leading-tight">
          <span className="text-sm font-semibold tabular-nums text-foreground">{entrant.thruHole ?? '—'}</span>
        </div>
      </td>

      {/* TODAY */}
      <td className="w-[76px] min-w-[76px] max-w-[76px] border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-semibold tabular-nums text-foreground">{todayDisplay}</span>
        </div>
      </td>

      {/* SALARY */}
      <td className="w-[110px] min-w-[110px] max-w-[110px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center gap-1 whitespace-nowrap">
          {entrant.dfsSalary ? (
            <>
              <DraftKingsMark className="h-3 w-auto shrink-0" />
              <span className="text-sm font-semibold tabular-nums text-white">{salaryDisplay}</span>
            </>
          ) : (
            <MetricEmptyState />
          )}
        </div>
      </td>

      {/* DRAFTED % */}
      <td className="w-[92px] min-w-[92px] max-w-[92px] border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">{draftedDisplay}</span>
        </div>
      </td>

      {/* ODDS */}
      <td className="w-[80px] min-w-[80px] max-w-[80px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-mono tabular-nums text-foreground">{oddsDisplay}</span>
        </div>
      </td>
    </>
  )
}

/**
 * Completed (finished) row cells: pos · player · total DK · score · salary ·
 * value (PTS/$1K) · ownership % · result · odds. Recap table for analyzing
 * final tournament and fantasy results. Mobile priority: Position, Player,
 * Total DK, Score visible first.
 */
function ScoringRowCells({
  entrant,
  positionCountMap,
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap ?? new Map())
  const salaryDisplay = formatMissing(entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null)
  const oddsDisplay = formatMissing(entrant.oddsToWin)
  const ownershipDisplay = formatDraftedPercent(entrant.ownershipPercent)
  const finalValue = calculateFinalValue(entrant.totalDkFantasyPoints, entrant.dfsSalary)

  const isTie = entrant.position != null && (positionCountMap?.get(entrant.position) ?? 0) > 1
  const result = finishResult(entrant, isTie)
  const isWinner = entrant.position === 1 && !isTie && entrant.status !== 'CUT' && entrant.cutMade !== false

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

      {/* TOTAL DK */}
      <td className="w-[120px] min-w-[120px] max-w-[120px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          {entrant.totalDkFantasyPoints == null ? (
            <MetricEmptyState />
          ) : (
            <span className="text-sm font-semibold tabular-nums text-white">{entrant.totalDkFantasyPoints}</span>
          )}
        </div>
      </td>

      {/* FINAL SCORE */}
      <td className="w-[92px] min-w-[92px] max-w-[92px] px-1 sm:px-2 align-middle bg-white/[0.012]">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {entrant.totalStrokes ? `${entrant.totalStrokes}` : '—'} {entrant.total !== undefined && entrant.total !== null ? `(${entrant.total > 0 ? '+' : ''}${entrant.total})` : ''}
          </span>
        </div>
      </td>

      {/* SALARY */}
      <td className="w-[110px] min-w-[110px] max-w-[110px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center gap-1 whitespace-nowrap">
          {entrant.dfsSalary ? (
            <>
              <DraftKingsMark className="h-3 w-auto shrink-0" />
              <span className="text-sm font-semibold tabular-nums text-white">{salaryDisplay}</span>
            </>
          ) : (
            <MetricEmptyState />
          )}
        </div>
      </td>

      {/* VALUE (PTS/$1K) */}
      <td className="w-[96px] min-w-[96px] max-w-[96px] border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          {finalValue == null ? (
            <MetricEmptyState />
          ) : (
            <span className="text-sm font-semibold tabular-nums text-sky-300">{finalValue}</span>
          )}
        </div>
      </td>

      {/* OWNERSHIP % */}
      <td className="w-[92px] min-w-[92px] max-w-[92px] border-l border-white/[0.055] px-1 sm:px-2 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
            {entrant.ownershipPercent == null ? '—' : `${Math.round(entrant.ownershipPercent)}%`}
          </span>
        </div>
      </td>

      {/* RESULT */}
      <td className="w-[88px] min-w-[88px] max-w-[88px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
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

      {/* ODDS */}
      <td className="w-[80px] min-w-[80px] max-w-[80px] border-l border-white/[0.055] px-1 sm:px-3 align-middle">
        <div className="flex items-center justify-center h-full">
          <span className="text-sm font-mono tabular-nums text-foreground">{oddsDisplay}</span>
        </div>
      </td>
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
  
  // Track whether the table has been scrolled horizontally to hide the scroll hint.
  const [hasScrolled, setHasScrolled] = React.useState(false)
  
  const handleTableScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target.scrollLeft > 0 && !hasScrolled) {
      setHasScrolled(true)
    }
  }, [hasScrolled])

  return (
    <div
      className="w-full min-w-0 tournament-table-container"
      style={{ '--player-column-width': playerColumnWidth || '220px' } as React.CSSProperties}
    >
      {/* Premium table wrapper. overflow-clip (NOT overflow-hidden) clips the
          rounded corners WITHOUT creating a scroll container, so the sticky
          header can still pin to the top of the page. */}
      <div className="relative overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#0B0E13]">
        {/* Premium glass background with subtle internal grid */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(120%_100%_at_50%_0%,rgba(255,255,255,0.01),transparent)]" />

        {/* Table content */}
        <div className="relative z-10">
          {/* Mobile scroll hint — hidden after first scroll */}
          {!hasScrolled && (
            <div className="sm:hidden text-xs text-muted-foreground mb-2 flex items-center gap-1 px-6 pt-6 transition-opacity duration-300">
              <span>Scroll for more →</span>
            </div>
          )}
          <div
            ref={scrollContainerRef}
            onScroll={handleTableScroll}
            className={cn('overflow-x-auto sm:overflow-x-visible select-none', styles.scrollContainer)}
            style={{ userSelect: 'none', maxWidth: '100%' }}
          >
            <table className="w-max table-fixed border-collapse sm:w-full">
              <colgroup>
                {columns.map((col) => (
                  <col key={col.id} className={col.colClassName} />
                ))}
              </colgroup>
              <thead className={cn('sticky top-0 sm:top-[94px] z-20 bg-[#0D1117]/80 backdrop-blur-md border-b border-white/[0.06] relative',
                'before:content-[\'\'] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:pointer-events-none',
                phase === 'scheduled' ? 'before:bg-gradient-to-r before:from-transparent before:via-emerald-400/50 before:to-transparent' : 
                phase === 'live' ? 'before:bg-gradient-to-r before:from-transparent before:via-amber-400/50 before:to-transparent' : 
                'before:bg-gradient-to-r before:from-transparent before:via-sky-400/50 before:to-transparent'
              )}>
                <tr>
                  {columns.map((col) => (
                    <th key={col.id} className={cn(col.thClassName, 'relative text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground')} title={col.tooltip}>
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
                    className="h-14 border-b border-white/[0.045] bg-transparent transition-colors duration-100 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/[0.2]"
                    style={{ cursor: 'pointer' }}
                  >
                    {isScheduled ? (
                      <FantasyRowCells entrant={entrant} dfsResult={dfsByPlayer.get(entrant.playerId)} rank={index + 1} />
                    ) : phase === 'live' ? (
                      <ScoreLiveRowCells entrant={entrant} positionCountMap={positionCountMap} />
                    ) : (
                      <ScoringRowCells entrant={entrant} positionCountMap={positionCountMap} />
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
