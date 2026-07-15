import { ArrowUpRight, Award, CalendarDays, DollarSign, MapPin } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
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
    <Card className="justify-between transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="truncate font-medium tracking-tight" title={tournament.name}>
              <Link
                href={`/tournaments/${tournament.id}`}
                className="outline-none hover:underline focus-visible:underline"
              >
                {tournament.name}
              </Link>
            </h3>
            {tournament.officialName && tournament.officialName !== tournament.name ? (
              <p className="truncate text-xs text-muted-foreground" title={tournament.officialName}>
                {tournament.officialName}
              </p>
            ) : null}
          </div>
          <TournamentStatusBadge status={tournament.status} className="shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5 rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">Season</span>
            <span className="text-lg font-semibold tabular-nums">
              {seasonDisplay(tournament.season)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">Tour</span>
            <span className="flex h-7 items-center">
              <Badge variant="outline" title={tournament.tour?.name ?? undefined}>
                {tourShortLabel(tournament.tour?.type ?? null)}
              </Badge>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <DetailRow
            icon={CalendarDays}
            label="Dates"
            value={formatDateRange(tournament.startDate, tournament.endDate)}
          />
          <DetailRow icon={MapPin} label="Venue" value={venue} title={venue} />
          <DetailRow icon={DollarSign} label="Purse" value={formatPurse(tournament.purse)} />
          {tournament.defendingChampion ? (
            <DetailRow
              icon={Award}
              label="Defending champion"
              value={textDisplay(tournament.defendingChampion)}
            />
          ) : null}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          nativeButton={false}
          render={
            <Link href={`/tournaments/${tournament.id}`}>
              View details
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          }
        />
      </CardFooter>
    </Card>
  )
}
