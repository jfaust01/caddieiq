'use client'

import type { TournamentSummary } from '@/features/tournaments/types'
import type { TournamentField } from '@/features/tournaments/types'
import { MetricGrid, MetricItem } from '@/components/shared/surface-primitives'
import { formatDateRange } from '@/features/tournaments/utils/format'

interface CompactKpiRowProps {
  tournament: TournamentSummary
  field: TournamentField
  fieldReport?: { cutLine?: string; averageScore?: number } | null
}

/**
 * Expanded KPI row (12+ metrics) for the tournament overview.
 * Shows: Field Size, Purse, Winner Share, Strength Rating, Cut Rule, Par, Yardage,
 * Course Type, Designer, Dates, Weather Status, Research Status
 * 
 * Uses MetricGrid + MetricItem for clean information density.
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
  
  // Format purse amount
  const purseAmount = tournament?.purse
  const purseFormatted = purseAmount ? `$${(purseAmount / 1_000_000).toFixed(1)}M` : '—'
  
  // Winner share
  const winnerShare = tournament?.winnerShare
  const winnerShareFormatted = winnerShare ? `$${(winnerShare / 1_000).toFixed(0)}K` : '—'
  
  // Course info
  const coursePar = tournament?.course?.par ?? null
  const courseYardage = tournament?.course?.yardage ?? null
  const courseYardageFormatted = courseYardage ? `${(courseYardage / 1000).toFixed(1)}K` : '—'
  
  // Tournament dates - use server-safe UTC formatting
  const datesFormatted = formatDateRange(tournament?.startDate ?? null, tournament?.endDate ?? null)

  return (
    <MetricGrid columns="auto">
      {/* Field Size */}
      <MetricItem
        label="Field"
        value={fieldSize}
        hint="players"
      />

      {/* Purse */}
      <MetricItem
        label="Purse"
        value={purseFormatted}
        hint="total"
      />

      {/* Winner Share */}
      <MetricItem
        label="Win Prize"
        value={winnerShareFormatted}
        hint="1st place"
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

      {/* Par */}
      <MetricItem
        label="Par"
        value={coursePar ?? '—'}
        hint="total"
      />

      {/* Yardage */}
      <MetricItem
        label="Yardage"
        value={courseYardageFormatted}
        hint="blue tees"
      />

      {/* Course Type/Designer */}
      <MetricItem
        label="Designer"
        value={tournament?.course?.architect ?? '—'}
        hint={tournament?.course?.courseType ?? 'course'}
      />

      {/* Tournament Dates */}
      <MetricItem
        label="Dates"
        value={datesFormatted}
        hint="tournament"
      />

      {/* FedEx Points */}
      <MetricItem
        label="FedEx Points"
        value={fedExPoints ?? '—'}
        hint="available"
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
