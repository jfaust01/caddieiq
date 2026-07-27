'use client'

import { useMemo } from 'react'

import type { TournamentSummary, TournamentStatus } from '@/features/tournaments/types'

interface TournamentIndexHeroProps {
  tournaments: TournamentSummary[]
  isLoading: boolean
}

/**
 * Premium hero section for tournaments index page.
 * Displays title, description, and real-time metric counts.
 */
export function TournamentIndexHero({ tournaments, isLoading }: TournamentIndexHeroProps) {
  const metrics = useMemo(() => {
    const statusCounts = tournaments.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        return acc
      },
      {} as Record<TournamentStatus, number>,
    )

    return {
      total: tournaments.length,
      upcoming: statusCounts.SCHEDULED || 0,
      live: statusCounts.ACTIVE || 0,
      completed: statusCounts.COMPLETED || 0,
    }
  }, [tournaments])

  return (
    <div className="space-y-6">
      {/* Eyebrow */}
      <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
        Tournament Data
      </div>

      {/* Title and description */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Tournaments
        </h1>
        <p className="text-base text-muted-foreground">
          Track upcoming fields, live slates, and completed fantasy results.
        </p>
      </div>

      {/* Metrics */}
      {!isLoading && metrics.total > 0 && (
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {metrics.total}
            </span>
            <span className="text-muted-foreground">Events</span>
          </div>
          {metrics.upcoming > 0 && (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tabular-nums text-emerald-400">
                {metrics.upcoming}
              </span>
              <span className="text-muted-foreground">Upcoming</span>
            </div>
          )}
          {metrics.live > 0 && (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tabular-nums text-amber-400">
                {metrics.live}
              </span>
              <span className="text-muted-foreground">Live</span>
            </div>
          )}
          {metrics.completed > 0 && (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tabular-nums text-sky-400">
                {metrics.completed}
              </span>
              <span className="text-muted-foreground">Completed</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
