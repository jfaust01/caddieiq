'use client'

import type { TournamentSummary } from '@/features/tournaments/types'
import { TournamentOverview } from './tournament-overview'

interface TournamentCompactOverviewProps {
  tournament: TournamentSummary
}

/**
 * Tournament overview displaying event metadata and key information.
 */
export function TournamentCompactOverview({
  tournament,
}: TournamentCompactOverviewProps) {

  return (
    <div className="flex flex-col gap-6">
      {/* Tournament Overview Card (event metadata) */}
      <div>
        <TournamentOverview tournament={tournament} />
      </div>
    </div>
  )
}
