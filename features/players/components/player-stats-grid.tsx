import { Info } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'
import type { PlayerSeasonStat } from '@/features/players/types'
import {
  decimalDisplay,
  numberDisplay,
  rankMovementDisplay,
  worldRankDisplay,
} from '@/features/players/utils/format'

interface PlayerStatsGridProps {
  seasonStatistics: PlayerSeasonStat[]
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card size="sm" className="gap-0">
      <CardContent className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xl font-semibold tracking-tight tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{hint ?? '\u00A0'}</span>
      </CardContent>
    </Card>
  )
}

/** One season's worth of provider-reported statistics. */
function SeasonPanel({ stat }: { stat: PlayerSeasonStat }) {
  const movement = rankMovementDisplay(stat.worldRanking, stat.worldRankingLastWeek)

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader as="h3" title={`${stat.season} Season`} className="sm:items-start" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          label="World ranking"
          value={worldRankDisplay(stat.worldRanking)}
          hint={movement === '—' ? undefined : `${movement} vs last week`}
        />
        <StatTile label="Events played" value={numberDisplay(stat.events)} />
        <StatTile label="Avg. points" value={decimalDisplay(stat.averagePoints)} hint="per event" />
        <StatTile label="Total points" value={decimalDisplay(stat.totalPoints)} hint="season" />
        <StatTile label="Points gained" value={decimalDisplay(stat.pointsGained)} />
      </div>
    </div>
  )
}

/**
 * Season statistics panel. Renders exactly the season-level metrics the data
 * provider supplies — world ranking, events played, and fantasy-points
 * aggregates — grouped by season (newest first). Metrics the source does not
 * expose at season level (money, FedEx Cup points, wins, top-10s, scoring
 * average, strokes-gained) are intentionally omitted rather than fabricated,
 * and a short note makes that coverage explicit.
 */
export function PlayerStatsGrid({ seasonStatistics }: PlayerStatsGridProps) {
  if (seasonStatistics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Season statistics haven&apos;t been imported for this player yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season Statistics</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {seasonStatistics.map((stat) => (
          <SeasonPanel key={stat.season} stat={stat} />
        ))}
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="text-pretty">
            {
              'World ranking, events played, and fantasy points are sourced from the data provider. Money, FedEx Cup points, scoring average, and strokes-gained are not available at this tier and are omitted rather than estimated.'
            }
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
