'use client'

import type { TournamentSummary, TournamentField } from '@/features/tournaments/types'
import { CompactKpiRow } from './compact-kpi-row'
import { TournamentOverview } from './tournament-overview'
import { TournamentField } from './tournament-field'

interface TournamentCompactOverviewProps {
  tournament: TournamentSummary
  field: TournamentField
  fieldReport?: { cutLine?: string; averageScore?: number } | null
  dfsField?: Record<string, unknown> | null
}

/**
 * Compact tournament overview dashboard (target: 2-3 viewport heights).
 * Combines KPIs, top-5 leaderboard, course fit, weather, DFS summary,
 * and course/history facts into a single scrollable overview.
 *
 * Full content is available in dedicated tabs (via TournamentDetailTabs).
 */
export function TournamentCompactOverview({
  tournament,
  field,
  fieldReport,
  dfsField,
}: TournamentCompactOverviewProps) {
  const hasField = field.size > 0
  const courseRef = tournament.courseRef

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Row: 12+ metric cards */}
      <div>
        <CompactKpiRow
          tournament={tournament}
          field={field}
          fieldReport={fieldReport}
        />
      </div>

      {/* Full Tournament Overview Card (event metadata) */}
      <div className="pt-2 border-t border-border">
        <h3 className="text-sm font-semibold mb-4">Event Details</h3>
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
