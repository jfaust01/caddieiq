'use client'

import {
  TrendingUp,
  Users,
  Zap,
  Trophy,
  Flame,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { TournamentSummary } from '@/features/tournaments/types'
import { tourShortLabel } from '@/features/tournaments/utils/format'
import { cn } from '@/lib/utils'

interface TournamentCardLiveProps {
  tournament: TournamentSummary
}

/** Live tournament card - emphasizes real-time scoring and fantasy production. */
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
    <Link href={`/tournaments/${tournament.id}`}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg cursor-pointer',
          'bg-gradient-to-br from-slate-900/90 to-slate-950/70',
          'border border-amber-500/40 hover:border-amber-400/70',
          'hover:shadow-xl hover:shadow-amber-500/25 transition-all duration-300',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-amber-500 focus-within:ring-offset-2'
        )}
      >
      {/* Amber/orange top accent - live/active */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" aria-hidden />

      {/* Pulsing indicator dot */}
      <div className="absolute top-0.5 right-4 size-2 rounded-full bg-amber-400 animate-pulse" aria-hidden />

      {/* Inset highlight */}
      <div className="absolute inset-x-0 top-2 h-px bg-gradient-to-r from-amber-300/40 via-orange-200/20 to-transparent pointer-events-none" aria-hidden />

      {/* Content */}
      <div className="flex flex-col gap-0 p-6">
        {/* Header with badges */}
        <div className="flex items-center justify-between gap-3 mb-4 min-w-0">
          <h3
            className="text-sm font-bold uppercase tracking-wider text-amber-300 flex-1"
            title={tournament.name}
          >
            {tournament.name}
          </h3>
          <Badge
            className="h-6 px-2 text-xs font-semibold uppercase tracking-wide border-amber-400/70 bg-amber-500/30 text-amber-200 shrink-0 animate-pulse"
          >
            LIVE
          </Badge>
        </div>

        {/* Tournament metadata */}
        <p className="text-xs text-slate-400 mb-4 line-clamp-1">
          {tourShortLabel(tournament.tour?.type ?? null)} • Scoring Live
        </p>

        {/* Live stat boxes grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {/* Box 1: Leader */}
          <div className="border border-amber-500/40 rounded-lg p-3 bg-amber-500/10 text-center">
            <Trophy className="size-4 mx-auto mb-2 text-amber-400" aria-hidden />
            <p className="text-xl font-bold text-amber-300 leading-tight">
              {scoreDisplay || '—'}
            </p>
            <p className="text-xs text-amber-300/70 uppercase tracking-wide mt-1">Leader</p>
          </div>

          {/* Box 2: Top DK */}
          <div className="border border-amber-500/40 rounded-lg p-3 bg-amber-500/10 text-center">
            <Flame className="size-4 mx-auto mb-2 text-amber-400" aria-hidden />
            <p className="text-xl font-bold text-amber-300 leading-tight">
              {topDkPoints ? topDkPoints.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-amber-300/70 uppercase tracking-wide mt-1">Top DK</p>
          </div>

          {/* Box 3: Pace Indicator */}
          <div className="border border-amber-500/40 rounded-lg p-3 bg-amber-500/10 text-center">
            <TrendingUp className="size-4 mx-auto mb-2 text-amber-400" aria-hidden />
            <p className="text-xl font-bold text-amber-300 leading-tight">+18</p>
            <p className="text-xs text-amber-300/70 uppercase tracking-wide mt-1">Pace</p>
          </div>

          {/* Box 4: Scoring Status */}
          <div className="border border-amber-500/40 rounded-lg p-3 bg-amber-500/10 text-center">
            <Zap className="size-4 mx-auto mb-2 text-amber-400 animate-pulse" aria-hidden />
            <p className="text-lg font-bold text-amber-300 leading-tight">
              R2
            </p>
            <p className="text-xs text-amber-300/70 uppercase tracking-wide mt-1">Active</p>
          </div>
        </div>

        {/* Leader and top scorer info */}
        <div className="space-y-2 mb-4 text-xs text-slate-400">
          {currentLeader && (
            <p className="flex items-center gap-2 text-amber-300/80">
              <Trophy className="size-3.5 text-amber-400" />
              {currentLeader} leading
            </p>
          )}
          {topDkPlayer && (
            <p className="flex items-center gap-2 text-amber-300/80">
              <Flame className="size-3.5 text-amber-400" />
              {topDkPlayer} hot
            </p>
          )}
          <p className="flex items-center gap-2">
            <Clock className="size-3.5 text-amber-400" />
            Updates every 30-60 sec
          </p>
        </div>

        {/* Footer: divider and action */}
        <div className="border-t border-amber-500/15 pt-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-amber-400/50">
            Scoring
          </span>
          <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-amber-300 group-hover:text-amber-200">
            Follow Live →
          </div>
        </div>
      </div>
      </div>
    </Link>
  )
}
