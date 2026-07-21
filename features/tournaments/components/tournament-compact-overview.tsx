'use client'

import type { TournamentSummary, TournamentField } from '@/features/tournaments/types'
import { TournamentOverview } from './tournament-overview'
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
    <div className="flex flex-col gap-6">
      {/* Tournament Overview Card (event metadata) */}
      <div>
        <TournamentOverview tournament={tournament} />
      </div>

      {/* Field Section */}
      {hasField && (
        <div className="pt-8 border-t border-border">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Field</h3>
            <p className="text-sm text-muted-foreground">Browse every golfer in this tournament.</p>
          </div>
          <TournamentField field={field} />
        </div>
      )}
    </div>
  )
}
