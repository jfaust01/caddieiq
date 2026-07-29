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
import { formatDateRange } from '@/features/tournaments/utils/format'
import { generateTournamentSlug } from '@/features/tournaments/utils/slug'
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
    <Link href={`/tournaments/${tournament.slug}`}>
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
          {/* Header with icon, tournament name, and date */}
          <div className="flex items-start gap-3 mb-4 min-w-0">
            {/* Circular chart icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full border border-cyan-500/60 bg-cyan-500/10 flex items-center justify-center">
              <BarChart3 className="size-4 text-cyan-400" aria-hidden />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-cyan-100 leading-tight mb-0.5" title={tournament.name}>
                {tournament.name}
              </h3>
              <p className="text-xs text-cyan-300/70 flex items-center gap-1">
                <Calendar className="size-3" aria-hidden />
                {formatDateRange(tournament.startDate, tournament.endDate)}
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

          {/* Winner and top scorer details */}
          <div className="space-y-3 text-xs">
            {winner && (
              <div className="flex items-start gap-2">
                <Trophy className="size-3.5 text-cyan-400 flex-shrink-0 mt-0.5" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-cyan-300/70 uppercase tracking-wide mb-0.5">Tournament Winner</p>
                  <p className="text-cyan-100 font-semibold truncate">{winner}</p>
                  {scoreDisplay && <p className="text-cyan-300/80 text-xs">{scoreDisplay}</p>}
                </div>
              </div>
            )}
            {topDkPlayer && (
              <div className="flex items-start gap-2">
                <Award className="size-3.5 text-cyan-400 flex-shrink-0 mt-0.5" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-cyan-300/70 uppercase tracking-wide mb-0.5">Top DK Score</p>
                  <p className="text-cyan-100 font-semibold truncate">{topDkPlayer}</p>
                  {topDkPoints && <p className="text-cyan-300/80 text-xs">{topDkPoints.toFixed(1)} pts</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
