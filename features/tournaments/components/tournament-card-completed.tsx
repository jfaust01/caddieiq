'use client'

import {
  Trophy,
  Award,
  BarChart3,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

import type { TournamentSummary } from '@/features/tournaments/types'
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
    <Link href={`/tournaments/${tournament.id}`}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg cursor-pointer',
          'bg-[#0f1f2e]',
          'border border-cyan-500/30 hover:border-cyan-400/50',
          'hover:shadow-xl hover:shadow-cyan-500/15 transition-all duration-300',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-400 focus-within:ring-offset-2',
          'h-80'
        )}
      >
        {/* Content */}
        <div className="flex flex-col gap-0 p-6">
          {/* Header with icon, title, and description */}
          <div className="flex items-start gap-4 mb-6 min-w-0">
            {/* Circular chart icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full border border-cyan-500/60 bg-cyan-500/10 flex items-center justify-center">
              <BarChart3 className="size-5 text-cyan-400" aria-hidden />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-1">
                Tournament Recap
              </h3>
              <p className="text-xs text-slate-400">
                Final standings and DraftKings results — review what actually happened.
              </p>
            </div>
          </div>

          {/* Results stat boxes grid */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {/* Box 1: Champion */}
            <div className="border border-cyan-500/20 rounded-lg p-3 bg-cyan-500/5 text-center">
              <Trophy className="size-4 mx-auto mb-2 text-cyan-400" aria-hidden />
              <p className="text-xl font-bold text-cyan-100 leading-tight">
                {scoreDisplay || '—'}
              </p>
              <p className="text-xs text-cyan-300/70 uppercase tracking-wide mt-1">Winner</p>
            </div>

            {/* Box 2: Top DK */}
            <div className="border border-cyan-500/20 rounded-lg p-3 bg-cyan-500/5 text-center">
              <Award className="size-4 mx-auto mb-2 text-cyan-400" aria-hidden />
              <p className="text-xl font-bold text-cyan-100 leading-tight">
                {topDkPoints ? topDkPoints.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-cyan-300/70 uppercase tracking-wide mt-1">Top DK</p>
            </div>

            {/* Box 3: Chalk Pick % */}
            <div className="border border-cyan-500/20 rounded-lg p-3 bg-cyan-500/5 text-center">
              <BarChart3 className="size-4 mx-auto mb-2 text-cyan-400" aria-hidden />
              <p className="text-xl font-bold text-cyan-100 leading-tight">
                28%
              </p>
              <p className="text-xs text-cyan-300/70 uppercase tracking-wide mt-1">Chalk</p>
            </div>
          </div>

          {/* Winner and top scorer info */}
          <div className="space-y-2 text-xs text-slate-500">
            {winner && (
              <p className="flex items-center gap-2 text-cyan-300/80">
                <Trophy className="size-3.5 text-cyan-400" />
                {winner} won
              </p>
            )}
            {topDkPlayer && (
              <p className="flex items-center gap-2 text-cyan-300/80">
                <Award className="size-3.5 text-cyan-400" />
                {topDkPlayer} played best
              </p>
            )}
            <p className="flex items-center gap-2 text-cyan-300/80">
              <Calendar className="size-3.5 text-cyan-400" />
              All results final
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
