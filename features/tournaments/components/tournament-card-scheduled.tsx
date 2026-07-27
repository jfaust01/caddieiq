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
import { generateTournamentSlug } from '@/features/tournaments/utils/slug'
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
    <Link href={`/tournaments/${generateTournamentSlug(tournament.name, tournament.id)}`}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg cursor-pointer',
          'bg-[#0f1f2e]',
          'border border-green-500/30 hover:border-green-400/50',
          'hover:shadow-xl hover:shadow-green-500/15 transition-all duration-300',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-green-400 focus-within:ring-offset-2',
          'h-80'
        )}
      >

      {/* Content */}
      <div className="flex flex-col gap-0 p-6">
        {/* Header with icon, title, and description */}
        <div className="flex items-start gap-4 mb-6 min-w-0">
          {/* Circular icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full border border-green-500/60 bg-green-500/10 flex items-center justify-center">
            <Trophy className="size-5 text-green-400" aria-hidden />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-300 mb-1">
              {tournament.name}
            </h3>
            <p className="text-xs text-slate-400">
              {tourShortLabel(tournament.tour?.type ?? null)} • {venue}
            </p>
          </div>
        </div>

        {/* Stat boxes grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {/* Box 1: Field Strength */}
          <div className="border border-green-500/20 rounded-lg p-3 bg-green-500/5 text-center">
            <Trophy className="size-4 mx-auto mb-2 text-green-400" aria-hidden />
            <p className="text-xl font-bold text-green-100 leading-tight">88</p>
            <p className="text-xs text-green-300/70 uppercase tracking-wide mt-1">Elite</p>
          </div>

          {/* Box 2: Avg Score */}
          <div className="border border-green-500/20 rounded-lg p-3 bg-green-500/5 text-center">
            <TrendingUp className="size-4 mx-auto mb-2 text-green-400" aria-hidden />
            <p className="text-xl font-bold text-green-100 leading-tight">+2</p>
            <p className="text-xs text-green-300/70 uppercase tracking-wide mt-1">Avg Par</p>
          </div>

          {/* Box 3: Ownership */}
          <div className="border border-green-500/20 rounded-lg p-3 bg-green-500/5 text-center">
            <Users className="size-4 mx-auto mb-2 text-green-400" aria-hidden />
            <p className="text-xl font-bold text-green-100 leading-tight">24%</p>
            <p className="text-xs text-green-300/70 uppercase tracking-wide mt-1">High Own</p>
          </div>
        </div>

        {/* Key details */}
        <div className="space-y-2 text-xs text-slate-500">
          <p className="flex items-center gap-2 text-green-300/80">
            <Calendar className="size-3.5 text-green-400" />
            {formatDateRange(tournament.startDate, tournament.endDate)}
          </p>
          {hasDefendingChamp && (
            <p className="flex items-center gap-2 text-green-300/80">
              <Users className="size-3.5 text-green-400" />
              Defending: {tournament.defendingChampion?.playerName}
            </p>
          )}
        </div>
      </div>
      </div>
    </Link>
  )
}
