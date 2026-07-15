import type { AnalyticsBand } from '@/lib/analytics/types'
import type { FieldAnalyticsSummary as FieldAnalyticsSummaryData } from '@/lib/analytics/types'
import { cn } from '@/lib/utils'

/**
 * Tailwind tone per qualitative band. Kept local to the tournament summary so
 * the field card can share the exact band vocabulary the player analytics use
 * without importing player-feature styling.
 */
const BAND_TONE: Record<AnalyticsBand, string> = {
  ELITE: 'text-chart-1',
  STRONG: 'text-chart-2',
  SOLID: 'text-foreground',
  AVERAGE: 'text-muted-foreground',
  DEVELOPING: 'text-muted-foreground',
}

const BAND_LABEL: Record<AnalyticsBand, string> = {
  ELITE: 'Elite',
  STRONG: 'Strong',
  SOLID: 'Solid',
  AVERAGE: 'Average',
  DEVELOPING: 'Developing',
}

/** Format a 0–100 score for display, or an em-dash when unavailable. */
function scoreText(value: number | null): string {
  return value === null ? '—' : Math.round(value).toString()
}

interface FieldAnalyticsSummaryProps {
  summary: FieldAnalyticsSummaryData
}

/**
 * Compact, field-level analytics banner shown atop the tournament Field tab.
 *
 * Surfaces the Analytics Engine's aggregate view of the assembled field — an
 * average overall rating plus a few headline metrics — so the hub answers "how
 * strong is this field?" at a glance. It renders only the entrants the engine
 * could actually rate (`ratedPlayers`) and shows an honest note when coverage
 * is partial or absent, never inventing an aggregate from missing data.
 */
export function FieldAnalyticsSummary({ summary }: FieldAnalyticsSummaryProps) {
  // Nothing computable — every entrant lacks season data. Stay silent rather
  // than render an empty scorecard, so the roster below is the honest content.
  if (summary.ratedPlayers === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
          Field analytics aren&apos;t available yet — none of the entrants have
          season statistics imported for the current season.
        </p>
      </div>
    )
  }

  const averageBand = summary.averageBand
  const coverageNote =
    summary.ratedPlayers < summary.totalPlayers
      ? `${summary.ratedPlayers} of ${summary.totalPlayers} entrants rated`
      : `all ${summary.totalPlayers} entrants rated`

  return (
    <section
      aria-label="Field analytics summary"
      className="rounded-lg border border-border bg-card"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">Field strength</h3>
          <p className="text-xs text-muted-foreground">
            {coverageNote}
            {summary.season !== null ? ` · ${summary.season} season` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span className="text-2xl font-semibold tabular-nums leading-none">
            {scoreText(summary.averageRating)}
          </span>
          {averageBand ? (
            <span className={cn('text-xs font-medium', BAND_TONE[averageBand])}>
              {BAND_LABEL[averageBand]}
            </span>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-4">
        {summary.metrics.map((metric) => (
          <div key={metric.key} className="flex flex-col gap-0.5">
            <dt className="truncate text-xs text-muted-foreground" title={metric.label}>
              {metric.label}
            </dt>
            <dd className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  'text-base font-semibold tabular-nums leading-none',
                  metric.band ? BAND_TONE[metric.band] : 'text-muted-foreground',
                )}
              >
                {scoreText(metric.value)}
              </span>
              {metric.band ? (
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {BAND_LABEL[metric.band]}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      <p className="border-t border-border px-4 py-2 text-[11px] leading-relaxed text-muted-foreground text-pretty">
        Averaged from each entrant&apos;s Analytics Engine profile, normalized
        against the season field. Ratings blend season standing, world-ranking
        movement, and fantasy production — the same figures shown on player
        pages.
      </p>
    </section>
  )
}
