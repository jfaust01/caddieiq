'use client'

import type { ComponentType, ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  CalendarClock,
  CloudSun,
  Flag,
  Gauge,
  Radio,
  Scissors,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'

import type {
  FieldEntrant,
  TournamentField,
  TournamentSummary,
} from '@/features/tournaments/types'
import type { AnalyticsBand } from '@/lib/analytics/types'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'
import { cn } from '@/lib/utils'
import {
  EMPTY_VALUE,
  formatDateRange,
  formatDfsSalary,
  formatDkTotal,
} from '@/features/tournaments/utils/format'
import { DraftKingsMark } from './draftkings-mark'

/* ------------------------------------------------------------------ */
/* Phase detection                                                     */
/* ------------------------------------------------------------------ */

type TournamentPhase = 'scheduled' | 'live' | 'completed'

/** Map the tournament lifecycle enum to a display phase. */
function getTournamentPhase(status: TournamentSummary['status']): TournamentPhase {
  if (!status) return 'scheduled'
  
  const normalized = status.toUpperCase().trim()
  
  // Completed states
  if (['COMPLETED', 'COMPLETE', 'FINAL', 'FINISHED', 'CLOSED', 'DONE'].includes(normalized)) {
    return 'completed'
  }
  
  // Live states
  if (['ACTIVE', 'LIVE', 'IN_PROGRESS', 'IN-PROGRESS', 'STARTED'].includes(normalized)) {
    return 'live'
  }
  
  // SCHEDULED and all other states render scheduled layout
  return 'scheduled'
}

/* ------------------------------------------------------------------ */
/* Accent system (one shared design, status-specific color)            */
/* ------------------------------------------------------------------ */

interface AccentTokens {
  /** Accent text color for labels, icons, and headline values. */
  text: string
  /** Icon-tile background tint. */
  tile: string
  /** Icon-tile border. */
  tileBorder: string
  /** Icon-tile glow shadow. */
  tileGlow: string
  /** Top edge accent line gradient middle stop. */
  line: string
  /** Top-right corner glow. */
  glow: string
}

const ACCENT: Record<TournamentPhase, AccentTokens> = {
  scheduled: {
    text: 'text-emerald-400',
    tile: 'bg-emerald-400/[0.06]',
    tileBorder: 'border-emerald-400/30',
    tileGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    line: 'via-emerald-500/50',
    glow: 'bg-emerald-500/[0.06]',
  },
  live: {
    text: 'text-yellow-400',
    tile: 'bg-yellow-400/[0.06]',
    tileBorder: 'border-yellow-400/30',
    tileGlow: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]',
    line: 'via-yellow-500/50',
    glow: 'bg-yellow-500/[0.06]',
  },
  completed: {
    text: 'text-sky-400',
    tile: 'bg-sky-400/[0.06]',
    tileBorder: 'border-sky-400/30',
    tileGlow: 'shadow-[0_0_20px_rgba(56,189,248,0.15)]',
    line: 'via-sky-500/50',
    glow: 'bg-sky-500/[0.06]',
  },
}

const BAND_LABEL: Record<AnalyticsBand, string> = {
  ELITE: 'Elite',
  STRONG: 'Strong',
  SOLID: 'Solid',
  AVERAGE: 'Average',
  DEVELOPING: 'Developing',
}

/* ------------------------------------------------------------------ */
/* Shared presentational pieces                                        */
/* ------------------------------------------------------------------ */

interface StatusIntroProps {
  phase: TournamentPhase
  icon: ComponentType<{ className?: string }>
  title: string
  statusLine: string
  description: string
}

/** Left intro column: status icon, title, status/date line, description. */
function TournamentStatusIntro({
  phase,
  icon: Icon,
  title,
  statusLine,
  description,
}: StatusIntroProps) {
  const accent = ACCENT[phase]
  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
          accent.tile,
          accent.tileBorder,
          accent.tileGlow,
        )}
      >
        <Icon className={cn('size-6', accent.text)} aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <h3
          className={cn(
            'text-sm font-bold uppercase tracking-[0.16em]',
            accent.text,
          )}
        >
          {title}
        </h3>
        <p className="text-sm font-medium text-white/70">{statusLine}</p>
      </div>
      <p className="text-sm leading-relaxed text-white/50 text-pretty">
        {description}
      </p>
    </div>
  )
}

interface InsightCardProps {
  icon: ReactNode
  label: string
  primaryValue: ReactNode
  secondaryValue?: ReactNode
  supportingText?: ReactNode
  accent: TournamentPhase
  /** When true, render the primary value in the accent color instead of white. */
  accentPrimary?: boolean
}

/** One premium intelligence card. The single shared shell for all phases. */
function TournamentInsightCard({
  icon,
  label,
  primaryValue,
  secondaryValue,
  supportingText,
  accent,
  accentPrimary = false,
}: InsightCardProps) {
  const tokens = ACCENT[accent]
  return (
    <div
      className={cn(
        'group relative flex h-full min-w-0 flex-col items-center overflow-hidden rounded-[20px] p-5 text-center',
        'border border-white/[0.08] bg-[#0d1318]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_12px_30px_rgba(0,0,0,0.18)]',
        'transition-[transform,border-color,box-shadow] duration-300 ease-out',
        'hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_40px_rgba(0,0,0,0.28)]',
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
      {/* Top-right corner glow */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl',
          tokens.glow,
        )}
      />

      <div className="relative z-10 flex w-full flex-col items-center gap-3">
        {/* Icon tile */}
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-xl border',
            tokens.tile,
            tokens.tileBorder,
            tokens.tileGlow,
          )}
        >
          {icon}
        </div>

        {/* Label */}
        <span
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.12em]',
            tokens.text,
          )}
        >
          {label}
        </span>

        {/* Primary value */}
        <span
          className={cn(
            'text-3xl font-bold leading-tight tabular-nums text-balance',
            accentPrimary ? tokens.text : 'text-white',
          )}
        >
          {primaryValue}
        </span>

        {/* Supporting lines */}
        {secondaryValue ? (
          <span className="text-sm font-medium text-white/70 text-balance">
            {secondaryValue}
          </span>
        ) : null}
        {supportingText ? (
          <span className="line-clamp-2 text-xs leading-relaxed text-white/45 text-pretty">
            {supportingText}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Data derivation helpers (authoritative data only)                   */
/* ------------------------------------------------------------------ */

/** Format a score-to-par: 0 → "E", -12 → "-12", +3 → "+3", null → em-dash. */
function formatToPar(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY_VALUE
  }
  if (value === 0) return 'E'
  return value > 0 ? `+${value}` : `${value}`
}

/** Entrants that are actively/finally scored (not withdrawn or disqualified). */
function scoredEntrants(entrants: FieldEntrant[]): FieldEntrant[] {
  return entrants.filter(
    (e) =>
      e.total !== null &&
      !e.withdrawn &&
      e.status !== 'WITHDRAWN' &&
      e.status !== 'DISQUALIFIED',
  )
}

/** The leaderboard leader: position 1 when set, else the lowest total to par. */
function getLeader(entrants: FieldEntrant[]): FieldEntrant | null {
  const active = scoredEntrants(entrants)
  if (active.length === 0) return null
  const byPosition = active.find((e) => e.position === 1)
  if (byPosition) return byPosition
  return active.reduce((best, e) =>
    (e.total as number) < (best.total as number) ? e : best,
  )
}

/** Margin of victory in strokes, from the top two final totals. */
function getMarginOfVictory(entrants: FieldEntrant[]): number | null {
  const active = scoredEntrants(entrants).sort(
    (a, b) => (a.total as number) - (b.total as number),
  )
  if (active.length < 2) return null
  const margin = (active[1].total as number) - (active[0].total as number)
  return margin > 0 ? margin : null
}

/** The current round, derived from which round columns are populated. */
function getCurrentRound(entrants: FieldEntrant[]): number | null {
  if (entrants.some((e) => e.round4 !== null)) return 4
  if (entrants.some((e) => e.round3 !== null)) return 3
  if (entrants.some((e) => e.round2 !== null)) return 2
  if (entrants.some((e) => e.round1 !== null)) return 1
  return null
}

/** Highest final DraftKings score in the field, with its player. */
function getTopDkEntrant(entrants: FieldEntrant[]): FieldEntrant | null {
  const withDk = entrants.filter(
    (e) => e.dkFantasyPoints !== null && Number.isFinite(e.dkFantasyPoints),
  )
  if (withDk.length === 0) return null
  return withDk.reduce((best, e) =>
    (e.dkFantasyPoints as number) > (best.dkFantasyPoints as number) ? e : best,
  )
}

/** Best DK points per $1K of salary — a defined, authoritative value ratio. */
function getBestValue(
  entrants: FieldEntrant[],
): { entrant: FieldEntrant; ratio: number } | null {
  let best: { entrant: FieldEntrant; ratio: number } | null = null
  for (const e of entrants) {
    if (
      e.dkFantasyPoints === null ||
      !Number.isFinite(e.dkFantasyPoints) ||
      e.dkFantasyPoints <= 0 ||
      e.dfsSalary === null ||
      !Number.isFinite(e.dfsSalary) ||
      e.dfsSalary <= 0
    ) {
      continue
    }
    const ratio = e.dkFantasyPoints / (e.dfsSalary / 1000)
    if (!best || ratio > best.ratio) best = { entrant: e, ratio }
  }
  return best
}

/** The most-drafted player, by projected DFS ownership. */
function getHighestDrafted(entrants: FieldEntrant[]): FieldEntrant | null {
  const withOwnership = entrants.filter(
    (e) => e.ownershipPercent !== null && Number.isFinite(e.ownershipPercent),
  )
  if (withOwnership.length === 0) return null
  return withOwnership.reduce((best, e) =>
    (e.ownershipPercent as number) > (best.ownershipPercent as number)
      ? e
      : best,
  )
}

const PLAYABILITY_RISK: Record<string, string> = {
  excellent: 'Low',
  good: 'Moderate',
  marginal: 'High',
  poor: 'Severe',
}

const WIND_RISK: Record<string, string> = {
  calm: 'Low',
  moderate: 'Moderate',
  strong: 'High',
  extreme: 'Severe',
}

/**
 * Derive a weather-risk read from the authoritative severity bands. Returns
 * null when no usable forecast exists, so the card shows an honest empty state.
 */
function getWeatherRisk(
  weather: WeatherIntelligence | null | undefined,
): { level: string; supporting: string | null } | null {
  if (!weather || weather.status !== 'available' || !weather.overall) return null
  const o = weather.overall
  let level: string | undefined
  if (o.playability) level = PLAYABILITY_RISK[o.playability]
  else if (o.windSeverity) level = WIND_RISK[o.windSeverity]
  if (!level) return null

  const parts: string[] = []
  if (o.avgWindMph !== null && Number.isFinite(o.avgWindMph)) {
    const avg = Math.round(o.avgWindMph)
    const gust =
      o.maxGustMph !== null && Number.isFinite(o.maxGustMph)
        ? Math.round(o.maxGustMph)
        : null
    parts.push(gust && gust > avg ? `${avg}\u2013${gust} mph wind` : `${avg} mph wind`)
  }
  if (
    o.maxRainProbability !== null &&
    Number.isFinite(o.maxRainProbability) &&
    o.maxRainProbability >= 0.3
  ) {
    parts.push(`${Math.round(o.maxRainProbability * 100)}% rain`)
  }
  return { level, supporting: parts.length > 0 ? parts.join(' \u00b7 ') : null }
}

/* ------------------------------------------------------------------ */
/* Card builders per phase                                             */
/* ------------------------------------------------------------------ */

function buildScheduledCards(
  tournament: TournamentSummary,
  field: TournamentField,
  weather: WeatherIntelligence | null | undefined,
): InsightCardProps[] {
  const summary = field.analyticsSummary
  const iconClass = 'size-6 ' + ACCENT.scheduled.text

  // A. Field strength
  const strengthValue =
    summary.averageRating !== null ? Math.round(summary.averageRating) : null
  const coverageNote =
    summary.ratedPlayers === 0
      ? 'Field analytics not available yet'
      : summary.ratedPlayers < summary.totalPlayers
        ? `${summary.ratedPlayers} of ${summary.totalPlayers} entrants rated`
        : `All ${summary.totalPlayers} entrants rated`

  // B. Cut rule — only authoritative facts (field size + rounds-before-cut).
  const cutSupport =
    tournament.cutAfterRounds !== null
      ? `Cut after ${tournament.cutAfterRounds} rounds`
      : 'Cut rule not published'

  // D. Weather risk
  const risk = getWeatherRisk(weather)

  return [
    {
      accent: 'scheduled',
      icon: <Trophy className={iconClass} aria-hidden />,
      label: 'Field Strength',
      primaryValue: strengthValue ?? EMPTY_VALUE,
      secondaryValue: summary.averageBand ? BAND_LABEL[summary.averageBand] : undefined,
      supportingText: coverageNote,
      accentPrimary: true,
    },
    {
      accent: 'scheduled',
      icon: <Scissors className={iconClass} aria-hidden />,
      label: 'Cut Rule',
      primaryValue: field.size > 0 ? field.size : EMPTY_VALUE,
      secondaryValue: field.size > 0 ? 'Players in field' : undefined,
      supportingText: cutSupport,
    },
    {
      accent: 'scheduled',
      icon: <Gauge className={iconClass} aria-hidden />,
      label: 'Scoring Environment',
      primaryValue: EMPTY_VALUE,
      supportingText: 'Projected winning score model not available yet',
    },
    {
      accent: 'scheduled',
      icon: <CloudSun className={iconClass} aria-hidden />,
      label: 'Weather Risk',
      primaryValue: risk ? risk.level : EMPTY_VALUE,
      supportingText: risk
        ? risk.supporting ?? 'Forecast conditions loaded'
        : (weather?.statusReport?.label ?? 'Forecast not yet available'),
      accentPrimary: Boolean(risk),
    },
  ]
}

function buildLiveCards(field: TournamentField): InsightCardProps[] {
  const iconClass = 'size-6 ' + ACCENT.live.text
  const scored = scoredEntrants(field.entrants)
  
  // A. Current Leader
  const leader = getLeader(field.entrants)
  const leaderThru = leader?.thruHole
    ? leader.thruHole.toUpperCase() === 'F'
      ? 'Finished'
      : `Thru ${leader.thruHole}`
    : undefined

  // B. Players Remaining (active in the tournament)
  const playersRemaining = field.entrants.filter(
    (e) => e.status !== 'WITHDRAWN' && e.status !== 'DISQUALIFIED' && !e.withdrawn
  ).length

  // C. Top DK Scorer So Far
  const topDkLive = getTopDkEntrant(field.entrants)

  // D. Average Round Score (of scored entrants, round that's in progress/completed)
  const scoredWithScores = scored.filter((e) => e.total !== null && Number.isFinite(e.total))
  const avgScore = scoredWithScores.length > 0
    ? (scoredWithScores.reduce((sum, e) => sum + (e.total as number), 0) / scoredWithScores.length).toFixed(1)
    : null

  return [
    {
      accent: 'live',
      icon: <Flag className={iconClass} aria-hidden />,
      label: 'Current Leader',
      primaryValue: leader ? formatToPar(leader.total) : EMPTY_VALUE,
      secondaryValue: leader?.playerName,
      supportingText: leader ? leaderThru : 'Live leaderboard not available yet',
      accentPrimary: Boolean(leader),
    },
    {
      accent: 'live',
      icon: <Users className={iconClass} aria-hidden />,
      label: 'Players Remaining',
      primaryValue: playersRemaining > 0 ? playersRemaining : EMPTY_VALUE,
      secondaryValue: playersRemaining > 0 ? 'In tournament' : undefined,
      supportingText: playersRemaining > 0 
        ? `${field.size - playersRemaining} withdrawn/DQ`
        : 'No active players',
      accentPrimary: Boolean(playersRemaining),
    },
    {
      accent: 'live',
      icon: <DraftKingsMark className="h-6 w-auto" />,
      label: 'Top DK Score',
      primaryValue: topDkLive?.dkFantasyPoints !== null ? formatDkTotal(topDkLive.dkFantasyPoints) : EMPTY_VALUE,
      secondaryValue: topDkLive?.playerName,
      supportingText: topDkLive
        ? `${topDkLive.thruHole ? `Thru ${topDkLive.thruHole}` : 'In progress'}`
        : 'DraftKings data not available yet',
      accentPrimary: topDkLive?.dkFantasyPoints !== null,
    },
    {
      accent: 'live',
      icon: <Target className={iconClass} aria-hidden />,
      label: 'Avg Score (Thru)',
      primaryValue: avgScore !== null ? avgScore : EMPTY_VALUE,
      secondaryValue: avgScore !== null ? `${scoredWithScores.length} players` : undefined,
      supportingText: avgScore !== null
        ? `Field average through current round`
        : 'No live scoring data yet',
      accentPrimary: Boolean(avgScore),
    },
  ]
}

function buildCompletedCards(
  tournament: TournamentSummary,
  field: TournamentField,
): InsightCardProps[] {
  const iconClass = 'size-6 ' + ACCENT.completed.text

  // A. Winner — prefer authoritative provider winner, else first-place entrant.
  const winnerEntrant = getLeader(field.entrants)
  const winnerName =
    tournament.tournamentWinner?.playerName ?? winnerEntrant?.playerName ?? null
  const winnerScore =
    tournament.tournamentWinner?.scoreToPar ?? winnerEntrant?.total ?? null
  const winnerStrokes = winnerEntrant?.totalStrokes ?? null
  const margin = getMarginOfVictory(field.entrants)

  // B. Top DK score
  const topDk = getTopDkEntrant(field.entrants)
  const topDkPoints = topDk?.dkFantasyPoints ?? null
  const topDkSupport = topDk
    ? [
        topDk.dfsSalary !== null ? formatDfsSalary(topDk.dfsSalary) : null,
        topDk.ownershipPercent !== null
          ? `${Math.round(topDk.ownershipPercent)}% Drafted`
          : null,
      ]
        .filter(Boolean)
        .join('  |  ')
    : ''

  // C. Best value
  const bestValue = getBestValue(field.entrants)

  // D. Highest drafted (authoritative replacement for "Biggest Bust")
  const highestDrafted = getHighestDrafted(field.entrants)

  // Build the winning score supporting text with total strokes and margin
  const winningScoreParts: string[] = []
  if (winnerName) {
    winningScoreParts.push(winnerName)
  }
  if (winnerStrokes !== null && Number.isFinite(winnerStrokes)) {
    winningScoreParts.push(`${winnerStrokes} total`)
  }
  const winningScoreSupport = winningScoreParts.length > 0
    ? winningScoreParts.join(' • ')
    : (winnerName ? '' : 'Winner not available yet')
  
  const winningScoreSuffix = margin
    ? ` • Won by ${margin} Shot${margin > 1 ? 's' : ''}`
    : ''

  return [
    {
      accent: 'completed',
      icon: <Trophy className={iconClass} aria-hidden />,
      label: 'Winning Score',
      primaryValue: winnerScore !== null ? formatToPar(winnerScore) : EMPTY_VALUE,
      secondaryValue: winnerName ? winnerName : undefined,
      supportingText: winningScoreParts.length > 0 
        ? winningScoreSupport + winningScoreSuffix
        : winnerName 
          ? (margin ? `Won by ${margin} Shot${margin > 1 ? 's' : ''}` : 'Final standings')
          : 'Winner not available yet',
      accentPrimary: true,
    },
    {
      accent: 'completed',
      icon: <DraftKingsMark className="h-6 w-auto" />,
      label: 'Top DK Score',
      primaryValue: topDkPoints !== null ? formatDkTotal(topDkPoints) : EMPTY_VALUE,
      secondaryValue: topDk?.playerName,
      supportingText: topDk
        ? topDkSupport || 'Final DraftKings result'
        : 'DraftKings scoring not available yet',
      accentPrimary: topDkPoints !== null,
    },
    {
      accent: 'completed',
      icon: <TrendingUp className={iconClass} aria-hidden />,
      label: 'Best Value',
      primaryValue: bestValue ? bestValue.ratio.toFixed(1) : EMPTY_VALUE,
      secondaryValue: bestValue?.entrant.playerName,
      supportingText: bestValue
        ? `${
            bestValue.entrant.dfsSalary !== null
              ? formatDfsSalary(bestValue.entrant.dfsSalary)
              : EMPTY_VALUE
          }  |  ${bestValue.ratio.toFixed(1)} pts per $1K`
        : 'Salary or DFS data not available yet',
      accentPrimary: Boolean(bestValue),
    },
    {
      accent: 'completed',
      icon: <Users className={iconClass} aria-hidden />,
      label: 'Highest Drafted',
      primaryValue: highestDrafted?.playerName ?? EMPTY_VALUE,
      secondaryValue:
        highestDrafted && highestDrafted.ownershipPercent !== null
          ? `${Math.round(highestDrafted.ownershipPercent)}% Drafted`
          : undefined,
      supportingText: highestDrafted
        ? highestDrafted.dfsSalary !== null
          ? formatDfsSalary(highestDrafted.dfsSalary)
          : 'Final field ownership'
        : 'Ownership data not available yet',
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

interface TournamentIntelligenceProps {
  tournament: TournamentSummary
  field: TournamentField
  weather?: WeatherIntelligence | null
}

const INTRO: Record<
  TournamentPhase,
  { icon: ComponentType<{ className?: string }>; title: string; description: string }
> = {
  scheduled: {
    icon: CalendarClock,
    title: 'Scheduled Tournament',
    description:
      'Pre-tournament insights to help you build the optimal lineup and gain an edge before lock.',
  },
  live: {
    icon: Radio,
    title: 'Live Tournament',
    description:
      'Real-time updates and fantasy scoring insights to help you track your lineups and opponents.',
  },
  completed: {
    icon: Trophy,
    title: 'Completed Tournament',
    description:
      'Final results and fantasy performance breakdowns to help you review, learn, and improve.',
  },
}

/**
 * Status-adaptive fantasy-golf intelligence. The section changes meaning and
 * accent color by tournament phase — pre-tournament strategy (emerald), live
 * tracking (gold), or post-event review (blue) — over one shared premium card
 * system. Every value is derived from authoritative data (field analytics, the
 * live leaderboard, DraftKings results, ownership, and forecast severity);
 * cards without real data show an honest empty state instead of a fabricated
 * number.
 */
export function TournamentIntelligence({
  tournament,
  field,
}: TournamentIntelligenceProps) {
  const phase = getTournamentPhase(tournament.status)
  const intro = INTRO[phase]

  let statusLine: string
  let cards: InsightCardProps[]

  if (phase === 'scheduled') {
    const starts = formatDateRange(tournament.startDate, null)
    statusLine = starts === EMPTY_VALUE ? 'Upcoming' : `Starts ${starts}`
    cards = buildScheduledCards(tournament, field, weather)
  } else if (phase === 'live') {
    const round = getCurrentRound(field.entrants)
    statusLine = round ? `Round ${round} \u2022 In Progress` : 'In Progress'
    cards = buildLiveCards(field)
  } else {
    const completed = formatDateRange(tournament.endDate, null)
    statusLine =
      completed === EMPTY_VALUE ? 'Final results' : `Completed ${completed}`
    cards = buildCompletedCards(tournament, field)
  }

  const prefersReducedMotion = useReducedMotion()

  // Staggered fade/rise for the card grid. When the user prefers reduced
  // motion, both variants collapse to the final state so nothing animates.
  const container: Variants = {
    hidden: {},
    show: {
      transition: prefersReducedMotion
        ? undefined
        : { staggerChildren: 0.07, delayChildren: 0.04 },
    },
  }
  const item: Variants = prefersReducedMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
      }

  return (
    <section className="flex flex-col gap-4" aria-label="Tournament intelligence">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`intro-${phase}`}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <TournamentStatusIntro
              phase={phase}
              icon={intro.icon}
              title={intro.title}
              statusLine={statusLine}
              description={intro.description}
            />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`cards-${phase}`}
            className={cn(
              'grid gap-4',
              phase === 'completed'
                ? 'md:grid-cols-2 xl:grid-cols-4'
                : 'md:grid-cols-2 xl:grid-cols-4'
            )}
            variants={container}
            initial="hidden"
            animate="show"
          >
            {cards.map((card, idx) => (
              <motion.div 
                key={card.label} 
                variants={item} 
                className={cn(
                  'min-w-0',
                  phase === 'completed' && idx === 0 && 'md:col-span-2 xl:col-span-2'
                )}
              >
                <TournamentInsightCard {...card} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-[11px] italic text-white/40 text-pretty">
        Live data and results update automatically as official scoring becomes
        available. Drafted percentages update after lineups lock.
      </p>
    </section>
  )
}
