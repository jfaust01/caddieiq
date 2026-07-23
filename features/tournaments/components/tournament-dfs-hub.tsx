'use client'

import type { TournamentField, TournamentSummary } from '@/features/tournaments/types'
import type { DfsValueField } from '@/lib/dfs-value'
import { CompactLeaderboard } from './compact-leaderboard'
import { CompactDfsSummary } from './compact-dfs-summary'
import { TournamentDfsLeaderboards } from './tournament-dfs-leaderboards'
import { TopDkScorerCard } from './tournament-elevation/top-dk-scorer-card'

interface TournamentDfsHubProps {
  tournament: TournamentSummary
  field: TournamentField
  dfsField: DfsValueField | null
}

/**
 * DFS Hub — central dashboard for fantasy decision-making.
 * Combines Morning Brief (trending), Top Ranked players, Value Plays,
 * and Your Players into a cohesive fantasy-focused experience.
 *
 * Order:
 * 1. Morning Brief (via CompactDfsSummary's implied state)
 * 2. Trending (via CompactLeaderboard section)
 * 3. Top Ranked
 * 4. Value Plays
 * 5. Your Players (future)
 */
export function TournamentDfsHub({
  tournament,
  field,
  dfsField,
}: TournamentDfsHubProps) {
  const hasField = field.size > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Top DFS Scorer Card */}
      <TopDkScorerCard topDkScorer={tournament.topDkScorer} />

      {/* Morning Brief - implied through trending/value indicators */}
      {/* Trending (Top Ranked Players) */}
      <div>
        <CompactLeaderboard
          field={field}
          tournamentId={tournament.id}
        />
      </div>

      {/* Value Plays (DFS Summary) */}
      {hasField && (
        <div>
          <CompactDfsSummary
            dfsField={dfsField}
            tournamentId={tournament.id}
          />
        </div>
      )}

      {/* DFS Value Leaderboards */}
      {hasField && dfsField && (
        <div>
          <TournamentDfsLeaderboards field={dfsField} />
        </div>
      )}

      {/* Your Players section - placeholder for future */}
      {/* Additional fantasy-focused widgets go here */}
    </div>
  )
}
