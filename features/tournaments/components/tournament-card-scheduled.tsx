'use client'

import { Calendar, MapPin, DollarSign, Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { TournamentSummary } from '@/features/tournaments/types'
import {
  EMPTY_VALUE,
  formatDateRange,
  formatLocation,
  formatPurse,
  tourShortLabel,
} from '@/features/tournaments/utils/format'
import { cn } from '@/lib/utils'

interface TournamentCardScheduledProps {
  tournament: TournamentSummary
}

/** Scheduled tournament card - emphasizes draft preparation metrics. */
export function TournamentCardScheduled({ tournament }: TournamentCardScheduledProps) {
  const location = formatLocation(tournament.location)
  const venue =
    tournament.course && location !== EMPTY_VALUE
      ? `${tournament.course} · ${location}`
      : tournament.course ?? location

  const purseDisplay = formatPurse(tournament.purse)
  const hasDefendingChamp = !!tournament.defendingChampion

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg cursor-pointer',
        'bg-gradient-to-br from-slate-900/80 to-slate-950/60',
        'border border-cyan-500/20 hover:border-cyan-400/40',
        'hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-200',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2 focus-within:ring-offset-background'
      )}
    >
      {/* Cyan top accent line - represents upcoming/preparation phase */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-400/40" aria-hidden />

      {/* Inset highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-300/20 via-cyan-200/10 to-transparent pointer-events-none" aria-hidden />

      {/* Content */}
      <div className="flex flex-col gap-0 p-5">
        {/* Header: badges and chevron */}
        <div className="flex items-start justify-between gap-2 min-w-0 mb-3">
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className="h-6 px-2 text-xs font-semibold uppercase tracking-wide border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
            >
              {tourShortLabel(tournament.tour?.type ?? null)}
            </Badge>
            <Badge
              variant="outline"
              className="h-6 px-2 text-xs font-semibold uppercase tracking-wide border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
            >
              Upcoming
            </Badge>
          </div>
          <ChevronRight className="size-4 shrink-0 text-cyan-600/40 group-hover:text-cyan-400/60 transition-colors mt-0.5" aria-hidden />
        </div>

        {/* Title */}
        <h3
          className="text-lg font-semibold leading-6 text-white mb-4 line-clamp-2 group-hover:text-cyan-100 transition-colors"
          title={tournament.name}
        >
          <Link
            href={`/tournaments/${tournament.id}`}
            className="outline-none after:absolute after:inset-0 focus:outline-none"
          >
            {tournament.name}
          </Link>
        </h3>

        {/* Draft prep metrics */}
        <div className="space-y-2.5 mb-4">
          {/* Dates - when to lock lineups */}
          <div className="flex items-start gap-2">
            <Calendar className="mt-px size-3.5 shrink-0 text-cyan-500/60" aria-hidden />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs text-cyan-300/70 uppercase tracking-wide">Tournament Dates</span>
              <span className="text-sm font-medium text-white truncate">
                {formatDateRange(tournament.startDate, tournament.endDate)}
              </span>
            </div>
          </div>

          {/* Venue - course conditions factor */}
          <div className="flex items-start gap-2">
            <MapPin className="mt-px size-3.5 shrink-0 text-cyan-500/60" aria-hidden />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs text-cyan-300/70 uppercase tracking-wide">Course</span>
              <span className="text-sm font-medium text-white truncate" title={venue}>
                {venue}
              </span>
            </div>
          </div>

          {/* Purse - field quality indicator */}
          {purseDisplay !== EMPTY_VALUE && (
            <div className="flex items-start gap-2">
              <DollarSign className="mt-px size-3.5 shrink-0 text-cyan-500/60" aria-hidden />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-cyan-300/70 uppercase tracking-wide">Prize Fund</span>
                <span className="text-sm font-medium text-white truncate">
                  {purseDisplay}
                </span>
              </div>
            </div>
          )}

          {/* Defending champion - historical context */}
          {hasDefendingChamp && (
            <div className="flex items-start gap-2">
              <Users className="mt-px size-3.5 shrink-0 text-cyan-500/60" aria-hidden />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-cyan-300/70 uppercase tracking-wide">Defending Champ</span>
                <span className="text-sm font-medium text-white truncate">
                  {tournament.defendingChampion}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer: preparation callout */}
        <div className="border-t border-cyan-500/10 pt-3 flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-cyan-300/70">
            Draft prep
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-cyan-300 group-hover:text-cyan-200 transition-colors">
            Build slate
            <ChevronRight className="size-3" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  )
}
