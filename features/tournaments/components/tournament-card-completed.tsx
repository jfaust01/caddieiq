'use client'

import { Trophy, Users, TrendingUp, ChevronRight, Calendar } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { TournamentSummary } from '@/features/tournaments/types'
import {
  EMPTY_VALUE,
  formatDateRange,
  tourShortLabel,
} from '@/features/tournaments/utils/format'
import { cn } from '@/lib/utils'

interface TournamentCardCompletedProps {
  tournament: TournamentSummary
}

/** Completed tournament card - emphasizes results and fantasy performance. */
export function TournamentCardCompleted({ tournament }: TournamentCardCompletedProps) {
  const winner = tournament.tournamentWinner?.playerName
  const winnerScore = tournament.tournamentWinner?.scoreToPar
  const topDkPlayer = tournament.topDkScorer?.playerName
  const topDkPoints = tournament.topDkScorer?.dkFantasyPoints

  // Format winning score
  const scoreDisplay =
    winnerScore !== null && winnerScore !== undefined
      ? winnerScore > 0
        ? `+${winnerScore}`
        : winnerScore === 0
          ? 'E'
          : `${winnerScore}`
      : null

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg cursor-pointer',
        'bg-gradient-to-br from-slate-900/60 to-slate-950/80',
        'border border-sky-400/20 hover:border-sky-300/40',
        'hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-200',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 focus-within:ring-offset-background'
      )}
    >
      {/* Sky blue top accent - completed/historical */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400/50 via-sky-300/40 to-sky-400/20" aria-hidden />

      {/* Inset highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-300/15 via-sky-200/10 to-transparent pointer-events-none" aria-hidden />

      {/* Content */}
      <div className="flex flex-col gap-0 p-5">
        {/* Header: badges and chevron */}
        <div className="flex items-start justify-between gap-2 min-w-0 mb-3">
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className="h-6 px-2 text-xs font-semibold uppercase tracking-wide border-sky-500/40 bg-sky-500/10 text-sky-300"
            >
              {tourShortLabel(tournament.tour?.type ?? null)}
            </Badge>
            <Badge
              variant="outline"
              className="h-6 px-2 text-xs font-semibold uppercase tracking-wide border-sky-400/30 bg-sky-400/10 text-sky-300"
            >
              Final
            </Badge>
          </div>
          <ChevronRight className="size-4 shrink-0 text-sky-600/40 group-hover:text-sky-400/60 transition-colors mt-0.5" aria-hidden />
        </div>

        {/* Title */}
        <h3
          className="text-lg font-semibold leading-6 text-white mb-4 line-clamp-2 group-hover:text-sky-100 transition-colors"
          title={tournament.name}
        >
          <Link
            href={`/tournaments/${tournament.id}`}
            className="outline-none after:absolute after:inset-0 focus:outline-none"
          >
            {tournament.name}
          </Link>
        </h3>

        {/* Tournament recap metrics */}
        <div className="space-y-3 mb-4">
          {/* Winner highlight - main result */}
          {winner && scoreDisplay ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-sky-500/10 border border-sky-400/20">
              <div className="flex items-start gap-2 min-w-0">
                <Trophy className="mt-px size-4 shrink-0 text-sky-300" aria-hidden />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs text-sky-300/70 uppercase tracking-wide">Winner</span>
                  <span className="text-sm font-semibold text-sky-100 truncate">
                    {winner}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-sky-300">
                  {scoreDisplay}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <Trophy className="mt-px size-3.5 shrink-0 text-sky-400/60" aria-hidden />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-sky-300/70 uppercase tracking-wide">Result</span>
                <span className="text-sm font-medium text-white">
                  Results pending
                </span>
              </div>
            </div>
          )}

          {/* Top fantasy scorer - DK performance */}
          {topDkPlayer && topDkPoints ? (
            <div className="flex items-start gap-2">
              <Users className="mt-px size-3.5 shrink-0 text-sky-400/60" aria-hidden />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-sky-300/70 uppercase tracking-wide">Top Fantasy</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {topDkPlayer}
                  </span>
                  <span className="text-xs font-semibold text-sky-400 tabular-nums">
                    {topDkPoints} pts
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Played dates - historical context */}
          <div className="flex items-start gap-2">
            <Calendar className="mt-px size-3.5 shrink-0 text-sky-400/60" aria-hidden />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs text-sky-300/70 uppercase tracking-wide">Completed</span>
              <span className="text-sm font-medium text-white truncate">
                {formatDateRange(tournament.startDate, tournament.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: recap action */}
        <div className="border-t border-sky-500/10 pt-3 flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-sky-300/70">
            Complete
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-sky-300 group-hover:text-sky-200 transition-colors">
            View recap
            <ChevronRight className="size-3" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  )
}
