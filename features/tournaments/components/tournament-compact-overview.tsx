'use client'

import type { TournamentSummary, TournamentField } from '@/features/tournaments/types'
import { EventDetailsPills } from './event-details-pills'
import { TournamentField } from './tournament-field'

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

      {/* Field Section */}
      {hasField && (
        <div className="pt-8 border-t border-border min-w-0">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Field</h3>
            <p className="text-sm text-muted-foreground">Browse every golfer in this tournament.</p>
          </div>
          <div className="min-w-0">
            <TournamentField field={field} />
          </div>
        </div>
      )}
    </div>
  )
}
