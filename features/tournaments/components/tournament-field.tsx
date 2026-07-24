'use client'

import { Search, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/empty-state'
import { useDragScroll } from '@/features/tournaments/hooks/use-drag-scroll'
import { usePlayerColumnWidth } from '@/features/tournaments/hooks/use-player-column-width'
import styles from './tournament-field.module.css'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'
import { FieldAnalyticsSummary } from '@/features/tournaments/components/field-analytics-summary'
import { PlayerFlag } from '@/features/tournaments/components/player-flag'
import { ScoreCell } from '@/features/tournaments/components/score-cell'
import { PlayerScorecardModal } from '@/features/tournaments/components/player-scorecard-modal'
import { TournamentScoreCell } from '@/features/tournaments/components/tournament-score-cell'
import { ScorecardLoader } from '@/features/tournaments/components/scorecard-loader'
import { ScorecardErrorBoundaryV2 } from '@/features/tournaments/components/scorecard-error-boundary-v2'
import { ExpandedPlayerScorecard } from '@/features/tournaments/components/expanded-player-scorecard'
import { DraftKingsMark, DKLabel } from '@/features/tournaments/components/draftkings-mark'
import { buildPositionCountMap, formatPositionWithStatusPriority } from '@/features/tournaments/utils/format-position'
import type { FieldEntrant, FieldEntryStatus, TournamentField } from '@/features/tournaments/types'
import { fieldStatusLabel } from '@/features/tournaments/utils/format'
import type { DfsValueField, DfsValueResult, DfsValueTier } from '@/lib/dfs-value'
import { TIER_LABEL } from '@/lib/dfs-value'
import { cn } from '@/lib/utils'

/**
 * Premium filter-dropdown styling (visual only) matching the Tournament
 * Winner / Scorecard / Analytics card design language. Scoped to this page —
 * shared Select primitives are left untouched. `!` utilities override the
 * primitive's conflicting height/radius/bg/text defaults.
 */
const premiumTriggerClass = cn(
  '!h-[60px] w-full !rounded-[22px] !border-[#2A2F36] !bg-[#111418] !px-[22px] !text-lg !font-semibold !text-white',
  'relative overflow-hidden transition-all duration-[250ms]',
  'hover:-translate-y-px hover:!border-white/25 hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)]',
  'data-[popup-open]:!border-[#34D17A] data-[popup-open]:shadow-[0_0_0_3px_rgba(52,209,122,0.15),0_10px_30px_rgba(16,185,129,0.12)]',
  // Chevron: 20px, muted gray
  '[&>svg]:!size-5 [&>svg]:text-muted-foreground',
  'lg:w-[240px]',
)

const premiumContentClass = cn(
  '!rounded-[22px] border border-white/[0.08] !bg-[#0D1318]/95 p-2 !shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-0 backdrop-blur-xl',
)

const premiumItemClass = cn(
  'rounded-[14px] px-3 py-2.5 text-base font-medium text-foreground/90',
  'data-[highlighted]:!bg-emerald-500/15 data-[highlighted]:!text-emerald-50',
  'data-[selected]:!bg-emerald-500/10 data-[selected]:!text-emerald-400',
)

/**
 * Format ownership percentage as "X% Drafted" or "— Drafted" for missing
 */
function formatDraftedPercent(
  value: number | null | undefined
): string {
  if (
    value == null ||
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return '— Drafted'
  }

  // Handle both decimal (0-1) and percentage (0-100) formats
  const percent = value > 0 && value <= 1 ? value * 100 : value

  return `${Math.round(percent)}% Drafted`
}

type SortKey =
  | 'pos-asc'
  | 'pos-desc'
  | 'name-asc'
  | 'name-desc'
  | 'total-asc'
  | 'total-desc'
  | 'salary-asc'
  | 'salary-desc'
  | 'own-asc'
  | 'own-desc'
  | 'odds-asc'
  | 'odds-desc'
  | 'rating-asc'
  | 'rating-desc'

// Sort options for the scoring (live/completed) table — anchored on position.
const SCORING_SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'pos-asc', label: 'Position (↑)' },
  { value: 'pos-desc', label: 'Position (↓)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'total-asc', label: 'Total (Low)' },
  { value: 'total-desc', label: 'Total (High)' },
  { value: 'salary-asc', label: 'DK Salary (Low)' },
  { value: 'salary-desc', label: 'DK Salary (High)' },
  { value: 'own-asc', label: 'Ownership (Low)' },
  { value: 'own-desc', label: 'Ownership (High)' },
  { value: 'odds-asc', label: 'Odds (Favorable)' },
  { value: 'odds-desc', label: 'Odds (Long)' },
]

// Sort options for the pre-tournament fantasy table — no scores/positions yet,
// so it anchors on the CaddieIQ rating and other fantasy signals.
const PRE_SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'rating-desc', label: 'CaddieIQ Rating (High)' },
  { value: 'rating-asc', label: 'CaddieIQ Rating (Low)' },
  { value: 'salary-desc', label: 'DK Salary (High)' },
  { value: 'salary-asc', label: 'DK Salary (Low)' },
  { value: 'own-desc', label: 'Proj Ownership (High)' },
  { value: 'own-asc', label: 'Proj Ownership (Low)' },
  { value: 'odds-asc', label: 'Odds (Favorable)' },
  { value: 'odds-desc', label: 'Odds (Long)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
]

const STATUS_ORDER: Record<FieldEntryStatus, number> = {
  CONFIRMED: 0,
  FINISHED: 1,
  ALTERNATE: 2,
  CUT: 3,
  WITHDRAWN: 4,
  DISQUALIFIED: 5,
}

// Tournament DFS table has 9 visible columns: POS, PLAYER, TOTAL, R1, R2, R3, R4, DFS, ODDS
const VISIBLE_COLUMN_COUNT = 9

/**
 * Normalized tournament phase driving the status-aware fantasy workflow.
 * - scheduled: no scores yet -> fantasy lineup-building table (emerald accent)
 * - live: in-progress scoring -> real-time fantasy table (amber accent)
 * - completed: final results -> fantasy recap table (sky/blue accent)
 */
type TablePhase = 'scheduled' | 'live' | 'completed'

function classifyPhase(status: string | null | undefined): TablePhase {
  const s = (status ?? '').trim().toLowerCase()
  // Check completed first because "complete" would also substring-match nothing
  // in the live list, but keeping the order explicit avoids ambiguity.
  const completed = ['completed', 'complete', 'final', 'finished', 'official']
  const live = ['active', 'in_progress', 'in progress', 'live', 'playing', 'suspended']
  if (completed.some((k) => s.includes(k))) return 'completed'
  if (live.some((k) => s.includes(k))) return 'live'
  return 'scheduled'
}

/** Per-phase accent styling (emerald / amber / sky) applied to chips + header. */
const PHASE_ACCENT: Record<
  TablePhase,
  { chipActive: string; chipCount: string; headerLine: string; glow: string }
> = {
  scheduled: {
    chipActive: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200 shadow-[0_0_0_1px_rgba(52,209,122,0.15)]',
    chipCount: 'bg-emerald-500/20 text-emerald-100',
    headerLine: 'via-emerald-400/40',
    glow: 'bg-emerald-500/[0.04]',
  },
  live: {
    chipActive: 'border-amber-400/40 bg-amber-500/15 text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]',
    chipCount: 'bg-amber-500/20 text-amber-100',
    headerLine: 'via-amber-400/45',
    glow: 'bg-amber-500/[0.05]',
  },
  completed: {
    chipActive: 'border-sky-400/40 bg-sky-500/15 text-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]',
    chipCount: 'bg-sky-500/20 text-sky-100',
    headerLine: 'via-sky-400/40',
    glow: 'bg-sky-500/[0.05]',
  },
}

/**
 * Honest finish result derived only from authoritative fields (status, cut
 * flag, position, ties). Returns Won / T4 / 15 / MC / WD / DQ / — — never a
 * fabricated tier.
 */
function finishResult(e: FieldEntrant, isTie: boolean): string {
  if (e.status === 'WITHDRAWN' || e.withdrawn) return 'WD'
  if (e.status === 'DISQUALIFIED') return 'DQ'
  if (e.status === 'CUT' || e.cutMade === false) return 'MC'
  if (e.position == null) return '—'
  if (e.position === 1) return 'Won'
  return `${isTie ? 'T' : ''}${e.position}`
}

/** Emerald→red accent per DFS value tier (badge styling only). */
const TIER_BADGE_CLASS: Record<DfsValueTier, string> = {
  A_PLUS: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
  A: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
  B_PLUS: 'border-sky-400/25 bg-sky-500/10 text-sky-300',
  B: 'border-sky-400/20 bg-sky-500/[0.08] text-sky-300',
  C: 'border-amber-400/25 bg-amber-500/10 text-amber-300',
  D: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
}

/** Read the 0–100 Course Fit signal from a DFS value result, or null. */
function courseFitScore(result: DfsValueResult | undefined): number | null {
  if (!result) return null
  const fit = result.contributions.find((c) => c.key === 'courseFit')
  return fit && fit.status === 'scored' && fit.score != null ? Math.round(fit.score) : null
}

/** Small colored bar (0–100) used behind rating/fit numbers. */
function ScoreMeter({ value, tone }: { value: number | null; tone: string }) {
  return (
    <div className="mt-1 h-1 w-12 overflow-hidden rounded-full bg-white/[0.08]">
      {value != null && (
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      )}
    </div>
  )
}

/**
 * Fantasy (pre-tournament) row cells: rank · player · CaddieIQ rating ·
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
  const initials = entrant.playerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const rating = entrant.fantasyScore
  const fit = courseFitScore(dfsResult)
  const tier = dfsResult?.tier ?? null
  const valueScore = dfsResult?.score ?? null
  const salaryDisplay = entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : '—'
  const ownDisplay = entrant.ownershipPercent == null ? '—' : `${Math.round(entrant.ownershipPercent)}%`
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
        <div className="flex items-center justify-start gap-3 min-w-0 h-full">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={entrant.headshotUrl ?? undefined} alt={entrant.playerName} />
            <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="min-w-0 truncate text-sm font-semibold text-foreground">{entrant.playerName}</span>
            <PlayerFlag countryCode={entrant.countryCode} className="h-3 w-auto shrink-0 rounded-[2px]" />
          </div>
        </div>
      </td>

      {/* CADDIEIQ RATING */}
      <td className="px-1 sm:px-2 align-middle">
        <div className="flex h-full flex-col items-center justify-center">
          <span className={cn('text-sm font-semibold tabular-nums', rating == null ? 'text-muted-foreground' : 'text-emerald-300')}>
            {rating == null ? '—' : Math.round(rating)}
          </span>
          <ScoreMeter value={rating} tone="bg-emerald-400/70" />
        </div>
      </td>

      {/* COURSE FIT */}
      <td className="px-1 sm:px-2 align-middle">
        <div className="flex h-full flex-col items-center justify-center">
          <span className={cn('text-sm font-semibold tabular-nums', fit == null ? 'text-muted-foreground' : 'text-foreground')}>
            {fit == null ? '—' : fit}
          </span>
          <ScoreMeter value={fit} tone="bg-sky-400/70" />
        </div>
      </td>

      {/* DFS VALUE */}
      <td className="border-l border-border/40 px-1 sm:px-2 align-middle">
        <div className="flex h-full flex-col items-center justify-center gap-1">
          {tier ? (
            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold', TIER_BADGE_CLASS[tier])}>
              {TIER_LABEL[tier]}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
          {valueScore != null && (
            <span className="text-[11px] tabular-nums text-muted-foreground/70">{valueScore}/100</span>
          )}
        </div>
      </td>

      {/* DK SALARY */}
      <td className="px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center gap-1.5 whitespace-nowrap">
          {entrant.dfsSalary ? (
            <>
              <DraftKingsMark className="h-3 w-auto shrink-0" />
              <span className="text-sm font-semibold tabular-nums text-foreground">{salaryDisplay}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
      </td>

      {/* PROJ OWNERSHIP */}
      <td className="border-l border-border/40 px-1 sm:px-3 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className={cn('text-sm font-semibold tabular-nums', entrant.ownershipPercent == null ? 'text-muted-foreground' : 'text-foreground')}>
            {ownDisplay}
          </span>
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
 * Format a number as "—" if null/undefined, else return the value
 */
function formatMissing<T>(value: T | null | undefined): T | string {
  return value == null ? '—' : value
}

/**
 * Create a safe empty scorecard model - guaranteed no null reference errors
 */
function createEmptyScorecard({
  playerName,
  roundNumber = 1,
}: {
  playerName: string
  roundNumber?: number
}) {
  return {
    playerName,
    headshotUrl: null,
    tour: null,
    currentPosition: null,
    roundNumber,
    totalStrokes: null,
    totalToPar: null,
    totalDkPoints: null,
    dfsSalary: null,
    ownershipPercent: null,
    round1Score: null,
    round2Score: null,
    round3Score: null,
    round4Score: null,
    courseName: null,
    coursePar: null,
    courseYardage: null,
    holes: Array.from({ length: 18 }, (_, index) => ({
      holeNumber: index + 1,
      par: null,
      score: null,
      toPar: null,
      dkPoints: null,
    })),
  }
}

/**
 * Parse betting odds string to numeric value for sorting
 */
function parseOdds(odds: string | null): number {
  if (!odds) return Number.MAX_VALUE
  const num = parseInt(odds.replace(/[^\d-]/g, ''), 10)
  return isNaN(num) ? Number.MAX_VALUE : num
}

/**
 * Tournament leaderboard row: displays all scoring columns with proper alignment
 */
function LeaderboardRow({
  entrant,
  positionCountMap = new Map(),
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap)
  const salaryDisplay = entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : '—'
  const oddsDisplay = formatMissing(entrant.oddsToWin)
  
  // Extract initials from player name for avatar fallback
  const initials = entrant.playerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Format ownership percentage
  const ownershipDisplay = entrant.ownershipPercent == null 
    ? '0.00%' 
    : entrant.ownershipPercent.toFixed(2) + '%'

  // Use real tour data from dfs_salaries operator; display "No Tour" if unavailable
  const tour = entrant.tour

  return (
    <tr className="group border-b border-border hover:bg-white/[0.025] transition-colors duration-150 cursor-pointer h-[82px]">
      {/* POS */}
      <td className="px-4 align-middle">
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {positionDisplay}
          </span>
        </div>
      </td>

      {/* PLAYER */}
      <td 
        className="px-3 align-middle"
        style={{ width: 'var(--player-column-width, 240px)', minWidth: 'var(--player-column-width, 240px)' }}
      >
        <div className="flex items-center justify-start gap-3 min-w-0 h-full">
          {/* Headshot Avatar - 40px circular */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={entrant.headshotUrl ?? undefined} alt={entrant.playerName} />
            <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          
          {/* Player name + flag (horizontally aligned) */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="min-w-0 truncate text-sm font-semibold text-foreground">
              {entrant.playerName}
            </span>
            <PlayerFlag countryCode={entrant.countryCode} className="h-3 w-auto shrink-0 rounded-[2px]" />
          </div>
        </div>
      </td>

      {/* TOTAL */}
      <td className="px-2 sm:px-3 align-middle w-[108px] min-w-[108px]">
        <TournamentScoreCell 
          primary={entrant.totalStrokes ?? 'E'} 
          secondary={entrant.total ?? undefined}
          dkPoints={entrant.totalDkFantasyPoints}
        />
      </td>

      {/* R1 */}
      <td className="px-3 align-middle w-[108px] min-w-[108px]">
        <TournamentScoreCell 
          primary={entrant.round1 ?? '—'} 
          secondary={entrant.round1RelToPar ?? undefined}
          dkPoints={entrant.round1DkPoints}
        />
      </td>

      {/* R2 */}
      <td className="px-3 align-middle w-[108px] min-w-[108px]">
        <TournamentScoreCell 
          primary={entrant.round2 ?? '��'} 
          secondary={entrant.round2RelToPar ?? undefined}
          dkPoints={entrant.round2DkPoints}
        />
      </td>

      {/* R3 */}
      <td className="px-3 align-middle w-[108px] min-w-[108px]">
        <TournamentScoreCell 
          primary={entrant.round3 ?? '—'} 
          secondary={entrant.round3RelToPar ?? undefined}
          dkPoints={entrant.round3DkPoints}
        />
      </td>

      {/* R4 */}
      <td className="px-3 align-middle w-[108px] min-w-[108px]">
        <TournamentScoreCell 
          primary={entrant.round4 ?? '—'} 
          secondary={entrant.round4RelToPar ?? undefined}
          dkPoints={entrant.round4DkPoints}
        />
      </td>

      {/* DFS - Combined Salary and Ownership */}
      <td className="border-l border-border/40 px-4 align-middle">
        <div className="flex flex-col items-center justify-center gap-1 h-full">
          <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <DraftKingsMark className="h-3 w-auto shrink-0" />
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {salaryDisplay}
            </span>
          </div>
          <div className="whitespace-nowrap text-xs tabular-nums text-muted-foreground/70">
            {formatDraftedPercent(entrant.ownershipPercent)}
          </div>
        </div>
      </td>

      {/* ODDS TO WIN */}
      <td className="border-l border-border/40 px-3 align-middle">
        <div className="flex items-center justify-center h-full">
          <span className="text-sm font-mono tabular-nums text-muted-foreground">
            {oddsDisplay}
          </span>
        </div>
      </td>
    </tr>
  )
}

/**
 * Internal component to render player row with all cells.
 * Extracted to avoid fragment issues in tbody.
 */
function PlayerRowCells({
  entrant,
  positionCountMap,
  phase,
}: {
  entrant: FieldEntrant
  positionCountMap?: Map<number, number>
  phase: TablePhase
}) {
  const positionDisplay = formatPositionWithStatusPriority(entrant, positionCountMap)
  const salaryDisplay = formatMissing(entrant.dfsSalary ? `$${entrant.dfsSalary.toLocaleString()}` : null)
  const oddsDisplay = formatMissing(entrant.oddsToWin)

  const isTie = entrant.position != null && (positionCountMap?.get(entrant.position) ?? 0) > 1
  const result = finishResult(entrant, isTie)
  const isWinner = phase === 'completed' && entrant.position === 1 && entrant.status !== 'CUT' && entrant.cutMade !== false

  const initials = entrant.playerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      {/* POS */}
      <td className="w-[52px] min-w-[52px] max-w-[52px] px-1 sm:px-2 align-middle text-center">
        <span className={cn(
          "text-sm font-semibold tabular-nums",
          isWinner ? "text-emerald-300" : "text-foreground"
        )}>
          {positionDisplay}
        </span>
      </td>

      {/* PLAYER */}
      <td className="w-[calc(100vw-256px)] min-w-[190px] max-w-[240px] sm:w-[300px] sm:min-w-[260px] sm:max-w-none px-2 sm:px-3 align-middle text-left">
        <div className="flex min-w-0 items-center gap-2">
          {entrant.headshotUrl ? (
            <img
              src={entrant.headshotUrl}
              alt={entrant.playerName}
              className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-full border border-white/[0.08] object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-xs sm:text-xs font-semibold text-white">
              {initials}
            </div>
          )}
          <div className="flex min-w-0 items-center gap-1">
            <span className="min-w-0 truncate text-sm sm:text-sm font-semibold text-foreground">{entrant.playerName}</span>
            {entrant.countryCode && <PlayerFlag countryCode={entrant.countryCode} className="h-4 sm:h-5 w-auto shrink-0 rounded-[2px]" />}
          </div>
        </div>
      </td>

      {/* TOTAL */}
      <td className="w-[92px] min-w-[92px] max-w-[92px] px-1 sm:px-2 align-middle bg-white/[0.012] border-x border-white/[0.035]">
        <TournamentScoreCell 
          primary={entrant.totalStrokes ?? 'E'} 
          secondary={entrant.total ?? undefined}
          dkPoints={entrant.dkFantasyPoints}
          isMobile
        />
      </td>

      {/* THRU / TODAY — live only (real thru-hole + current round score) */}
      {phase === 'live' && (
        <td className="w-[76px] min-w-[76px] max-w-[76px] px-1 sm:px-2 align-middle">
          <div className="flex h-full flex-col items-center justify-center leading-tight">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {entrant.thruHole ?? '—'}
            </span>
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
        <TournamentScoreCell 
          primary={entrant.round1 ?? '—'} 
          secondary={entrant.round1RelToPar ?? undefined}
          dkPoints={entrant.round1DkPoints}
        />
      </td>

      {/* R2 */}
      <td className="w-[82px] min-w-[82px] max-w-[82px] px-1 sm:px-3 align-middle">
        <TournamentScoreCell 
          primary={entrant.round2 ?? '—'} 
          secondary={entrant.round2RelToPar ?? undefined}
          dkPoints={entrant.round2DkPoints}
        />
      </td>

      {/* R3 */}
      <td className="w-[82px] min-w-[82px] max-w-[82px] px-1 sm:px-3 align-middle">
        <TournamentScoreCell 
          primary={entrant.round3 ?? '—'} 
          secondary={entrant.round3RelToPar ?? undefined}
          dkPoints={entrant.round3DkPoints}
        />
      </td>

      {/* R4 */}
      <td className="w-[82px] min-w-[82px] max-w-[82px] px-1 sm:px-3 align-middle">
        <TournamentScoreCell 
          primary={entrant.round4 ?? '—'} 
          secondary={entrant.round4RelToPar ?? undefined}
          dkPoints={entrant.round4DkPoints}
        />
      </td>

      {/* DFS */}
      <td className="w-[126px] min-w-[126px] max-w-[126px] border-l border-white/[0.055] px-2 sm:px-4 align-middle bg-orange-500/[0.012]">
        <div className="flex flex-col items-center justify-center gap-1 h-full">
          <div className="inline-flex items-center gap-1 whitespace-nowrap">
            <DraftKingsMark className="h-3 w-auto shrink-0" />
            <span className="text-sm font-semibold tabular-nums text-white">
              {salaryDisplay}
            </span>
          </div>
          <div className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
            {formatDraftedPercent(entrant.ownershipPercent)}
          </div>
        </div>
      </td>

      {/* ODDS TO WIN */}
      <td className="w-[80px] min-w-[80px] max-w-[80px] border-l border-white/[0.045] px-1 sm:px-3 align-middle">
        <div className="flex items-center justify-center h-full">
          <span className="text-sm font-mono tabular-nums text-foreground">
            {oddsDisplay}
          </span>
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



interface TournamentFieldProps {
  field: TournamentField
  tournamentId: string
  /** Tournament status string; drives the pre-tournament vs scoring table. */
  status?: string | null
  /** DFS Value Model field, used for the pre-tournament fantasy columns. */
  dfsField?: DfsValueField | null
}

/**
 * Tournament Field leaderboard: a searchable, sortable, paginated table showing
 * all players with live tournament scoring, round-by-round results, and projections.
 */
export function TournamentField({ field, tournamentId, status, dfsField }: TournamentFieldProps) {
  const phase = classifyPhase(status)
  const isPre = phase === 'scheduled'
  const accent = PHASE_ACCENT[phase]
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FieldEntryStatus | 'ALL'>('ALL')
  const [sort, setSort] = useState<SortKey>(() => (phase === 'scheduled' ? 'rating-desc' : 'pos-asc'))
  const [chip, setChip] = useState<string>('all')

  // Sort options depend on phase: pre-tournament anchors on fantasy rating,
  // scoring anchors on position/total.
  const sortOptions = isPre ? PRE_SORT_OPTIONS : SCORING_SORT_OPTIONS
  const [selectedScorecardPlayer, setSelectedScorecardPlayer] = useState<string | null>(null)
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState(false)
  const [selectedRound, setSelectedRound] = useState<number>(1)

  // Enable drag-to-scroll on the table container
  const scrollContainerRef = useDragScroll({ dragThreshold: 5 })

  // Calculate PLAYER column width based on longest visible name
  const playerColumnWidth = usePlayerColumnWidth(field.entrants, '.tournament-table-container')

  // Status options limited to those actually present in this field.
  const statusOptions = useMemo(() => {
    const present = new Set<FieldEntryStatus>()
    for (const entrant of field.entrants) present.add(entrant.status)
    const ordered = [...present].sort((a, b) => STATUS_ORDER[a] - STATUS_ORDER[b])
    return [
      { value: 'ALL' as const, label: 'All statuses' },
      ...ordered.map((status) => ({ value: status, label: fieldStatusLabel(status) })),
    ]
  }, [field.entrants])

  // DFS Value Model lookups for the pre-tournament fantasy table.
  const dfsByPlayer = useMemo(() => {
    const map = new Map<string, DfsValueResult>()
    for (const p of dfsField?.players ?? []) map.set(p.playerId, p)
    return map
  }, [dfsField])

  // Player ids on the model's "Value Plays" board (salary-efficient targets).
  const valuePlayIds = useMemo(() => {
    const board = dfsField?.boards.find((b) => b.key === 'valuePlays')
    return new Set((board?.entries ?? []).map((e) => e.playerId))
  }, [dfsField])

  // Top-rated ids: the 20 highest CaddieIQ fantasy scores actually present.
  const topRatedIds = useMemo(() => {
    const rated = field.entrants
      .filter((e) => e.fantasyScore != null)
      .sort((a, b) => (b.fantasyScore ?? 0) - (a.fantasyScore ?? 0))
      .slice(0, 20)
    return new Set(rated.map((e) => e.playerId))
  }, [field.entrants])

  // Top live DK scorers (top 20 by in-progress tournament DK points).
  const topLiveDkIds = useMemo(() => {
    const scored = field.entrants
      .filter((e) => e.totalDkFantasyPoints != null)
      .sort((a, b) => (b.totalDkFantasyPoints ?? 0) - (a.totalDkFantasyPoints ?? 0))
      .slice(0, 20)
    return new Set(scored.map((e) => e.playerId))
  }, [field.entrants])

  // Top final DK scorers (top 20 by authoritative final DK points).
  const topFinalDkIds = useMemo(() => {
    const scored = field.entrants
      .filter((e) => e.dkFantasyPoints != null)
      .sort((a, b) => (b.dkFantasyPoints ?? 0) - (a.dkFantasyPoints ?? 0))
      .slice(0, 20)
    return new Set(scored.map((e) => e.playerId))
  }, [field.entrants])

  // Best value ids: top 20 by final DK points per $1k salary (needs both real).
  const topValueIds = useMemo(() => {
    const eligible = field.entrants
      .filter((e) => e.dkFantasyPoints != null && e.dfsSalary != null && e.dfsSalary > 0)
      .sort(
        (a, b) =>
          (b.dkFantasyPoints ?? 0) / (b.dfsSalary ?? 1) - (a.dkFantasyPoints ?? 0) / (a.dfsSalary ?? 1),
      )
      .slice(0, 20)
    return new Set(eligible.map((e) => e.playerId))
  }, [field.entrants])

  const baseFiltered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = field.entrants.filter((entrant) => {
      const matchesQuery =
        normalizedQuery === '' || entrant.playerName.toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === 'ALL' || entrant.status === statusFilter
      return matchesQuery && matchesStatus
    })

    // Pre-tournament there are no positions/scores, so the position/total sort
    // keys are meaningless — default to CaddieIQ fantasy rating (high → low).
    const posLikeSort = ['pos-asc', 'pos-desc', 'total-asc', 'total-desc'].includes(sort)
    if (isPre && posLikeSort) {
      result.sort((a, b) => {
        const ra = a.fantasyScore ?? -Infinity
        const rb = b.fantasyScore ?? -Infinity
        return rb !== ra ? rb - ra : a.playerName.localeCompare(b.playerName)
      })
      return result
    }

    result.sort((a, b) => {
      // Position sorting (default)
      if (sort === 'pos-asc') {
        const posA = a.position ?? Number.MAX_VALUE
        const posB = b.position ?? Number.MAX_VALUE
        return posA !== posB ? posA - posB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'pos-desc') {
        const posA = a.position ?? Number.MIN_VALUE
        const posB = b.position ?? Number.MIN_VALUE
        return posB !== posA ? posB - posA : a.playerName.localeCompare(b.playerName)
      }

      // Name sorting
      if (sort === 'name-asc') return a.playerName.localeCompare(b.playerName)
      if (sort === 'name-desc') return b.playerName.localeCompare(a.playerName)

      // CaddieIQ fantasy rating sorting (nulls last for high, first meaningful)
      if (sort === 'rating-desc') {
        const ra = a.fantasyScore ?? Number.MIN_VALUE
        const rb = b.fantasyScore ?? Number.MIN_VALUE
        return rb !== ra ? rb - ra : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'rating-asc') {
        const ra = a.fantasyScore ?? Number.MAX_VALUE
        const rb = b.fantasyScore ?? Number.MAX_VALUE
        return ra !== rb ? ra - rb : a.playerName.localeCompare(b.playerName)
      }

      // Total score sorting
      if (sort === 'total-asc') {
        const totA = a.total ?? Number.MAX_VALUE
        const totB = b.total ?? Number.MAX_VALUE
        return totA !== totB ? totA - totB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'total-desc') {
        const totA = a.total ?? Number.MIN_VALUE
        const totB = b.total ?? Number.MIN_VALUE
        return totB !== totA ? totB - totA : a.playerName.localeCompare(b.playerName)
      }

      // DK Salary sorting (numeric, nulls after real values)
      if (sort === 'salary-asc') {
        const salA = a.dfsSalary ?? Number.MAX_VALUE
        const salB = b.dfsSalary ?? Number.MAX_VALUE
        return salA !== salB ? salA - salB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'salary-desc') {
        const salA = a.dfsSalary ?? Number.MIN_VALUE
        const salB = b.dfsSalary ?? Number.MIN_VALUE
        return salB !== salA ? salB - salA : a.playerName.localeCompare(b.playerName)
      }

      // Ownership % sorting (nulls after real values)
      if (sort === 'own-asc') {
        const ownA = a.ownershipPercent ?? Number.MAX_VALUE
        const ownB = b.ownershipPercent ?? Number.MAX_VALUE
        return ownA !== ownB ? ownA - ownB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'own-desc') {
        const ownA = a.ownershipPercent ?? Number.MIN_VALUE
        const ownB = b.ownershipPercent ?? Number.MIN_VALUE
        return ownB !== ownA ? ownB - ownA : a.playerName.localeCompare(b.playerName)
      }

      // Odds sorting
      if (sort === 'odds-asc') {
        const oddsA = parseOdds(a.oddsToWin)
        const oddsB = parseOdds(b.oddsToWin)
        return oddsA !== oddsB ? oddsA - oddsB : a.playerName.localeCompare(b.playerName)
      }
      if (sort === 'odds-desc') {
        const oddsA = parseOdds(a.oddsToWin)
        const oddsB = parseOdds(b.oddsToWin)
        return oddsB !== oddsA ? oddsB - oddsA : a.playerName.localeCompare(b.playerName)
      }

      return 0
    })
    return result
  }, [field.entrants, query, statusFilter, sort, phase])

  // Status-aware fantasy filter chips. Every predicate reads only authoritative
  // fields. Chips whose underlying data does not exist in this field are hidden
  // entirely (structural availability); supported chips that currently match
  // nothing are disabled. Counts reflect the active search/status result.
  const chipDefs = useMemo(() => {
    type Def = {
      id: string
      label: string
      predicate: (e: FieldEntrant) => boolean
      available: boolean
    }
    const has = {
      dfsTier: dfsByPlayer.size > 0,
      valueBoard: valuePlayIds.size > 0,
      fantasy: topRatedIds.size > 0,
      ownership: field.entrants.some((e) => e.ownershipPercent != null),
      odds: field.entrants.some((e) => e.oddsToWin != null),
      liveDk: topLiveDkIds.size > 0,
      finalDk: topFinalDkIds.size > 0,
      value: topValueIds.size > 0,
      position: field.entrants.some((e) => e.position != null),
      cutFlag: field.entrants.some((e) => e.cutMade != null || e.status === 'CUT'),
    }

    let defs: Def[]
    if (phase === 'scheduled') {
      defs = [
        { id: 'all', label: 'All Players', predicate: () => true, available: true },
        {
          id: 'elite',
          label: 'Elite',
          predicate: (e) => {
            const t = dfsByPlayer.get(e.playerId)?.tier
            return t === 'A_PLUS' || t === 'A'
          },
          available: has.dfsTier,
        },
        { id: 'value', label: 'Value', predicate: (e) => valuePlayIds.has(e.playerId), available: has.valueBoard },
        { id: 'toprated', label: 'Top Rated', predicate: (e) => topRatedIds.has(e.playerId), available: has.fantasy },
        {
          id: 'chalk',
          label: 'Chalk',
          predicate: (e) => e.ownershipPercent != null && e.ownershipPercent >= 20,
          available: has.ownership,
        },
        {
          id: 'longshots',
          label: 'Longshots',
          predicate: (e) => {
            const n = parseOdds(e.oddsToWin)
            return n !== Number.MAX_VALUE && n >= 5000
          },
          available: has.odds,
        },
      ]
    } else if (phase === 'live') {
      defs = [
        { id: 'all', label: 'All Players', predicate: () => true, available: true },
        { id: 'topdk', label: 'Top DK', predicate: (e) => topLiveDkIds.has(e.playerId), available: has.liveDk },
        { id: 'leaders', label: 'Leaders', predicate: (e) => e.position != null && e.position <= 5, available: has.position },
        { id: 'top20', label: 'Top 20', predicate: (e) => e.position != null && e.position <= 20, available: has.position },
        { id: 'making', label: 'Making Cut', predicate: (e) => e.cutMade === true, available: has.cutFlag },
      ]
    } else {
      defs = [
        { id: 'all', label: 'All Players', predicate: () => true, available: true },
        {
          id: 'topfin',
          label: 'Top Finishers',
          predicate: (e) => e.position != null && e.position <= 10 && e.status !== 'CUT' && e.cutMade !== false,
          available: has.position,
        },
        { id: 'topdk', label: 'Top DK', predicate: (e) => topFinalDkIds.has(e.playerId), available: has.finalDk },
        { id: 'bestvalue', label: 'Best Value', predicate: (e) => topValueIds.has(e.playerId), available: has.value },
        {
          id: 'highowned',
          label: 'High Owned',
          predicate: (e) => e.ownershipPercent != null && e.ownershipPercent >= 20,
          available: has.ownership,
        },
        {
          id: 'lowowned',
          label: 'Low Owned',
          predicate: (e) => e.ownershipPercent != null && e.ownershipPercent < 10,
          available: has.ownership,
        },
        {
          id: 'missed',
          label: 'Missed Cut',
          predicate: (e) => e.cutMade === false || e.status === 'CUT',
          available: has.cutFlag,
        },
      ]
    }

    return defs
      .filter((d) => d.available)
      .map((d) => ({
        id: d.id,
        label: d.label,
        predicate: d.predicate,
        count: d.id === 'all' ? baseFiltered.length : baseFiltered.filter(d.predicate).length,
      }))
  }, [
    phase,
    baseFiltered,
    dfsByPlayer,
    valuePlayIds,
    topRatedIds,
    topLiveDkIds,
    topFinalDkIds,
    topValueIds,
    field.entrants,
  ])

  // Apply the active chip. Falls back to "all" if the chip has no matches.
  const filtered = useMemo(() => {
    const active = chipDefs.find((c) => c.id === chip)
    if (!active || active.id === 'all') return baseFiltered
    return baseFiltered.filter(active.predicate)
  }, [baseFiltered, chipDefs, chip])

  // Build position count map for tie detection
  const positionCountMap = useMemo(() => buildPositionCountMap(field.entrants), [field.entrants])

  // Field genuinely empty (nothing imported yet).
  if (field.size === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Field not imported yet"
        description="Once the field for this tournament is imported from your data source, the players will appear here."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <FieldAnalyticsSummary summary={field.analyticsSummary} />

      {/* Premium search + filter controls (visual redesign only).
          Layout: mobile stacks vertically (16px gap), tablet keeps search on
          its own row with filters in two equal columns, desktop is a single
          row where search grows and dropdowns stay fixed width (240px). */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
        {/* Search input */}
        <div className="group relative h-[60px] w-full overflow-hidden rounded-[22px] border border-[#2B3138] bg-[#111418] transition-all duration-[250ms] hover:-translate-y-px hover:border-white/20 hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] focus-within:-translate-y-px focus-within:border-[#34D17A] focus-within:shadow-[0_0_0_3px_rgba(52,209,122,0.15),0_10px_30px_rgba(16,185,129,0.12)] lg:flex-1">
          {/* Upper-right emerald glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/[0.05] opacity-0 blur-3xl transition-opacity duration-[250ms] group-hover:opacity-100 group-focus-within:opacity-100"
          />
          {/* Soft top highlight */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
          {/* Faint radial texture */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_90%_-10%,rgba(16,185,129,0.04),transparent_60%)]"
          />
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-6 top-1/2 size-[22px] -translate-y-1/2 text-muted-foreground transition-colors duration-[250ms] group-focus-within:text-emerald-400"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search players by name..."
            aria-label="Search players by name"
            className="relative h-full w-full bg-transparent pl-[3.75rem] pr-6 text-xl font-semibold text-white outline-none placeholder:font-normal placeholder:text-[#7D848D]"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:gap-5">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as FieldEntryStatus | 'ALL')}
          >
            <SelectTrigger aria-label="Filter by status" className={premiumTriggerClass}>
              <SelectValue>
                {() => statusOptions.find((o) => o.value === statusFilter)?.label ?? 'All statuses'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={premiumContentClass}>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className={premiumItemClass}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as SortKey)}
          >
            <SelectTrigger aria-label="Sort players" className={premiumTriggerClass}>
              <SelectValue>
                {() => sortOptions.find((o) => o.value === sort)?.label ?? ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={premiumContentClass}>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className={premiumItemClass}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-[11px] italic text-muted-foreground">
        Stats update automatically when official results and scoring are available.
      </p>

      {/* Status-aware fantasy filter chips */}
      <div
        className="flex flex-nowrap gap-2 overflow-x-auto pb-1 lg:flex-wrap"
        role="group"
        aria-label="Quick filters"
      >
        {chipDefs.map((c) => {
          const isActive = chip === c.id
          const isDisabled = c.id !== 'all' && c.count === 0
          return (
            <button
              key={c.id}
              type="button"
              disabled={isDisabled}
              aria-pressed={isActive}
              onClick={() => setChip(c.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-200',
                isActive
                  ? accent.chipActive
                  : 'border-white/[0.09] bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground',
                isDisabled && 'cursor-not-allowed opacity-40 hover:border-white/[0.09] hover:text-muted-foreground',
              )}
            >
              <span>{c.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] tabular-nums',
                  isActive ? accent.chipCount : 'bg-white/[0.06] text-muted-foreground/80',
                )}
              >
                {c.count}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No players match your filters"
          description="Try a different search term or clear the status filter."
        />
      ) : (
        <div className="w-full min-w-0 tournament-table-container" style={{ '--player-column-width': playerColumnWidth || '220px' } as React.CSSProperties}>
          {/* Premium table wrapper. Uses overflow-clip (NOT overflow-hidden) so
              the rounded corners clip the table's square edges WITHOUT creating
              a scroll container — this keeps the sticky header able to pin to
              the top of the page. */}
          <div className="relative overflow-clip rounded-[20px] border border-white/[0.09] bg-[#101419] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_12px_36px_rgba(0,0,0,0.20)]">
            {/* Decorative clip layer (rounded) — keeps glow/accent inside the
                card corners without creating a clipping context for the table */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]">
              {/* Top-right glow (phase accent) */}
              <div className={cn('absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl', accent.glow)} />
              {/* Top accent line (phase accent) */}
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
            {isPre ? (
              <colgroup>
                <col className="w-[48px]" />
                <col className="w-[calc(100vw-256px)] sm:w-[280px]" />
                <col className="w-[88px]" />
                <col className="w-[88px]" />
                <col className="w-[104px]" />
                <col className="w-[110px]" />
                <col className="w-[92px]" />
                <col className="w-[88px]" />
              </colgroup>
            ) : (
              <colgroup>
                <col className="w-[52px]" />
                <col className="w-[calc(100vw-256px)] sm:w-[300px]" />
                <col className="w-[92px]" />
                {phase === 'live' && <col className="w-[76px]" />}
                <col className="w-[82px]" />
                <col className="w-[82px]" />
                <col className="w-[82px]" />
                <col className="w-[82px]" />
                <col className="w-[126px]" />
                <col className="w-[80px]" />
                {phase === 'completed' && <col className="w-[88px]" />}
              </colgroup>
            )}
            <thead className="sticky top-0 sm:top-[94px] z-20 bg-[#101419] border-b border-white/[0.06]">
              {isPre ? (
                <tr>
                  <th className="px-1 sm:px-2 h-12 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">#</th>
                  <th className="px-2 sm:px-3 h-12 text-left text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Players ({field.size})
                  </th>
                  <th className="px-1 sm:px-2 h-12 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild><span className="cursor-help">CaddieIQ</span></TooltipTrigger>
                        <TooltipContent>CaddieIQ fantasy production rating (0–100)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="px-1 sm:px-2 h-12 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild><span className="cursor-help">Fit</span></TooltipTrigger>
                        <TooltipContent>Course Fit signal from the DFS Value Model (0–100)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="border-l border-white/[0.055] px-1 sm:px-2 h-12 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild><span className="cursor-help">Value</span></TooltipTrigger>
                        <TooltipContent>DFS Value tier — projected quality relative to salary</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="px-1 sm:px-3 h-12 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <div className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                      <DraftKingsMark className="h-3 w-auto" />
                      <span>Salary</span>
                    </div>
                  </th>
                  <th className="border-l border-white/[0.055] px-1 sm:px-3 h-12 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild><span className="cursor-help">Proj Own</span></TooltipTrigger>
                        <TooltipContent>Projected DFS ownership percentage</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  <th className="border-l border-white/[0.055] px-1 sm:px-3 h-12 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild><span className="cursor-help">Odds</span></TooltipTrigger>
                        <TooltipContent>Betting Odds to Win Tournament</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                </tr>
              ) : (
                <tr>
                  <th className="w-[52px] min-w-[52px] max-w-[52px] px-1 sm:px-2 h-12 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">POS</th>
                  <th 
                    className="w-[calc(100vw-256px)] min-w-[190px] max-w-[240px] sm:w-[300px] sm:min-w-[260px] sm:max-w-none px-2 sm:px-3 h-12 text-left text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    Players ({field.size})
                  </th>
                  <th className="w-[92px] min-w-[92px] max-w-[92px] px-1 sm:px-2 h-12 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">TOTAL</th>
                  {phase === 'live' && (
                    <th
                      title="Holes completed this round + current round score"
                      className="w-[76px] min-w-[76px] max-w-[76px] px-1 sm:px-2 h-12 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground"
                    >
                      THRU
                    </th>
                  )}
                  <th className="w-[82px] min-w-[82px] max-w-[82px] px-1 sm:px-3 h-12 text-center text-[11px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">R1</th>
                  <th className="w-[82px] min-w-[82px] max-w-[82px] px-1 sm:px-3 h-12 text-center text-[11px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">R2</th>
                  <th className="w-[82px] min-w-[82px] max-w-[82px] px-1 sm:px-3 h-12 text-center text-[11px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">R3</th>
                  <th className="w-[82px] min-w-[82px] max-w-[82px] px-1 sm:px-3 h-12 text-center text-[11px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">R4</th>
                  <th className="w-[126px] min-w-[126px] max-w-[126px] border-l border-white/[0.055] px-2 sm:px-4 h-12 text-center text-[11px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <div className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                      <DraftKingsMark className="h-3 w-auto" />
                      <span>DFS</span>
                    </div>
                  </th>
                  <th className="w-[80px] min-w-[80px] max-w-[80px] border-l border-white/[0.055] px-1 sm:px-3 h-12 text-center text-[11px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">ODDS</span>
                        </TooltipTrigger>
                        <TooltipContent>Betting Odds to Win Tournament</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                  {phase === 'completed' && (
                    <th className="w-[88px] min-w-[88px] max-w-[88px] border-l border-white/[0.055] px-1 sm:px-3 h-12 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild><span className="cursor-help">RESULT</span></TooltipTrigger>
                          <TooltipContent>Final placement (Won / T-position / MC / WD / DQ)</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                  )}
                </tr>
              )}
            </thead>
            <tbody>
              {filtered.map((entrant, index) => (
                    <tr
                      key={entrant.playerId}
                      onClick={(event) => {
                        const target = event.target as HTMLElement
                        // Prevent modal open if clicking on interactive elements
                        const interactiveElement = target.closest(
                          'button, a, input, select, textarea, [data-prevent-row-click]'
                        )
                        if (interactiveElement) {
                          return
                        }
                        // Open modal with selected player
                        setSelectedScorecardPlayer(entrant.playerId)
                        setIsScorecardModalOpen(true)
                      }}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer h-[72px] border-b border-white/[0.055] bg-transparent transition-colors duration-150 hover:bg-white/[0.025]"
                    >
                      {isPre ? (
                        <FantasyRowCells
                          entrant={entrant}
                          dfsResult={dfsByPlayer.get(entrant.playerId)}
                          rank={index + 1}
                        />
                      ) : (
                        <PlayerRowCells entrant={entrant} positionCountMap={positionCountMap} phase={phase} />
                      )}
                    </tr>
              ))}
            </tbody>
          </table>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground italic mt-2">
            {phase === 'scheduled'
              ? 'Fantasy ratings, course fit, and value reflect the DFS Value Model; blanks mean the platform holds no signal yet.'
              : phase === 'live'
                ? 'Live scoring, thru-hole, and DraftKings points update automatically as official results arrive.'
                : 'Final placements and DraftKings points are shown from official results.'}
          </div>
        </div>
      )}

      {/* Player Scorecard Modal */}
      <PlayerScorecardModal
        isOpen={isScorecardModalOpen}
        onOpenChange={setIsScorecardModalOpen}
        selectedPlayerId={selectedScorecardPlayer}
        onPlayerChange={setSelectedScorecardPlayer}
        players={field.entrants}
        tournamentId={tournamentId}
        visiblePlayers={filtered}
      />
    </div>
  )
}

/**
 * Server component that fetches and displays player round scorecard data.
 * This component is called inside a Suspense boundary for loading state management.
 */
async function ScorecardContent({
  playerRoundId,
  playerName,
  tournamentId,
}: {
  playerRoundId: string
  playerName: string
  tournamentId: string
}) {
  // Fetch the scorecard data (hole-by-hole scores)
  const scorecard = await getPlayerRoundScorecard(playerRoundId)

  if (!scorecard) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Hole-by-hole scorecard unavailable for this round.
      </div>
    )
  }

  return (
    <ExpandedPlayerScorecard data={scorecard} />
  )
}
