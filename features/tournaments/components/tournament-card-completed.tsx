'use client'

import {
  Trophy,
  Users,
  TrendingUp,
  ChevronRight,
  Calendar,
  Award,
  BarChart3,
} from 'lucide-react'
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

/** Completed tournament card - emphasizes final results and fantasy recap. */
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
        'bg-gradient-to-br from-slate-900/90 to-slate-950/70',
        'border border-blue-500/30 hover:border-blue-400/60',
        'hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2'
      )}
    >
      {/* Blue top accent - completed/results */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" aria-hidden />

      {/* Inset highlight */}
      <div className="absolute inset-x-0 top-2 h-px bg-gradient-to-r from-blue-300/30 via-blue-200/15 to-transparent pointer-events-none" aria-hidden />

      {/* Content */}
      <div className="flex flex-col gap-0 p-6">
        {/* Header with badges */}
        <div className="flex items-center justify-between gap-3 mb-4 min-w-0">
          <h3
            className="text-sm font-bold uppercase tracking-wider text-blue-300 flex-1"
            title={tournament.name}
          >
            {tournament.name}
          </h3>
          <Badge
            className="h-6 px-2 text-xs font-semibold uppercase tracking-wide border-blue-400/60 bg-blue-500/20 text-blue-300 shrink-0"
          >
            FINAL
          </Badge>
        </div>

        {/* Tournament metadata */}
        <p className="text-xs text-slate-400 mb-4 line-clamp-1">
          {tourShortLabel(tournament.tour?.type ?? null)} • {formatDateRange(tournament.startDate, tournament.endDate)}
        </p>

        {/* Results stat boxes grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {/* Box 1: Champion */}
          <div className="border border-blue-500/30 rounded-lg p-3 bg-blue-500/5 text-center">
            <Trophy className="size-4 mx-auto mb-2 text-blue-400" aria-hidden />
            <p className="text-xl font-bold text-blue-300 leading-tight">
              {scoreDisplay || '—'}
            </p>
            <p className="text-xs text-blue-300/70 uppercase tracking-wide mt-1">Winner</p>
          </div>

          {/* Box 2: Top DK */}
          <div className="border border-blue-500/30 rounded-lg p-3 bg-blue-500/5 text-center">
            <Award className="size-4 mx-auto mb-2 text-blue-400" aria-hidden />
            <p className="text-xl font-bold text-blue-300 leading-tight">
              {topDkPoints ? topDkPoints.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-blue-300/70 uppercase tracking-wide mt-1">Top DK</p>
          </div>

          {/* Box 3: Chalk Pick % */}
          <div className="border border-blue-500/30 rounded-lg p-3 bg-blue-500/5 text-center">
            <BarChart3 className="size-4 mx-auto mb-2 text-blue-400" aria-hidden />
            <p className="text-xl font-bold text-blue-300 leading-tight">
              28%
            </p>
            <p className="text-xs text-blue-300/70 uppercase tracking-wide mt-1">Chalk</p>
          </div>

          {/* Box 4: Final Payouts */}
          <div className="border border-blue-500/30 rounded-lg p-3 bg-blue-500/5 text-center">
            <TrendingUp className="size-4 mx-auto mb-2 text-blue-400" aria-hidden />
            <p className="text-lg font-bold text-blue-300 leading-tight">
              3
            </p>
            <p className="text-xs text-blue-300/70 uppercase tracking-wide mt-1">Players</p>
          </div>
        </div>

        {/* Winner and top scorer info */}
        <div className="space-y-2 mb-4 text-xs text-slate-400">
          {winner && (
            <p className="flex items-center gap-2 text-blue-300/80">
              <Trophy className="size-3.5 text-blue-400" />
              {winner} won
            </p>
          )}
          {topDkPlayer && (
            <p className="flex items-center gap-2 text-blue-300/80">
              <Award className="size-3.5 text-blue-400" />
              {topDkPlayer} played best
            </p>
          )}
          <p className="flex items-center gap-2">
            <Calendar className="size-3.5 text-blue-400" />
            All results final
          </p>
        </div>

        {/* Footer: divider and action */}
        <div className="border-t border-blue-500/15 pt-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-blue-400/50">
            Archive
          </span>
          <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-blue-300 group-hover:text-blue-200">
            View Recap →
          </div>
        </div>
      </div>
    </div>
  )
}
