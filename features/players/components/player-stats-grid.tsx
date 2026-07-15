import { Info } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'
import type { PlayerSeasonStat } from '@/features/players/types'
import { decimalDisplay, numberDisplay } from '@/features/players/utils/format'

interface PlayerStatsGridProps {
  seasonStatistics: PlayerSeasonStat[]
  /**
   * The player's verified world ranking as shown in the profile header
   * (`player.worldRanking`). Passed in so the World Ranking tile can display the
   * same trustworthy value instead of the scrambled season-level rank — the two
   * must never contradict each other. `null` only when no verified rank exists.
   */
  verifiedWorldRanking: number | null
}

type Emphasis = 'primary' | 'secondary'

function StatTile({
  label,
  value,
  hint,
  source,
  emphasis = 'primary',
}: {
  label: string
  value: string
  hint?: string
  source?: string
  emphasis?: Emphasis
}) {
  // Primary metrics read larger; secondary (supporting) metrics sit on a muted
  // surface with a smaller value, so the hierarchy is obvious at a glance.
  const valueClass =
    emphasis === 'primary'
      ? 'text-2xl font-semibold tracking-tight tabular-nums'
      : 'text-lg font-semibold tracking-tight tabular-nums'

  return (
    <Card size="sm" className={emphasis === 'secondary' ? 'gap-0 bg-muted/30' : 'gap-0'}>
      <CardContent className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={valueClass}>{value}</span>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">{hint ?? '\u00A0'}</span>
          {source ? (
            <span className="text-xs text-muted-foreground/70">{source}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

/** One season's worth of verified provider statistics. */
function SeasonPanel({
  stat,
  verifiedWorldRanking,
}: {
  stat: PlayerSeasonStat
  verifiedWorldRanking: number | null
}) {
  // Prefer the verified profile ranking (same source the header shows); fall
  // back to this season's rank only if the player-level rank is missing. Never
  // render "Unranked" for trial-limited data — an absent rank is "Unavailable".
  const verifiedRank = verifiedWorldRanking ?? stat.worldRanking
  const rankValue = verifiedRank === null ? 'Unavailable' : `#${verifiedRank}`

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader as="h3" title={`${stat.season} Season`} className="sm:items-start" />

      {/* Primary metrics — the headline season facts. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile
          label="Official World Golf Ranking"
          value={rankValue}
          hint="Verified profile ranking"
        />
        <StatTile label="Events Played" value={numberDisplay(stat.events)} hint="This season" />
      </div>

      {/* Secondary metrics — supporting OWGR point totals. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile
          emphasis="secondary"
          label="OWGR Points (Average)"
          value={decimalDisplay(stat.averagePoints)}
          hint="Average per event"
          source="Source: OWGR"
        />
        <StatTile
          emphasis="secondary"
          label="OWGR Points (Season)"
          value={decimalDisplay(stat.totalPoints)}
          hint="Official season total"
          source="Source: OWGR"
        />
      </div>
    </div>
  )
}

/**
 * Season statistics card — held to CaddieIQ's "honesty over coverage" rule:
 * only verified, correctly-labelled values are shown, grouped by season (newest
 * first). Field-by-field treatment:
 *
 * - **Official World Golf Ranking** (primary) — shows the verified profile
 *   ranking (`player.worldRanking`) so it can never contradict the header;
 *   "Unavailable" (never "Unranked") when no verified rank exists.
 * - **Events Played** (primary) — verified provider data; shown as-is.
 * - **OWGR Points, Average/Season** (secondary) — these are Official World Golf
 *   Ranking points, NOT DraftKings fantasy points (see docs/DATA_CATALOG.md §4),
 *   so they are labelled and sourced as OWGR to avoid masquerading as DFS.
 * - **Points gained/lost** — returns 0 for every player on this tier (no real
 *   signal), so it is omitted rather than shown as a fabricated zero.
 *
 * Metrics the source does not expose at season level (money, FedEx Cup points,
 * wins, top-10s, scoring average, strokes-gained) remain intentionally absent —
 * no placeholder or "coming soon" clutter.
 */
export function PlayerStatsGrid({ seasonStatistics, verifiedWorldRanking }: PlayerStatsGridProps) {
  if (seasonStatistics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verified Season Statistics</CardTitle>
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
        <CardTitle>Verified Season Statistics</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {seasonStatistics.map((stat) => (
          <SeasonPanel key={stat.season} stat={stat} verifiedWorldRanking={verifiedWorldRanking} />
        ))}
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="text-pretty">
            {
              'Only verified statistics are displayed. OWGR metrics are official ranking points, not DraftKings fantasy scoring. Additional verified metrics appear automatically as provider coverage expands.'
            }
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
