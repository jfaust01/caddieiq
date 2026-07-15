import { CalendarDays } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { TournamentStatusBadge } from '@/features/tournaments/components/tournament-status-badge'
import type { CourseTournament } from '@/features/courses/types'

const EMPTY_VALUE = '—'

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

/** Formats a date range like "Apr 10 – 13, 2025", degrading gracefully. */
function formatDateRange(startIso: string | null, endIso: string | null): string {
  const start = startIso ? new Date(startIso) : null
  const end = endIso ? new Date(endIso) : null
  if (start && Number.isNaN(start.getTime())) return EMPTY_VALUE
  if (!start) return EMPTY_VALUE
  if (!end || Number.isNaN(end.getTime())) return DATE_FMT.format(start)
  return `${DATE_FMT.format(start)} – ${DATE_FMT.format(end)}`
}

interface CourseTournamentsProps {
  tournaments: CourseTournament[]
}

/**
 * The list of tournaments hosted at this course, newest first. Each row links
 * to the tournament detail page. When empty, shows an intentional empty state
 * rather than a blank card.
 */
export function CourseTournaments({ tournaments }: CourseTournamentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tournaments hosted here</CardTitle>
      </CardHeader>
      <CardContent>
        {tournaments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No linked tournaments"
            description="No tournaments in the database are currently associated with this course."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {tournaments.map((tournament) => (
              <li key={tournament.id}>
                <Link
                  href={`/tournaments/${tournament.id}`}
                  className="flex items-center justify-between gap-3 py-3 outline-none transition-colors first:pt-0 last:pb-0 hover:text-primary focus-visible:text-primary"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-2 truncate text-sm font-medium">
                      {tournament.name}
                      {tournament.hostCourse ? null : (
                        <Badge variant="outline" className="shrink-0 text-xs font-normal">
                          Co-host
                        </Badge>
                      )}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{tournament.year}</span>
                      <span aria-hidden>·</span>
                      <span>{formatDateRange(tournament.startDate, tournament.endDate)}</span>
                      {tournament.tourName ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>{tournament.tourName}</span>
                        </>
                      ) : null}
                    </span>
                  </div>
                  <TournamentStatusBadge status={tournament.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
