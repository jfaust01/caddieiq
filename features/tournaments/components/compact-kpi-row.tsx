'use client'

import { Users, TrendingUp } from 'lucide-react'
import type { TournamentSummary } from '@/features/tournaments/types'
import type { TournamentField } from '@/features/tournaments/types'
import { Card, CardContent } from '@/components/ui/card'

interface CompactKpiRowProps {
  tournament: TournamentSummary
  field: TournamentField
  fieldReport?: { cutLine?: string; averageScore?: number } | null
}

/**
 * Compact KPI row (5 metrics) for the tournament overview.
 * Shows: Field Size, Top Player by Rank, Field Strength, Rated Players, Status
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {/* Field Size */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Field</div>
          <div className="mt-1 flex items-center gap-1 font-semibold">
            <Users className="size-4" />
            {fieldSize}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">players</div>
        </CardContent>
      </Card>

      {/* Top Ranked Player */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Top Ranked</div>
          <div className="mt-1 font-semibold text-sm truncate">{topPlayer?.playerName ?? '—'}</div>
          <div className="mt-1 text-xs text-muted-foreground">in field</div>
        </CardContent>
      </Card>

      {/* Rating of Top Player */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Their Score</div>
          <div className="mt-1 font-semibold text-primary">{topPlayerScore !== null ? topPlayerScore : '—'}</div>
          <div className="mt-1 text-xs text-muted-foreground">rating</div>
        </CardContent>
      </Card>

      {/* Rated Players */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Rated</div>
          <div className="mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="size-4" />
            {ratedPlayers}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">players</div>
        </CardContent>
      </Card>

      {/* Tournament Status */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Tour</div>
          <div className="mt-1 font-semibold text-sm">{tourName}</div>
          <div className="mt-1 text-xs text-muted-foreground">{tournament?.status ?? '—'}</div>
        </CardContent>
      </Card>
    </div>
  )
}
