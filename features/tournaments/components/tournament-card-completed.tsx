'use client'

import { BarChart3, Trophy, Award } from 'lucide-react'
import Link from 'next/link'

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

/** Completed tournament card - recap style with narrative results. */
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
          'bg-gradient-to-br from-slate-900/90 to-slate-950/70',
          'border border-cyan-500/30 hover:border-cyan-400/60',
          'hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-400 focus-within:ring-offset-2',
          'flex flex-col'
        )}
      >
        {/* Header: Icon + Title + Description */}
        <div className="flex items-start gap-4 p-6 pb-4">
          {/* Circular chart icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full border border-cyan-500/60 bg-cyan-500/10 flex items-center justify-center">
            <BarChart3 className="size-5 text-cyan-400" aria-hidden />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-1">
              Tournament Recap
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              Final standings and DraftKings results — review what actually happened.
            </p>
          </div>
        </div>

        {/* Two-column layout: Tournament Story | Top DK Scores */}
        <div className="flex-1 px-6 pb-6 grid grid-cols-2 gap-6">
          {/* Left column: Tournament Story */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Tournament Story
            </p>
            <p className="text-xs text-slate-500 mb-2">
              What decided the tournament and the fantasy results
            </p>

            {/* Champion section */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-cyan-400" aria-hidden />
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">
                  Champion
                </p>
              </div>
              {winner && scoreDisplay ? (
                <p className="text-sm text-white ml-3">
                  {winner} claimed the title at {scoreDisplay}.
                </p>
              ) : (
                <p className="text-sm text-slate-500 ml-3">
                  Tournament results pending
                </p>
              )}
            </div>
          </div>

          {/* Right column: Top DraftKings Scores */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Top DraftKings Scores
            </p>
            <p className="text-xs text-slate-500 mb-2">
              Best final DK fantasy performances
            </p>

            {/* Top DK scorer */}
            {topDkPlayer && topDkPoints ? (
              <div className="text-sm text-white">
                <p>
                  <span className="font-semibold">{topDkPlayer}</span> led fantasy with <span className="font-semibold text-cyan-300">{topDkPoints.toFixed(1)}</span> points.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                DraftKings scoring not available yet
              </p>
            )}
          </div>
        </div>

        {/* Footer divider */}
        <div className="border-t border-cyan-500/15 px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-cyan-400/50">
            Complete
          </span>
          <div className="text-xs font-bold uppercase tracking-wide text-cyan-300 group-hover:text-cyan-200">
            View Recap →
          </div>
        </div>
      </div>
    </Link>
  )
}
