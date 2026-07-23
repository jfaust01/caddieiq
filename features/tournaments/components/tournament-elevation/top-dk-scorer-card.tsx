'use client'

import { cn } from '@/lib/utils'
import { formatDkTotal } from '@/features/tournaments/utils/format'
import { DraftKingsMark } from '../draftkings-mark'

interface TopDkScorerCardProps {
  topDkScorer: {
    playerId: string
    playerName: string
    headshotUrl: string | null
    dkFantasyPoints: number
  } | null
  className?: string
}

/**
 * Top DK Scorer Card - displays the player with the highest actual DraftKings
 * fantasy points for the tournament with premium styling.
 */
export function TopDkScorerCard({ topDkScorer, className }: TopDkScorerCardProps) {
  const formattedPoints = topDkScorer ? formatDkTotal(topDkScorer.dkFantasyPoints) : '—'

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
        className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent"
      />

      {/* Top-right glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-500/[0.08] blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-6">
        {/* Header badge and eyebrow */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/10">
            <DraftKingsMark className="h-6 w-auto text-orange-400" aria-hidden />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
            Top DFS Scorer
          </span>
        </div>

        {topDkScorer ? (
          <>
            {/* Player content */}
            <div className="flex items-center gap-6">
              {/* Headshot */}
              {topDkScorer.headshotUrl ? (
                <img
                  src={topDkScorer.headshotUrl}
                  alt={topDkScorer.playerName}
                  className="h-24 w-24 shrink-0 rounded-full border border-white/[0.08] object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-lg font-semibold text-white">
                  {topDkScorer.playerName
                    .split(' ')
                    .slice(0, 2)
                    .map(name => name[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}

              {/* Player info and score */}
              <div className="flex flex-col gap-5 min-w-0 flex-1">
                {/* Player name */}
                <span className="truncate text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  {topDkScorer.playerName}
                </span>

                {/* Primary points line */}
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-4xl font-semibold tabular-nums text-orange-400">
                    {formattedPoints}
                  </span>
                  <span className="text-xl text-muted-foreground">DK PTS</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="text-xl font-semibold text-muted-foreground">
                Fantasy scoring data is not available yet
              </div>
              <div className="text-sm text-muted-foreground/70">
                This card updates when DraftKings scoring data becomes available.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
