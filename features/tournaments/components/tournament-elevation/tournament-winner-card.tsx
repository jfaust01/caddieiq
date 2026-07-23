'use client'

import { Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TournamentWinnerCardProps {
  tournamentWinner: {
    playerId: string
    playerName: string
    headshotUrl: string | null
    scoreToPar: number | null
    dkFantasyPoints: number | null
    dfsSalary: number | null
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
 * Tournament Winner Card - displays the official tournament champion with
 * premium styling, including their score relative to par.
 */
export function TournamentWinnerCard({
  tournamentWinner,
  isCompleted = true,
  className,
}: TournamentWinnerCardProps) {
  const scoreToPar = formatScoreToPar(tournamentWinner?.scoreToPar)
  const dkPoints = formatDkPoints(tournamentWinner?.dkFantasyPoints)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[22px]',
        'border border-white/[0.10]',
        'bg-[#101419]',
        'p-6 md:p-7',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_12px_36px_rgba(0,0,0,0.22)]',
        className
      )}
    >
      {/* Top accent line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
      />

      {/* Top-right glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-500/[0.08] blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-6">
        {/* Header badge and eyebrow */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10">
            <Award className="size-6 text-emerald-400" aria-hidden />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Tournament Winner
          </span>
        </div>

        {tournamentWinner ? (
          <>
            {/* Player content */}
            <div className="flex items-center gap-6">
              {/* Headshot */}
              {tournamentWinner.headshotUrl ? (
                <img
                  src={tournamentWinner.headshotUrl}
                  alt={tournamentWinner.playerName}
                  className="h-24 w-24 shrink-0 rounded-full border border-white/[0.08] object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-lg font-semibold text-white">
                  {tournamentWinner.playerName
                    .split(' ')
                    .slice(0, 2)
                    .map(name => name[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}

              {/* Player info and score */}
              <div className="flex flex-col gap-5 min-w-0">
                {/* Player name */}
                <span className="truncate text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  {tournamentWinner.playerName}
                </span>

                {/* Primary score line */}
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-4xl font-semibold tabular-nums text-emerald-400">
                    {scoreToPar}
                  </span>
                </div>

                {/* Status badge */}
                <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/60">
                    Final
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="text-xl font-semibold text-muted-foreground">
                Winner determined after the final round
              </div>
              <div className="text-sm text-muted-foreground/70">
                This card updates automatically when official results are available.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
