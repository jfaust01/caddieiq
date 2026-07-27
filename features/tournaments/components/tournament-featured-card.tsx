'use client'

import { ArrowUpRight, Flag } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TournamentStatusBadge } from '@/features/tournaments/components/tournament-status-badge'
import type { TournamentSummary } from '@/features/tournaments/types'
import {
  EMPTY_VALUE,
  formatDateRange,
  formatFieldSize,
  formatLocation,
  formatToPar,
  textDisplay,
} from '@/features/tournaments/utils/format'
import { generateTournamentSlug } from '@/features/tournaments/utils/slug'
import { cn } from '@/lib/utils'

interface TournamentFeaturedCardProps {
  tournament: TournamentSummary
  /** For live tournaments: current leader name */
  currentLeader?: string | null
  /** For live tournaments: leader score */
  leaderScore?: number | null
  /** For completed tournaments: winner name */
  winner?: string | null
  /** For completed tournaments: winning score */
  winningScore?: number | null
  /** Field size for upcoming tournaments */
  fieldSize?: number | null
  className?: string
}

/**
 * Premium featured tournament card.
 * Displays differently based on tournament status (live, upcoming, completed).
 * Entire card is clickable.
 */
export function TournamentFeaturedCard({
  tournament,
  currentLeader,
  leaderScore,
  winner,
  winningScore,
  fieldSize,
  className,
}: TournamentFeaturedCardProps) {
  const location = formatLocation(tournament.location)
  const venue =
    tournament.course && location !== EMPTY_VALUE
      ? `${tournament.course} · ${location}`
      : (tournament.course ?? location)

  const isLive = tournament.status === 'ACTIVE'
  const isCompleted = tournament.status === 'COMPLETED'
  const isUpcoming = tournament.status === 'SCHEDULED'

  return (
    <Card
      className={cn(
        'relative overflow-hidden cursor-pointer transition-all hover:border-foreground/30 hover:shadow-lg focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:ring-offset-background',
        className,
      )}
    >
      {/* Live indicator dot */}
      {isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-amber-400">
          <div className="size-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase">Live</span>
        </div>
      )}

      <CardContent className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {tournament.tour?.code ?? 'PGA'}
              </Badge>
              <TournamentStatusBadge status={tournament.status} />
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground line-clamp-2">
            <Link
              href={`/tournaments/${generateTournamentSlug(tournament.id)}`}
              className="outline-none after:absolute after:inset-0 hover:underline"
            >
              {tournament.name}
            </Link>
          </h2>

          <p className="text-sm text-muted-foreground">{venue}</p>
        </div>

        {/* Status-aware content */}
        <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5">
          {isLive && (
            <>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Current Leader
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {currentLeader ?? EMPTY_VALUE}
                </p>
                {leaderScore !== null && leaderScore !== undefined && (
                  <p className="text-sm text-amber-400 font-semibold">
                    {formatToPar(leaderScore)}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Tournament Status
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {formatDateRange(tournament.startDate, tournament.endDate)}
                </p>
              </div>
            </>
          )}

          {isCompleted && (
            <>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Tournament Winner
                </p>
                <p className="text-lg font-semibold text-foreground">{winner ?? EMPTY_VALUE}</p>
                {winningScore !== null && winningScore !== undefined && (
                  <p className="text-sm text-sky-400 font-semibold">{formatToPar(winningScore)}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Dates</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatDateRange(tournament.startDate, tournament.endDate)}
                </p>
              </div>
            </>
          )}

          {isUpcoming && (
            <>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Start Date
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {textDisplay(tournament.startDate)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Field Size
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {fieldSize ? formatFieldSize(fieldSize) : EMPTY_VALUE}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer action */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {tournament.course} • {tournament.tour?.name ?? 'Professional'}
          </span>
          <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>
      </CardContent>
    </Card>
  )
}
