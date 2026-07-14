import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'
import type { PlayerStatistic } from '@/features/players/types'
import { ordinal } from '@/features/players/utils/format'

interface PlayerStatsGridProps {
  statistics: PlayerStatistic[]
}

function StatTile({ stat }: { stat: PlayerStatistic }) {
  return (
    <Card size="sm" className="gap-0">
      <CardContent className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">{stat.label}</span>
        <span className="text-xl font-semibold tracking-tight tabular-nums">
          {stat.value}
        </span>
        <span className="text-xs text-muted-foreground">
          {stat.rank !== null ? `${ordinal(stat.rank)} on tour` : 'Rank pending'}
        </span>
      </CardContent>
    </Card>
  )
}

/**
 * Statistics panel grouped into Strokes Gained and traditional metrics.
 * Placeholder values until the stats provider is connected.
 */
export function PlayerStatsGrid({ statistics }: PlayerStatsGridProps) {
  const strokesGained = statistics.filter(
    (stat) => stat.category === 'STROKES_GAINED',
  )
  const traditional = statistics.filter(
    (stat) => stat.category === 'TRADITIONAL',
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <SectionHeader as="h3" title="Strokes Gained" className="sm:items-start" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {strokesGained.map((stat) => (
              <StatTile key={stat.key} stat={stat} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <SectionHeader as="h3" title="Traditional" className="sm:items-start" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {traditional.map((stat) => (
              <StatTile key={stat.key} stat={stat} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
