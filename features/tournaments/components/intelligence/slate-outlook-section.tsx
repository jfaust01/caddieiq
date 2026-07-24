'use client'

import type { ComponentType, ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { BarChart3, Radio, Sparkles } from 'lucide-react'

import type {
  FieldEntrant,
  TournamentField,
  TournamentSummary,
} from '@/features/tournaments/types'
import {
  type DfsBoard,
  type DfsBoardKey,
  type DfsConfidence,
  type DfsValueField,
  type DfsValueTier,
  TIER_LABEL,
} from '@/lib/dfs-value'
import { cn } from '@/lib/utils'
import {
  EMPTY_VALUE,
  formatDfsSalary,
  formatDkTotal,
} from '@/features/tournaments/utils/format'
import { DraftKingsMark } from '../draftkings-mark'

/* ------------------------------------------------------------------ */
/* Phase + accent (mirrors TournamentIntelligence)                     */
/* ------------------------------------------------------------------ */

type Phase = 'scheduled' | 'live' | 'completed'

function getPhase(status: TournamentSummary['status']): Phase {
  if (status === 'COMPLETED') return 'completed'
  if (status === 'ACTIVE') return 'live'
  return 'scheduled'
}

interface Accent {
  text: string
  tile: string
  tileBorder: string
  tileGlow: string
  line: string
  glow: string
  chip: string
}

const ACCENT: Record<Phase, Accent> = {
  scheduled: {
    text: 'text-emerald-400',
    tile: 'bg-emerald-400/[0.06]',
    tileBorder: 'border-emerald-400/30',
    tileGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    line: 'via-emerald-500/50',
    glow: 'bg-emerald-500/[0.06]',
    chip: 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300',
  },
  live: {
    text: 'text-yellow-400',
    tile: 'bg-yellow-400/[0.06]',
    tileBorder: 'border-yellow-400/30',
    tileGlow: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]',
    line: 'via-yellow-500/50',
    glow: 'bg-yellow-500/[0.06]',
    chip: 'border-yellow-400/25 bg-yellow-400/[0.08] text-yellow-300',
  },
  completed: {
    text: 'text-sky-400',
    tile: 'bg-sky-400/[0.06]',
    tileBorder: 'border-sky-400/30',
    tileGlow: 'shadow-[0_0_20px_rgba(56,189,248,0.15)]',
    line: 'via-sky-500/50',
    glow: 'bg-sky-500/[0.06]',
    chip: 'border-sky-400/25 bg-sky-400/[0.08] text-sky-300',
  },
}

const CONFIDENCE_SHORT: Record<DfsConfidence, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
  none: EMPTY_VALUE,
}

/* ------------------------------------------------------------------ */
/* Panel shell + row primitives                                        */
/* ------------------------------------------------------------------ */

interface BoardColumnProps {
  title: string
  description?: string
  accent: Phase
  children: ReactNode
  /** Honest empty message when there are no rows. */
  emptyMessage?: string
  isEmpty?: boolean
}

/** A titled mini-board column inside the panel. */
function BoardColumn({
  title,
  description,
  accent,
  children,
  emptyMessage,
  isEmpty,
}: BoardColumnProps) {
  const tokens = ACCENT[accent]
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-[16px] border border-white/[0.05] bg-white/[0.015] p-4">
      <div className="flex flex-col gap-0.5">
        <h4
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.12em]',
            tokens.text,
          )}
        >
          {title}
        </h4>
        {description ? (
          <p className="text-[11px] leading-relaxed text-white/40 text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {isEmpty ? (
        <p className="py-2 text-xs leading-relaxed text-white/40 text-pretty">
          {emptyMessage ?? 'Not available yet'}
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5">{children}</ol>
      )}
    </div>
  )
}

interface RankRowProps {
  rank: number
  name: string
  /** Right-aligned primary metric (e.g. tier badge, DK points, score-to-par). */
  metric: ReactNode
  /** Secondary line under the name (headline / salary / thru). */
  detail?: ReactNode
  accent: Phase
}

/** One ranked player row. */
function RankRow({ rank, name, metric, detail, accent }: RankRowProps) {
  const tokens = ACCENT[accent]
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums',
          'border border-white/[0.06] bg-white/[0.03]',
          rank === 1 ? tokens.text : 'text-white/50',
        )}
        aria-hidden
      >
        {rank}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-white">{name}</span>
        {detail ? (
          <span className="truncate text-[11px] leading-relaxed text-white/45">
            {detail}
          </span>
        ) : null}
      </div>
      <div className="shrink-0 text-right">{metric}</div>
    </li>
  )
}

/** Small pill for a DFS value tier. */
function TierBadge({ tier, accent }: { tier: DfsValueTier | null; accent: Phase }) {
  if (!tier) return <span className="text-sm text-white/40">{EMPTY_VALUE}</span>
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums',
        ACCENT[accent].chip,
      )}
    >
      {TIER_LABEL[tier]}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Entrant helpers (authoritative data only)                           */
/* ------------------------------------------------------------------ */

function formatToPar(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY_VALUE
  }
  if (value === 0) return 'E'
  return value > 0 ? `+${value}` : `${value}`
}

function numericPosition(position: FieldEntrant['position']): number | null {
  return typeof position === 'number' && Number.isFinite(position) ? position : null
}

function isActive(e: FieldEntrant): boolean {
  return (
    !e.withdrawn &&
    e.status !== 'WITHDRAWN' &&
    e.status !== 'DISQUALIFIED'
  )
}

/** Top N of the leaderboard by position (fallback: lowest total to par). */
function leaderboardTop(entrants: FieldEntrant[], n: number): FieldEntrant[] {
  const scored = entrants.filter((e) => isActive(e) && e.total !== null)
  return [...scored]
    .sort((a, b) => {
      const pa = numericPosition(a.position)
      const pb = numericPosition(b.position)
      if (pa !== null && pb !== null && pa !== pb) return pa - pb
      return (a.total as number) - (b.total as number)
    })
    .slice(0, n)
}

/** Top N DraftKings scorers by (running or final) DK fantasy points. */
function dkTop(entrants: FieldEntrant[], n: number): FieldEntrant[] {
  const withDk = entrants.filter(
    (e) => e.dkFantasyPoints !== null && Number.isFinite(e.dkFantasyPoints),
  )
  return [...withDk]
    .sort((a, b) => (b.dkFantasyPoints as number) - (a.dkFantasyPoints as number))
    .slice(0, n)
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

interface PanelProps {
  accent: Phase
  icon: ComponentType<{ className?: string }>
  title: string
  subtitle: string
  children: ReactNode
}

function Panel({ accent, icon: Icon, title, subtitle, children }: PanelProps) {
  const tokens = ACCENT[accent]
  const prefersReducedMotion = useReducedMotion()
  return (
    <motion.section
      aria-label={title}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-[24px] p-6',
        'border border-white/[0.08] bg-[#0d1318]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_12px_30px_rgba(0,0,0,0.18)]',
      )}
    >
      {/* Top edge accent line */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
          tokens.line,
        )}
      />
      {/* Corner glow */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl',
          tokens.glow,
        )}
      />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
              tokens.tile,
              tokens.tileBorder,
              tokens.tileGlow,
            )}
          >
            <Icon className={cn('size-5', tokens.text)} aria-hidden />
          </div>
          <div className="flex min-w-0 flex-col">
            <h3
              className={cn(
                'text-sm font-bold uppercase tracking-[0.14em]',
                tokens.text,
              )}
            >
              {title}
            </h3>
            <p className="text-sm text-white/60 text-pretty">{subtitle}</p>
          </div>
        </div>

        {children}
      </div>
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/* Phase renderers                                                     */
/* ------------------------------------------------------------------ */

/** The DFS boards the pre-tournament outlook surfaces, in display order. */
const OUTLOOK_BOARD_KEYS: DfsBoardKey[] = [
  'topValues',
  'highestConfidence',
  'riskyGppTargets',
]

function ScheduledOutlook({ dfsField }: { dfsField: DfsValueField | null | undefined }) {
  const boards: DfsBoard[] = (dfsField?.boards ?? []).filter(
    (b) => OUTLOOK_BOARD_KEYS.includes(b.key) && b.entries.length > 0,
  )
  // Keep the intended display order.
  boards.sort(
    (a, b) => OUTLOOK_BOARD_KEYS.indexOf(a.key) - OUTLOOK_BOARD_KEYS.indexOf(b.key),
  )

  const hasBoards = boards.length > 0

  return (
    <Panel
      accent="scheduled"
      icon={Sparkles}
      title="AI Slate Outlook"
      subtitle="DFS Value Model reads on this field — build your lineup before lock."
    >
      {hasBoards ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardColumn
              key={board.key}
              accent="scheduled"
              title={board.title}
              description={board.description}
            >
              {board.entries.slice(0, 4).map((entry) => (
                <RankRow
                  key={entry.playerId}
                  accent="scheduled"
                  rank={entry.rank}
                  name={entry.displayName}
                  detail={entry.headline}
                  metric={<TierBadge tier={entry.tier} accent="scheduled" />}
                />
              ))}
            </BoardColumn>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-white/45 text-pretty">
          The DFS Value Model lights up automatically once salaries, odds, and
          course-fit signals land for this field. No projections are shown until
          the platform holds the data to back them.
        </p>
      )}

      <p className="text-[11px] italic text-white/40 text-pretty">
        Value fuses every Signal Family with DraftKings salary and is
        confidence-aware — families the platform can&apos;t back are never
        defaulted to a neutral score.
      </p>
    </Panel>
  )
}

function LiveInsights({ field }: { field: TournamentField }) {
  const leaders = leaderboardTop(field.entrants, 5)
  const topDk = dkTop(field.entrants, 5)

  return (
    <Panel
      accent="live"
      icon={Radio}
      title="Live Insights"
      subtitle="Track the leaderboard and live DraftKings scoring as the round unfolds."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <BoardColumn
          accent="live"
          title="On The Leaderboard"
          description="Top of the field right now"
          isEmpty={leaders.length === 0}
          emptyMessage="Live leaderboard not available yet"
        >
          {leaders.map((e, i) => {
            const thru = e.thruHole
              ? e.thruHole.toUpperCase() === 'F'
                ? 'Finished'
                : `Thru ${e.thruHole}`
              : undefined
            return (
              <RankRow
                key={e.playerId}
                accent="live"
                rank={numericPosition(e.position) ?? i + 1}
                name={e.playerName}
                detail={thru}
                metric={
                  <span className="text-base font-bold tabular-nums text-white">
                    {formatToPar(e.total)}
                  </span>
                }
              />
            )
          })}
        </BoardColumn>

        <BoardColumn
          accent="live"
          title="Top DraftKings Scores"
          description="Highest live DK fantasy points"
          isEmpty={topDk.length === 0}
          emptyMessage="Live DraftKings scoring not available yet"
        >
          {topDk.map((e, i) => (
            <RankRow
              key={e.playerId}
              accent="live"
              rank={i + 1}
              name={e.playerName}
              detail={e.dfsSalary !== null ? formatDfsSalary(e.dfsSalary) : undefined}
              metric={
                <span className="inline-flex items-center gap-1 text-base font-bold tabular-nums text-white">
                  {formatDkTotal(e.dkFantasyPoints as number)}
                </span>
              }
            />
          ))}
        </BoardColumn>
      </div>
    </Panel>
  )
}

function Recap({ field }: { field: TournamentField }) {
  const finalBoard = leaderboardTop(field.entrants, 5)
  const topDk = dkTop(field.entrants, 5)

  return (
    <Panel
      accent="completed"
      icon={BarChart3}
      title="Tournament Recap"
      subtitle="Final standings and DraftKings results — review what actually happened."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <BoardColumn
          accent="completed"
          title="Final Leaderboard"
          description="Where the field finished"
          isEmpty={finalBoard.length === 0}
          emptyMessage="Final leaderboard not available yet"
        >
          {finalBoard.map((e, i) => (
            <RankRow
              key={e.playerId}
              accent="completed"
              rank={numericPosition(e.position) ?? i + 1}
              name={e.playerName}
              metric={
                <span className="text-base font-bold tabular-nums text-white">
                  {formatToPar(e.total)}
                </span>
              }
            />
          ))}
        </BoardColumn>

        <BoardColumn
          accent="completed"
          title="Top DraftKings Scores"
          description="Best final DK fantasy performances"
          isEmpty={topDk.length === 0}
          emptyMessage="DraftKings scoring not available yet"
        >
          {topDk.map((e, i) => {
            const own =
              e.ownershipPercent !== null && Number.isFinite(e.ownershipPercent)
                ? `${Math.round(e.ownershipPercent)}% Drafted`
                : e.dfsSalary !== null
                  ? formatDfsSalary(e.dfsSalary)
                  : undefined
            return (
              <RankRow
                key={e.playerId}
                accent="completed"
                rank={i + 1}
                name={e.playerName}
                detail={own}
                metric={
                  <span className="text-base font-bold tabular-nums text-white">
                    {formatDkTotal(e.dkFantasyPoints as number)}
                  </span>
                }
              />
            )
          })}
        </BoardColumn>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

interface SlateOutlookSectionProps {
  tournament: TournamentSummary
  field: TournamentField
  dfsField?: DfsValueField | null
}

/**
 * The phase-adaptive second intelligence section that sits below the status
 * cards. It becomes an AI Slate Outlook before the event (from the DFS Value
 * Model boards), Live Insights during play (leaderboard + live DK scoring), and
 * a Recap afterward (final standings + DK results). Every row is authoritative;
 * absent data degrades to an honest empty message rather than a fabricated one.
 */
export function SlateOutlookSection({
  tournament,
  field,
  dfsField,
}: SlateOutlookSectionProps) {
  const phase = getPhase(tournament.status)

  if (phase === 'scheduled') return <ScheduledOutlook dfsField={dfsField} />
  if (phase === 'live') return <LiveInsights field={field} />
  return <Recap field={field} />
}
