'use client'

import { Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DraftKingsMark } from '../draftkings-mark'
import { PlayerFlag } from '../player-flag'

interface TournamentWinnerCardProps {
  tournamentWinner: {
    playerId: string
    playerName: string
    headshotUrl: string | null
    scoreToPar: number | null
    dkFantasyPoints: number | null
    dfsSalary: number | null
    countryCode?: string | null
  } | null
  /** Whether the tournament is completed; if false, shows "TBD" */
  isCompleted?: boolean
  className?: string
}

/**
 * Format score to par display.
 * Examples: -18 → -18, +2 → +2, 0 → E, null → —
 */
function formatScoreToPar(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return '—'
  }
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

/**
 * Get color class for score to par.
 * Negative = emerald, positive = red, even = white
 */
function getScoreColorClass(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return 'text-white'
  }
  if (score < 0) return 'text-emerald-400'
  if (score > 0) return 'text-red-400'
  return 'text-white'
}

/**
 * Format DK fantasy points for display.
 * Examples: 112.5 → 112.5, 112 → 112, null → —
 */
function formatDkPoints(points: number | null | undefined): string {
  if (points === null || points === undefined || !Number.isFinite(points)) {
    return '—'
  }
  const rounded = Math.round(points * 10) / 10
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
  return formatted
}

/**
 * Tournament Winner Card - premium hero card displaying the official tournament
 * champion with horizontal two-column layout (headshot + name/score).
 * Features emerald accent, subtle glow, and large typography for stats.
 */
export function TournamentWinnerCard({
  tournamentWinner,
  isCompleted = true,
  className,
}: TournamentWinnerCardProps) {
  const scoreToPar = formatScoreToPar(tournamentWinner?.scoreToPar)
  const scoreColorClass = getScoreColorClass(tournamentWinner?.scoreToPar)
  const dkPoints = formatDkPoints(tournamentWinner?.dkFantasyPoints)
  const initials = tournamentWinner?.playerName
    .split(' ')
    .slice(0, 2)
    .map(name => name[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'border border-white/[0.06]',
        'bg-gradient-to-br from-white/[0.05] to-white/[0.02]',
        'backdrop-blur-sm',
        'p-6 sm:p-7',
        'shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]',
        className
      )}
    >
      {/* Top accent line - emerald gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
      />

      {/* Subtle top-right glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/[0.06] blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-4">
        {/* Header with icon badge and divider */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.05]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10">
            <Award className="size-4 text-emerald-400" aria-hidden />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Tournament Winner
          </span>
        </div>

        {tournamentWinner ? (
          <>
            {/* Two-column layout: headshot + player info */}
            <div className="flex gap-4 sm:gap-6 items-start">
              {/* LEFT: Headshot */}
              <div className="shrink-0">
                {tournamentWinner.headshotUrl ? (
                  <img
                    src={tournamentWinner.headshotUrl}
                    alt={tournamentWinner.playerName}
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border border-white/[0.12] object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] text-sm sm:text-base font-semibold text-white shadow-lg">
                    {initials}
                  </div>
                )}
              </div>

              {/* RIGHT: Player info and stats */}
              <div className="flex flex-col gap-3.5 min-w-0 flex-1">
                {/* Player name with country flag */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white break-words leading-tight">
                    {tournamentWinner.playerName}
                  </h3>
                  {tournamentWinner.countryCode && (
                    <PlayerFlag
                      countryCode={tournamentWinner.countryCode}
                      className="h-6 sm:h-7 w-auto shrink-0"
                    />
                  )}
                </div>

                {/* Primary stats row: Score | DK Points */}
                <div className="flex items-center gap-3 pt-1">
                  {/* Winning score - large typography */}
                  <span className={cn(
                    'text-5xl sm:text-6xl font-black tabular-nums',
                    scoreColorClass
                  )}>
                    {scoreToPar}
                  </span>

                  {/* Thin vertical divider */}
                  <div className="h-10 w-px bg-white/[0.08]" />

                  {/* DraftKings points */}
                  <div className="flex items-center gap-1.5">
                    <DraftKingsMark className="h-5 sm:h-6 w-auto" />
                    <span className="text-3xl sm:text-4xl font-bold tabular-nums text-white">
                      {dkPoints}
                    </span>
                  </div>
                </div>

                {/* Final badge */}
                <div className="inline-flex w-fit items-center rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                    Final
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-8 sm:py-10">
            <div className="flex flex-col items-center gap-2">
              <div className="text-lg sm:text-xl font-semibold text-white">
                Winner determined after the final round
              </div>
              <div className="text-xs sm:text-sm text-white/60">
                This card updates automatically when results are available
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
