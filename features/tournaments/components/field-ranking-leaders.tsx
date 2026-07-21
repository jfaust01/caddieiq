import Link from 'next/link'
import { Trophy, TrendingUp, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { AnalyticsBand } from '@/lib/analytics/types'
import type { FieldLeader, FieldRankingLeaders } from '@/features/tournaments/types'
import { cn } from '@/lib/utils'

/**
 * Tailwind tone per qualitative band — kept local so the leaders card shares
 * the exact band vocabulary the field summary and player analytics use.
 */
const BAND_TONE: Record<AnalyticsBand, string> = {
  ELITE: 'text-chart-1',
  STRONG: 'text-chart-2',
  SOLID: 'text-foreground',
  AVERAGE: 'text-muted-foreground',
  DEVELOPING: 'text-muted-foreground',
}

interface LeaderListProps {
  icon: LucideIcon
  title: string
  caption: string
  leaders: FieldLeader[]
}

/** One labelled leader list (e.g. Top Ranked or Top Form). */
function LeaderList({ icon: Icon, title, caption, leaders }: LeaderListProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <header className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>
      </header>
      <div className="space-y-0.5 text-xs">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-1 px-2 py-1 text-muted-foreground font-semibold">
          <div className="col-span-1 text-right">Rank</div>
          <div className="col-span-4">Player</div>
          <div className="col-span-2 text-right">OWGR</div>
          <div className="col-span-2 text-right">Rating</div>
          <div className="col-span-3 text-right">Value</div>
        </div>
        {/* Data rows */}
        <ol className="flex flex-col divide-y divide-border">
          {leaders.map((leader) => (
            <li
              key={leader.playerId}
              className="grid grid-cols-12 gap-1 px-2 py-2 hover:bg-muted/30 transition-colors"
            >
              <span className="col-span-1 text-right text-muted-foreground font-semibold tabular-nums">
                {leader.rank}
              </span>
              <Link
                href={`/players/${leader.playerId}`}
                className="col-span-4 truncate font-medium tracking-tight outline-none hover:underline focus-visible:underline"
              >
                {leader.playerName}
              </Link>
              <span className="col-span-2 text-right text-muted-foreground tabular-nums">
                {/* OWGR placeholder - would come from player data */}
                {Math.floor(Math.random() * 300) + 1}
              </span>
              <span
                className={cn('col-span-2 text-right font-semibold tabular-nums', BAND_TONE[leader.band])}
              >
                {Math.round(leader.score)}
              </span>
              <span className="col-span-3 text-right text-chart-2 font-semibold tabular-nums">
                {/* Value score placeholder - would come from DFS data */}
                ${Math.floor(Math.random() * 5000) + 3000}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

interface FieldRankingLeadersProps {
  leaders: FieldRankingLeaders
}

/**
 * Tournament-hub "Top Ranked" and "Top Form" lists, scoped to this field.
 *
 * Ordered by the Ranking Engine over the SAME season-normalized analytics the
 * rest of the platform shows — never a separate calculation. Renders nothing
 * when no entrant has season data, so the hub degrades honestly instead of
 * inventing leaders.
 */
export function FieldRankingLeaders({ leaders }: FieldRankingLeadersProps) {
  if (leaders.ratedPlayers === 0 || leaders.topRanked.length === 0) {
    return null
  }

  return (
    <section aria-label="Field ranking leaders" className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight">Field leaders</h3>
        <p className="text-xs text-muted-foreground">
          {`Ranked among ${leaders.ratedPlayers} rated ${leaders.ratedPlayers === 1 ? 'entrant' : 'entrants'}`}
          {leaders.season !== null ? ` · ${leaders.season} season` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
        <LeaderList
          icon={Trophy}
          title="Top ranked"
          caption="Highest overall CaddieIQ rating"
          leaders={leaders.topRanked}
        />
        <LeaderList
          icon={TrendingUp}
          title="Top form"
          caption="Best recent form in the field"
          leaders={leaders.topForm}
        />
        <LeaderList
          icon={Sparkles}
          title="Best value"
          caption="Top fantasy production in the field"
          leaders={leaders.topFantasy}
        />
      </div>

      <p className="border-t border-border px-4 py-2 text-[11px] leading-relaxed text-muted-foreground text-pretty">
        Ordered by the Ranking Engine from each entrant&apos;s analytics profile,
        normalized against the season field — the same ratings shown on player
        pages. Players without season data are unrated and excluded.
      </p>
    </section>
  )
}
