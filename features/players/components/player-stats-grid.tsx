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
  // The season-level world ranking is obfuscated on the current provider tier
  // (ties, nulls). When it is missing we must NOT print "Unranked" here, because
  // the verified profile header already shows the player's real ranking — that
  // would contradict a trustworthy value shown elsewhere on the page. Defer to
  // it instead of asserting a rank we can't verify at season level.
  const rankingKnown = stat.worldRanking !== null

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader as="h3" title={`${stat.season} Season`} className="sm:items-start" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile
          label="World ranking"
          value={rankingKnown ? worldRankDisplay(stat.worldRanking) : 'See profile header'}
          hint={
            rankingKnown
              ? movement === '—'
                ? undefined
                : `${movement} vs last week`
              : 'Verified on profile'
          }
        />
        <StatTile label="Events played" value={numberDisplay(stat.events)} hint="verified" />
        <StatTile
          label="Avg. ranking points"
          value={decimalDisplay(stat.averagePoints)}
          hint="OWGR · per event"
        />
        <StatTile
          label="Total ranking points"
          value={decimalDisplay(stat.totalPoints)}
          hint="OWGR · season"
        />
      </div>
    </div>
  )
}

/**
 * Season statistics panel — held to CaddieIQ's "honesty over coverage" rule:
 * only verified, correctly-labelled values are shown, grouped by season (newest
 * first). Field-by-field treatment:
 *
 * - **Events played** — verified provider data; shown as-is.
 * - **World ranking** — obfuscated at season level on the current tier; when
 *   missing we defer to the verified profile header instead of printing
 *   "Unranked" and contradicting it.
 * - **Avg./Total ranking points** — these are Official World Golf Ranking
 *   points, NOT DraftKings fantasy points (see docs/DATA_CATALOG.md §4), so they
 *   are labelled as OWGR to avoid masquerading as DFS scoring.
 * - **Points gained/lost** — returns 0 for every player on this tier (no real
 *   signal), so it is omitted rather than shown as a fabricated zero.
 *
 * Metrics the source does not expose at season level (money, FedEx Cup points,
 * wins, top-10s, scoring average, strokes-gained) remain intentionally absent.
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
              'Only verified statistics are shown. Points figures are Official World Golf Ranking points, not DFS fantasy scoring. Additional metrics appear automatically when available from the connected data provider.'
            }
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
