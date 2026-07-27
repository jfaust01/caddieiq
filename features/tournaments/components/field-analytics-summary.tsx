import type { ComponentType } from 'react'
import { BarChart3, Clock, Shield, Star, TrendingUp, Activity } from 'lucide-react'

import type { AnalyticsBand, AnalyticsMetricKey } from '@/lib/analytics/types'
import type { FieldAnalyticsSummary as FieldAnalyticsSummaryData } from '@/lib/analytics/types'
import { cn } from '@/lib/utils'

/**
 * Premium tone per qualitative band, tuned for the dark analytics panel.
 * Strong fields lean emerald (matching the Tournament Winner card system),
 * while lower bands stay honest with muted neutrals.
 */
const BAND_TONE: Record<AnalyticsBand, string> = {
  ELITE: 'text-emerald-400',
  STRONG: 'text-emerald-300',
  SOLID: 'text-white',
  AVERAGE: 'text-white/60',
  DEVELOPING: 'text-white/50',
}

const BAND_LABEL: Record<AnalyticsBand, string> = {
  ELITE: 'Elite',
  STRONG: 'Strong',
  SOLID: 'Solid',
  AVERAGE: 'Average',
  DEVELOPING: 'Developing',
}

/** Icon per metric, keyed to the analytics engine's metric keys. */
const METRIC_ICON: Record<AnalyticsMetricKey, ComponentType<{ className?: string }>> = {
  seasonPerformance: TrendingUp,
  recentForm: Clock,
  consistency: Shield,
  fantasyProduction: Star,
  activity: Activity,
  rankingMomentum: TrendingUp,
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

  // Segmented rating bar: ~10 segments filled proportionally to the rating.
  const SEGMENTS = 10
  const filledSegments =
    summary.averageRating === null
      ? 0
      : Math.max(0, Math.min(SEGMENTS, Math.round((summary.averageRating / 100) * SEGMENTS)))

  return (
    <section
      aria-label="Field strength analytics"
      className={cn(
        'relative overflow-hidden rounded-[22px]',
        'border border-white/[0.08]',
        'bg-[#0D1318]',
        'shadow-[0_12px_40px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)]',
      )}
    >
      {/* Top accent line - emerald gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
      />
      {/* Subtle top-right glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-500/[0.06] blur-3xl"
      />
      {/* Faint radial lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_85%_-10%,rgba(16,185,129,0.05),transparent_60%)]"
      />

      <div className="relative z-10">
        {/* ---------------- HEADER ---------------- */}
        <div className="flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* LEFT: icon + title + coverage */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <BarChart3 className="size-6 text-emerald-400" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-400">
                Field Strength
              </h3>
              <p className="mt-1 text-xs text-white/50">
                {coverageNote}
                {summary.season !== null ? ` • ${summary.season} season` : ''}
              </p>
            </div>
          </div>

          {/* RIGHT: rating + band + segmented bar */}
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black leading-none tabular-nums text-white">
                {scoreText(summary.averageRating)}
              </span>
              {averageBand ? (
                <span
                  className={cn(
                    'text-sm font-bold uppercase tracking-widest',
                    BAND_TONE[averageBand],
                  )}
                >
                  {BAND_LABEL[averageBand]}
                </span>
              ) : null}
            </div>
            {/* Segmented progress bar */}
            <div
              className="flex items-center gap-1"
              role="img"
              aria-label={`Field rating ${scoreText(summary.averageRating)} out of 100`}
            >
              {Array.from({ length: SEGMENTS }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={cn(
                    'h-1.5 w-5 rounded-full transition-colors sm:w-6',
                    i < filledSegments ? 'bg-emerald-400' : 'bg-white/[0.08]',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ---------------- DIVIDER ---------------- */}
        <div className="h-px bg-white/[0.08]" />

        {/* ---------------- METRIC GRID ---------------- */}
        <dl className="grid grid-cols-2 gap-y-8 px-6 py-7 sm:grid-cols-4 sm:divide-x sm:divide-white/[0.06]">
          {summary.metrics.map((metric) => {
            const Icon = METRIC_ICON[metric.key] ?? Activity
            return (
              <div
                key={metric.key}
                className="flex flex-col items-center gap-2 px-2 text-center sm:px-4"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
                  <Icon className="size-4 text-emerald-400" />
                </div>
                <dt
                  className="text-[10px] font-medium uppercase tracking-wider text-white/50"
                  title={metric.label}
                >
                  {metric.label}
                </dt>
                <dd className="flex flex-col items-center gap-0.5">
                  <span
                    className={cn(
                      'text-4xl font-bold leading-none tabular-nums',
                      metric.band ? BAND_TONE[metric.band] : 'text-white/50',
                    )}
                  >
                    {scoreText(metric.value)}
                  </span>
                  {metric.band ? (
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/45">
                      {BAND_LABEL[metric.band]}
                    </span>
                  ) : null}
                </dd>
              </div>
            )
          })}
        </dl>

        {/* ---------------- DESCRIPTION ---------------- */}
        <div className="border-t border-white/[0.08] px-6 py-6">
          <p className="max-w-[75%] text-[11px] leading-relaxed text-white/45 text-pretty">
            Averaged from each entrant&apos;s Analytics Engine profile, normalized
            against the season field. Ratings blend season standing, world-ranking
            movement, and fantasy production — the same figures shown on player
            pages.
          </p>
        </div>
      </div>
    </section>
  )
}
