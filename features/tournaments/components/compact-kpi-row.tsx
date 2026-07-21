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
 * Shows: Field Size, FedEx Points, Field Strength, Cut Line, Status
 * 
 * Uses MetricGrid + MetricItem for clean spacing without individual cards.
 */
export function CompactKpiRow({
  tournament,
  field,
  fieldReport,
}: CompactKpiRowProps) {
  const fieldSize = field?.size ?? 0
  const fedExPoints = tournament?.fedExPoints ?? null
  // Normalize cut line: handle undefined, null, "undefined", "null", NaN
  const cutLineValue = tournament?.cutLine
  const cutLine = typeof cutLineValue === 'number' && Number.isFinite(cutLineValue) ? cutLineValue : null
  const cutAfter = typeof tournament?.cutAfterRounds === 'number' && Number.isFinite(tournament.cutAfterRounds) ? tournament.cutAfterRounds : null
  const tourName = tournament?.tour?.code ?? 'Event'
  
  // Calculate field strength as % of field with world ranking
  const worldRankedCount = field?.rankingLeaders?.ratedPlayers ?? 0
  const fieldStrengthPercent = fieldSize > 0 ? Math.round((worldRankedCount / fieldSize) * 100) : 0

  return (
    <MetricGrid columns="auto">
      {/* Field Size */}
      <MetricItem
        label="Field"
        value={fieldSize}
        hint="players"
      />

      {/* FedEx Points */}
      <MetricItem
        label="FedEx Points"
        value={fedExPoints ?? '—'}
        hint="available"
      />

      {/* Field Strength */}
      <MetricItem
        label="Strength"
        value={`${fieldStrengthPercent}%`}
        hint="ranked"
      />

      {/* Cut Line or Cut Rule */}
      <MetricItem
        label={cutLine !== null ? 'Cut Line' : 'Cut Rule'}
        value={cutLine !== null ? (cutLine >= 0 ? `+${cutLine}` : `${cutLine}`) : (cutAfter ? `${cutAfter}R` : '—')}
        hint={cutLine !== null ? 'score' : 'rounds'}
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
