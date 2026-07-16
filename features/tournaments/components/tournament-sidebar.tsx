import { CloudSun, Newspaper, UserMinus } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ComingSoonCard } from '@/features/tournaments/components/coming-soon-card'
import { TournamentFieldNews } from '@/features/tournaments/components/tournament-field-news'
import type { TournamentNewsItem, TournamentSummary } from '@/features/tournaments/types'
import { cn } from '@/lib/utils'

interface ResearchRow {
  label: string
  ready: boolean
}

function ResearchStatusRow({ label, ready }: ResearchRow) {
  return (
    <li className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <span className={cn(ready ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      <span
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium',
          ready ? 'text-success' : 'text-muted-foreground/70',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'size-1.5 rounded-full',
            ready ? 'bg-success' : 'bg-muted-foreground/40',
          )}
        />
        {ready ? 'Ready' : 'Pending'}
      </span>
    </li>
  )
}

interface TournamentSidebarProps {
  tournament: TournamentSummary
  /** Recent news about the field's players; empty falls back to a placeholder. */
  fieldNews: TournamentNewsItem[]
  /** Whether a field has been imported for this event (drives Research status). */
  hasField: boolean
}

/**
 * Desktop research rail. The Field news card is live when the provider has
 * articles for this event's field players; withdrawals and weather alerts
 * remain reserved placeholders awaiting their feeds. The Research Status card
 * is live today, reflecting which core data has actually been imported.
 */
export function TournamentSidebar({ tournament, fieldNews, hasField }: TournamentSidebarProps) {
  const research: ResearchRow[] = [
    { label: 'Schedule & dates', ready: Boolean(tournament.startDate) },
    { label: 'Host course', ready: Boolean(tournament.course) },
    { label: 'Player field', ready: hasField },
    { label: 'Latest news', ready: fieldNews.length > 0 },
    { label: 'Weather forecast', ready: false },
    { label: 'Betting markets', ready: false },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Research status</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {research.map((row) => (
              <ResearchStatusRow key={row.label} label={row.label} ready={row.ready} />
            ))}
          </ul>
        </CardContent>
      </Card>

      {fieldNews.length > 0 ? (
        <TournamentFieldNews news={fieldNews} />
      ) : (
        <ComingSoonCard
          icon={Newspaper}
          title="Latest news"
          description="Headlines and pre-tournament storylines for this event as they break."
        />
      )}
      <ComingSoonCard
        icon={UserMinus}
        title="Withdrawals"
        description="Late withdrawals and field changes that affect your model."
      />
      <ComingSoonCard
        icon={CloudSun}
        title="Weather alerts"
        description="Delays, suspensions, and significant forecast swings during tournament week."
      />
    </div>
  )
}
