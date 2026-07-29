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
import { generateTournamentNameSlug } from '@/features/tournaments/utils/slug'
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
    <Link href={`/tournaments/${generateTournamentNameSlug(tournament.name)}`}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg cursor-pointer',
          'bg-[#0f1f2e]',
          'border border-amber-500/30 hover:border-amber-400/50',
          'hover:shadow-xl hover:shadow-amber-500/15 transition-all duration-300',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-amber-400 focus-within:ring-offset-2',
          'h-80'
        )}
      >
      {/* Pulsing indicator dot */}
      <div className="absolute top-4 right-4 size-2 rounded-full bg-amber-400 animate-pulse" aria-hidden />

      {/* Content */}
      <div className="flex flex-col gap-0 p-6">
        {/* Header with icon, title, and description */}
        <div className="flex items-start gap-4 mb-6 min-w-0">
          {/* Circular icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full border border-amber-500/60 bg-amber-500/10 flex items-center justify-center">
            <Zap className="size-5 text-amber-400 animate-pulse" aria-hidden />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 mb-1">
              {tournament.name}
            </h3>
            <p className="text-xs text-slate-400">
              {tourShortLabel(tournament.tour?.type ?? null)} • Scoring Live
            </p>
          </div>
        </div>

        {/* Live stat boxes grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {/* Box 1: Leader */}
          <div className="border border-amber-500/20 rounded-lg p-3 bg-amber-500/5 text-center">
            <Trophy className="size-4 mx-auto mb-2 text-amber-400" aria-hidden />
            <p className="text-xl font-bold text-amber-100 leading-tight">
              {scoreDisplay || '—'}
            </p>
            <p className="text-xs text-amber-300/70 uppercase tracking-wide mt-1">Leader</p>
          </div>

          {/* Box 2: Top DK */}
          <div className="border border-amber-500/20 rounded-lg p-3 bg-amber-500/5 text-center">
            <Flame className="size-4 mx-auto mb-2 text-amber-400" aria-hidden />
            <p className="text-xl font-bold text-amber-100 leading-tight">
              {topDkPoints ? topDkPoints.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-amber-300/70 uppercase tracking-wide mt-1">Top DK</p>
          </div>

          {/* Box 3: Scoring Status */}
          <div className="border border-amber-500/20 rounded-lg p-3 bg-amber-500/5 text-center">
            <Zap className="size-4 mx-auto mb-2 text-amber-400 animate-pulse" aria-hidden />
            <p className="text-lg font-bold text-amber-100 leading-tight">
              R2
            </p>
            <p className="text-xs text-amber-300/70 uppercase tracking-wide mt-1">Active</p>
          </div>
        </div>

        {/* Leader and top scorer info */}
        <div className="space-y-2 text-xs text-slate-500">
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
          <p className="flex items-center gap-2 text-amber-300/80">
            <Clock className="size-3.5 text-amber-400" />
            Updates every 30-60 sec
          </p>
        </div>
      </div>
      </div>
    </Link>
  )
}
