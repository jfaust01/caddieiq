'use client'

import type { TournamentSummary, TournamentField } from '@/features/tournaments/types'
import { EventDetailsPills } from './event-details-pills'
import { TournamentField } from './tournament-field'
import { DkTotalCard } from './tournament-elevation/dk-total-card'

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
  const hasField = field.size > 0

  return (
    <div className="flex flex-col gap-6 min-w-0">
      {/* Event Details Pills */}
      <div className="min-w-0">
        <EventDetailsPills tournament={tournament} />
      </div>

      {/* DK Total Card - displayed above Field section */}
      {hasField && (
        <div className="border-t border-border pt-6">
          <DkTotalCard dkTotal={tournament.totalDkFantasyPoints} />
        </div>
      )}

      {/* Field Section */}
      {hasField && (
        <div className="pt-2 border-t border-border min-w-0">
          <div className="min-w-0">
            <TournamentField field={field} />
          </div>
        </div>
      )}
    </div>
  )
}
