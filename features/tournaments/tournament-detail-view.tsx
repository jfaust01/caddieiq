import { Award, CalendarDays, ChevronLeft, DollarSign, Landmark, MapPin, Trophy } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageShell } from '@/components/shared/page-shell'
import { TournamentStatusBadge } from '@/features/tournaments/components/tournament-status-badge'
import type { TournamentSummary } from '@/features/tournaments/types'
import {
  EMPTY_VALUE,
  formatDateRange,
  formatLocation,
  formatPurse,
  seasonDisplay,
  statusLabel,
  textDisplay,
} from '@/features/tournaments/utils/format'

interface FactProps {
  icon: typeof CalendarDays
  label: string
  value: string
  title?: string
}

/** A single labelled fact row with a leading icon. Graceful em-dash fallback. */
function Fact({ icon: Icon, label, value, title }: FactProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium text-pretty" title={title ?? value}>
          {value}
        </dd>
      </div>
    </div>
  )
}

interface TournamentDetailViewProps {
  tournament: TournamentSummary
}

/**
 * Read-only detail page for a single tournament. Renders the fields available
 * from the live database (name, dates, status, course, tour, purse, season,
 * location, defending champion), degrading gracefully to an em-dash for any
 * field the source has not supplied.
 */
export function TournamentDetailView({ tournament }: TournamentDetailViewProps) {
  const tourName = tournament.tour?.name ?? null
  const location = formatLocation(tournament.location)

  return (
    <PageShell>
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        nativeButton={false}
        render={
          <Link href="/tournaments">
            <ChevronLeft data-icon="inline-start" />
            All tournaments
          </Link>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                {tournament.name}
              </h1>
              {tournament.officialName && tournament.officialName !== tournament.name ? (
                <p className="text-sm text-muted-foreground text-pretty">
                  {tournament.officialName}
                </p>
              ) : null}
            </div>
            <TournamentStatusBadge status={tournament.status} className="shrink-0" />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <Badge variant="outline" title={tourName ?? undefined}>
              {tourName ?? EMPTY_VALUE}
            </Badge>
            <span aria-hidden>•</span>
            <span>{formatDateRange(tournament.startDate, tournament.endDate)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <Fact
              icon={CalendarDays}
              label="Dates"
              value={formatDateRange(tournament.startDate, tournament.endDate)}
            />
            <Fact icon={Trophy} label="Status" value={statusLabel(tournament.status)} />
            <Fact icon={Landmark} label="Tour" value={textDisplay(tourName)} />
            <Fact icon={CalendarDays} label="Season" value={seasonDisplay(tournament.season)} />
            <Fact icon={DollarSign} label="Purse" value={formatPurse(tournament.purse)} />
            <Fact
              icon={MapPin}
              label="Course"
              value={textDisplay(tournament.course)}
              title={tournament.course ?? undefined}
            />
            <Fact icon={MapPin} label="Location" value={location} title={location} />
            <Fact
              icon={Award}
              label="Defending champion"
              value={textDisplay(tournament.defendingChampion)}
            />
          </dl>
        </CardContent>
      </Card>
    </PageShell>
  )
}
