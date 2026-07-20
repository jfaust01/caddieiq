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
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Field</div>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-2xl font-bold text-foreground">{fieldSize}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">players</div>
        </CardContent>
      </Card>

      {/* Top Ranked Player */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Top Ranked</div>
          <div className="mt-2 font-semibold text-sm text-foreground truncate leading-tight">{topPlayer?.playerName ?? '—'}</div>
          <div className="mt-1 text-xs text-muted-foreground">in field</div>
        </CardContent>
      </Card>

      {/* Rating of Top Player */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Score</div>
          <div className="mt-2 text-2xl font-bold text-primary">{topPlayerScore !== null ? topPlayerScore : '—'}</div>
          <div className="mt-1 text-xs text-muted-foreground">rating</div>
        </CardContent>
      </Card>

      {/* Rated Players */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Rated</div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground">{ratedPlayers}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">players</div>
        </CardContent>
      </Card>

      {/* Tournament Status */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Tour</div>
          <div className="mt-2 font-bold text-sm text-foreground">{tourName}</div>
          <div className="mt-1 text-xs text-muted-foreground">{tournament?.status ?? '—'}</div>
        </CardContent>
      </Card>
    </div>
  )
}
