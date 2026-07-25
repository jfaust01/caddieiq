'use client'

import { TrendingUp, Users, Zap, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { TournamentSummary } from '@/features/tournaments/types'
import { tourShortLabel } from '@/features/tournaments/utils/format'
import { cn } from '@/lib/utils'

interface TournamentCardLiveProps {
  tournament: TournamentSummary
}

/** Live tournament card - emphasizes real-time scoring and leaderboard action. */
export function TournamentCardLive({ tournament }: TournamentCardLiveProps) {
  const currentLeader = tournament.tournamentWinner?.playerName
  const currentLeaderScore = tournament.tournamentWinner?.scoreToPar
  const topDkPlayer = tournament.topDkScorer?.playerName
  const topDkPoints = tournament.topDkScorer?.dkFantasyPoints

  // Format score display
  const scoreDisplay =
    currentLeaderScore !== null && currentLeaderScore !== undefined
      ? currentLeaderScore > 0
        ? `+${currentLeaderScore}`
        : currentLeaderScore === 0
          ? 'E'
          : `${currentLeaderScore}`
      : null

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg cursor-pointer',
        'bg-gradient-to-br from-emerald-900/40 to-slate-950/60',
        'border border-emerald-400/30 hover:border-emerald-300/60',
        'hover:shadow-lg hover:shadow-emerald-500/15 transition-all duration-200',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:ring-offset-background'
      )}
    >
      {/* Emerald top accent - live/active */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300/60" aria-hidden />

      {/* Pulsing indicator dot */}
      <div className="absolute top-0 right-4 mt-1 size-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />

      {/* Inset highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-300/30 via-emerald-200/15 to-transparent pointer-events-none" aria-hidden />

      {/* Content */}
      <div className="flex flex-col gap-0 p-5">
        {/* Header: badges and chevron */}
        <div className="flex items-start justify-between gap-2 min-w-0 mb-3">
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className="h-6 px-2 text-xs font-semibold uppercase tracking-wide border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            >
              {tourShortLabel(tournament.tour?.type ?? null)}
            </Badge>
            <Badge
              variant="outline"
              className="h-6 px-2 text-xs font-semibold uppercase tracking-wide border-emerald-400/50 bg-emerald-400/15 text-emerald-200 animate-pulse"
            >
              Live
            </Badge>
          </div>
          <ChevronRight className="size-4 shrink-0 text-emerald-600/40 group-hover:text-emerald-400/60 transition-colors mt-0.5" aria-hidden />
        </div>

        {/* Title */}
        <h3
          className="text-lg font-semibold leading-6 text-white mb-4 line-clamp-2 group-hover:text-emerald-100 transition-colors"
          title={tournament.name}
        >
          <Link
            href={`/tournaments/${tournament.id}`}
            className="outline-none after:absolute after:inset-0 focus:outline-none"
          >
            {tournament.name}
          </Link>
        </h3>

        {/* Live scoring metrics */}
        <div className="space-y-3 mb-4">
          {/* Current leader - key fantasy factor */}
          {currentLeader && scoreDisplay ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
              <div className="flex items-start gap-2 min-w-0">
                <TrendingUp className="mt-px size-4 shrink-0 text-emerald-400" aria-hidden />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs text-emerald-300/70 uppercase tracking-wide">Leader</span>
                  <span className="text-sm font-semibold text-emerald-100 truncate">
                    {currentLeader}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-emerald-300">
                  {scoreDisplay}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-emerald-300/60 italic">
              Loading leaderboard...
            </div>
          )}

          {/* Top DK scorer - fantasy production */}
          {topDkPlayer && topDkPoints ? (
            <div className="flex items-start gap-2">
              <Users className="mt-px size-3.5 shrink-0 text-emerald-400/60" aria-hidden />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-emerald-300/70 uppercase tracking-wide">Top Fantasy</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {topDkPlayer}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 tabular-nums">
                    {topDkPoints} pts
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-xs text-emerald-300/70">
            <Zap className="size-3 shrink-0 text-emerald-500" aria-hidden />
            <span className="font-medium uppercase tracking-wide">Scoring in progress</span>
          </div>
        </div>

        {/* Footer: live action */}
        <div className="border-t border-emerald-500/10 pt-3 flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-emerald-300/70">
            Live
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-300 group-hover:text-emerald-200 transition-colors">
            Follow scoring
            <ChevronRight className="size-3" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  )
}
