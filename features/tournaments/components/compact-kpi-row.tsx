'use client'

import type { TournamentSummary } from '@/features/tournaments/types'
import type { TournamentField } from '@/features/tournaments/types'
import { MetricGrid, MetricItem } from '@/components/shared/surface-primitives'

interface CompactKpiRowProps {
  tournament: TournamentSummary
  field: TournamentField
  fieldReport?: { cutLine?: string; averageScore?: number } | null
}

/**
 * Compact KPI row (5 metrics) for the tournament overview.
 * Shows: Field Size, Top Player by Rank, Field Strength, Rated Players, Status
 * 
 * Uses MetricGrid + MetricItem for clean spacing without individual cards.
 */
export function CompactKpiRow({
  tournament,
  field,
  fieldReport,
}: CompactKpiRowProps) {
  // Get top-ranked player from field analytics
  const topPlayer = field?.rankingLeaders?.topRanked?.[0]
  const topPlayerScore = topPlayer ? Math.round(topPlayer.score) : null
  const fieldSize = field?.size ?? 0
  const ratedPlayers = field?.rankingLeaders?.ratedPlayers ?? 0
  const tourName = tournament?.tour?.code ?? 'Event'

  return (
    <MetricGrid columns="auto">
      {/* Field Size */}
      <MetricItem
        label="Field"
        value={fieldSize}
        hint="players"
      />

      {/* Top Ranked Player */}
      <MetricItem
        label="Top Ranked"
        value={topPlayer?.playerName ?? '—'}
        hint="in field"
      />

      {/* Rating of Top Player */}
      <MetricItem
        label="Score"
        value={topPlayerScore !== null ? topPlayerScore : '—'}
        hint="rating"
      />

      {/* Rated Players */}
      <MetricItem
        label="Rated"
        value={ratedPlayers}
        hint="players"
      />

      {/* Tournament Status */}
      <MetricItem
        label="Tour"
        value={tourName}
        hint={tournament?.status ?? '—'}
      />
    </MetricGrid>
  )
}
