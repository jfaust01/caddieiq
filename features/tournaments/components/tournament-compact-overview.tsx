'use client'

import type { TournamentSummary, TournamentField } from '@/features/tournaments/types'
import { EventDetailsPills } from './event-details-pills'
import { TournamentField } from './tournament-field'
import { TournamentWinnerCard } from './tournament-elevation/tournament-winner-card'
import { TopDkScorerCard } from './tournament-elevation/top-dk-scorer-card'

interface TournamentCompactOverviewProps {
  tournament: TournamentSummary
  field: TournamentField
  fieldReport?: { cutLine?: string; averageScore?: number } | null
}

/**
 * Tournament overview displaying event metadata and field information.
 */
export function TournamentCompactOverview({
  tournament,
  field,
  fieldReport,
}: TournamentCompactOverviewProps) {
  const tournamentId = tournament.id
  const hasField = field.size > 0

  return (
    <div className="flex flex-col gap-6 min-w-0">
      {/* Event Details Pills */}
      <div className="min-w-0">
        <EventDetailsPills tournament={tournament} />
      </div>

      {/* Winner and Top DK Scorer Cards - displayed above Field section */}
      {hasField && (
        <div className="border-t border-border pt-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <TournamentWinnerCard
              tournamentWinner={tournament.tournamentWinner}
              isCompleted={tournament.status === 'COMPLETED'}
            />
            <TopDkScorerCard topDkScorer={tournament.topDkScorer} />
          </div>

          {/* Footnote */}
          <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <div className="mt-0.5 shrink-0 text-muted-foreground/60">ℹ</div>
            <p>Stats update automatically when official results and scoring are available.</p>
          </div>
        </div>
      )}

      {/* Field Section */}
      {hasField && (
        <div className="pt-2 border-t border-border min-w-0">
          <div className="min-w-0">
            <TournamentField field={field} tournamentId={tournamentId} />
          </div>
        </div>
      )}
    </div>
  )
}
