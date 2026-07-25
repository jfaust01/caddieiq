'use client'

import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Trophy,
  TrendingUp,
} from 'lucide-react'
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

/** Scheduled tournament card - emphasizes draft preparation with stat boxes. */
export function TournamentCardScheduled({ tournament }: TournamentCardScheduledProps) {
  const location = formatLocation(tournament.location)
  const venue =
    tournament.course && location !== EMPTY_VALUE
      ? `${tournament.course} · ${location}`
      : tournament.course ?? location

  const purseDisplay = formatPurse(tournament.purse)
  const hasDefendingChamp = !!tournament.defendingChampion

  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg cursor-pointer',
          'bg-gradient-to-br from-slate-900/90 to-slate-950/70',
          'border border-cyan-500/30 hover:border-cyan-400/60',
          'hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-400 focus-within:ring-offset-2'
        )}
      >
      {/* Green top accent line - scheduled theme */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600" aria-hidden />

      {/* Inset highlight */}
      <div className="absolute inset-x-0 top-2 h-px bg-gradient-to-r from-cyan-300/30 via-cyan-200/15 to-transparent pointer-events-none" aria-hidden />

      {/* Content */}
      <div className="flex flex-col gap-0 p-6">
        {/* Header with badges */}
        <div className="flex items-center justify-between gap-3 mb-4 min-w-0">
          <h3
            className="text-sm font-bold uppercase tracking-wider text-cyan-300 flex-1"
            title={tournament.name}
          >
            {tournament.name}
          </h3>
          <Badge
            className="h-6 px-2 text-xs font-semibold uppercase tracking-wide border-cyan-400/60 bg-cyan-500/20 text-cyan-300 shrink-0"
          >
            UPCOMING
          </Badge>
        </div>

        {/* Tournament metadata line */}
        <p className="text-xs text-slate-400 mb-4 line-clamp-1">
          {tourShortLabel(tournament.tour?.type ?? null)} • {venue}
        </p>

        {/* Stat boxes grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {/* Box 1: Field Strength */}
          <div className="border border-cyan-500/30 rounded-lg p-3 bg-cyan-500/5 text-center">
            <Trophy className="size-4 mx-auto mb-2 text-cyan-400" aria-hidden />
            <p className="text-2xl font-bold text-cyan-300 leading-tight">88</p>
            <p className="text-xs text-cyan-300/70 uppercase tracking-wide mt-1">Elite</p>
          </div>

          {/* Box 2: Avg Score */}
          <div className="border border-cyan-500/30 rounded-lg p-3 bg-cyan-500/5 text-center">
            <TrendingUp className="size-4 mx-auto mb-2 text-cyan-400" aria-hidden />
            <p className="text-2xl font-bold text-cyan-300 leading-tight">+2</p>
            <p className="text-xs text-cyan-300/70 uppercase tracking-wide mt-1">Avg Par</p>
          </div>

          {/* Box 3: Ownership */}
          <div className="border border-cyan-500/30 rounded-lg p-3 bg-cyan-500/5 text-center">
            <Users className="size-4 mx-auto mb-2 text-cyan-400" aria-hidden />
            <p className="text-2xl font-bold text-cyan-300 leading-tight">24%</p>
            <p className="text-xs text-cyan-300/70 uppercase tracking-wide mt-1">High Own</p>
          </div>

          {/* Box 4: Purse Display */}
          <div className="border border-cyan-500/30 rounded-lg p-3 bg-cyan-500/5 text-center">
            <DollarSign className="size-4 mx-auto mb-2 text-cyan-400" aria-hidden />
            <p className="text-lg font-bold text-cyan-300 leading-tight">
              {purseDisplay === EMPTY_VALUE ? '—' : purseDisplay.substring(0, 6)}
            </p>
            <p className="text-xs text-cyan-300/70 uppercase tracking-wide mt-1">Purse</p>
          </div>
        </div>

        {/* Key details */}
        <div className="space-y-2 mb-4 text-xs text-slate-400">
          <p className="flex items-center gap-2">
            <Calendar className="size-3.5 text-cyan-400" />
            {formatDateRange(tournament.startDate, tournament.endDate)}
          </p>
          {hasDefendingChamp && (
            <p className="flex items-center gap-2 text-cyan-300/70">
              <Users className="size-3.5 text-cyan-400" />
              Defending: {tournament.defendingChampion?.playerName}
            </p>
          )}
        </div>

        {/* Footer: divider and action */}
        <div className="border-t border-cyan-500/15 pt-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-cyan-400/50">
            Prepare
          </span>
          <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-cyan-300 group-hover:text-cyan-200">
            Build Slate →
          </div>
        </div>
      </div>
      </div>
    </Link>
  )
}
