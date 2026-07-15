import {
  Award,
  CalendarDays,
  DollarSign,
  Landmark,
  MapPin,
  Trophy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { TournamentSummary } from '@/features/tournaments/types'
import {
  formatDateRange,
  formatLocation,
  formatPurse,
  seasonDisplay,
  statusLabel,
  textDisplay,
} from '@/features/tournaments/utils/format'

interface FactProps {
  icon: LucideIcon
  label: string
  value: string
  title?: string
}

/** A single labelled fact with a leading icon; graceful em-dash fallback. */
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

interface TournamentOverviewProps {
  tournament: TournamentSummary
}

/**
 * The verified facts of record for the event, sourced live from the database.
 * Deliberately excludes internal audit timestamps — this is user-facing event
 * context, not a data-admin view.
 */
export function TournamentOverview({ tournament }: TournamentOverviewProps) {
  const tourName = tournament.tour?.name ?? null
  const location = formatLocation(tournament.location)

  return (
    <Card>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <Fact
            icon={CalendarDays}
            label="Dates"
            value={formatDateRange(tournament.startDate, tournament.endDate)}
          />
          <Fact icon={Trophy} label="Status" value={statusLabel(tournament.status)} />
          <Fact icon={Landmark} label="Tour" value={textDisplay(tourName)} />
          <Fact icon={CalendarDays} label="Season" value={seasonDisplay(tournament.season)} />
          <Fact
            icon={MapPin}
            label="Course"
            value={textDisplay(tournament.course)}
            title={tournament.course ?? undefined}
          />
          <Fact icon={MapPin} label="Location" value={location} title={location} />
          <Fact icon={DollarSign} label="Purse" value={formatPurse(tournament.purse)} />
          <Fact
            icon={Award}
            label="Defending champion"
            value={textDisplay(tournament.defendingChampion)}
          />
        </dl>
      </CardContent>
    </Card>
  )
}
