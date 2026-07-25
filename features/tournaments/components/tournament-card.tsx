import { ArrowUpRight, Award, CalendarDays, DollarSign, MapPin } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TournamentStatusBadge } from '@/features/tournaments/components/tournament-status-badge'
import type { TournamentSummary } from '@/features/tournaments/types'
import {
  EMPTY_VALUE,
  formatDateRange,
  formatLocation,
  formatPurse,
  seasonDisplay,
  textDisplay,
  tourShortLabel,
} from '@/features/tournaments/utils/format'

interface DetailRowProps {
  icon: typeof CalendarDays
  label: string
  value: string
  title?: string
}

function DetailRow({ icon: Icon, label, value, title }: DetailRowProps) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-medium" title={title ?? value}>
          {value}
        </span>
      </div>
    </div>
  )
}

interface TournamentCardProps {
  tournament: TournamentSummary
}

/** Grid card for the tournament directory. */
export function TournamentCard({ tournament }: TournamentCardProps) {
  const location = formatLocation(tournament.location)
  const venue =
    tournament.course && location !== EMPTY_VALUE
      ? `${tournament.course} · ${location}`
      : (tournament.course ?? location)

  return (
    <Card className="relative cursor-pointer transition-all hover:border-white/20 hover:shadow-lg focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:ring-offset-background">
      <CardContent className="flex flex-col gap-4 p-5">
        {/* Header with title and badge */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex flex-col gap-2 min-w-0">
            <h3 className="text-base font-semibold tracking-tight line-clamp-2" title={tournament.name}>
              <Link
                href={`/tournaments/${tournament.id}`}
                className="outline-none after:absolute after:inset-0 hover:underline"
              >
                {tournament.name}
              </Link>
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {tourShortLabel(tournament.tour?.type ?? null)}
              </Badge>
              <TournamentStatusBadge status={tournament.status} className="shrink-0" />
            </div>
          </div>
        </div>

        {/* Metadata row */}
        <div className="space-y-2">
          <DetailRow
            icon={CalendarDays}
            label="Dates"
            value={formatDateRange(tournament.startDate, tournament.endDate)}
          />
          <DetailRow icon={MapPin} label="Venue" value={venue} title={venue} />
          {formatPurse(tournament.purse) !== EMPTY_VALUE && (
            <DetailRow icon={DollarSign} label="Purse" value={formatPurse(tournament.purse)} />
          )}
        </div>

        {/* Season compact display */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-white/5">
          {tournament.tour?.name ?? 'Professional'} • {seasonDisplay(tournament.season)}
        </div>
      </CardContent>
    </Card>
  )
}
