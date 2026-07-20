'use client'

import { Users, TrendingUp } from 'lucide-react'
import type { TournamentSummary } from '@/features/tournaments/types'
import type { TournamentField } from '@/features/tournaments/services/tournament-service'
import type { FieldReport } from '@/features/tournaments/services/tournament-service'
import { Card, CardContent } from '@/components/ui/card'

interface CompactKpiRowProps {
  tournament: TournamentSummary
  field: TournamentField
  fieldReport: FieldReport | null
}

/**
 * Compact KPI row (5 metrics) for the tournament overview.
 * Shows: Leader, Score, Cut Line, Field Strength, Scoring Average
 */
export function CompactKpiRow({
  tournament,
  field,
  fieldReport,
}: CompactKpiRowProps) {
  const leader = field.currentLeader
  const leaderScore = leader?.scoreRelativeToPar ?? 0
  const leaderScoreDisplay = leaderScore > 0 ? `+${leaderScore}` : leaderScore === 0 ? 'E' : `${leaderScore}`
  
  const cutLine = fieldReport?.cutLine ?? 'N/A'
  const fieldSize = field.size
  const avgScore = fieldReport?.averageScore?.toFixed(1) ?? '—'

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {/* Leader */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Leader</div>
          <div className="mt-1 font-semibold truncate">{leader?.playerName ?? '—'}</div>
          <div className="mt-1 text-sm text-primary">{leaderScoreDisplay}</div>
        </CardContent>
      </Card>

      {/* Score */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Lead By</div>
          <div className="mt-1 font-semibold">
            {leader?.leaderboardPosition && leader.leaderboardPosition > 1
              ? `${(leader.scoreRelativeToPar ?? 0) - (field.currentLeader?.scoreRelativeToPar ?? 0)}` ?? '—'
              : '—'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">strokes</div>
        </CardContent>
      </Card>

      {/* Cut Line */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Cut Line</div>
          <div className="mt-1 font-semibold">{cutLine}</div>
          <div className="mt-1 text-xs text-muted-foreground">approx</div>
        </CardContent>
      </Card>

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

      {/* Avg Score */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Avg Score</div>
          <div className="mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="size-4" />
            {avgScore}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">round</div>
        </CardContent>
      </Card>
    </div>
  )
}
