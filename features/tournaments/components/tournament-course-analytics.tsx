import { ArrowUpRight, BarChart3 } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/shared/section-header'
import type { CourseAnalytics } from '@/lib/generated/prisma/client'

interface TournamentCourseAnalyticsProps {
  analytics: CourseAnalytics
  course: { id: string; name: string }
}

/** Format a date using UTC to avoid hydration mismatch from locale-dependent formatting. */
function formatAnalyticsDate(dateOrString: Date | string): string {
  const date = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString
  if (Number.isNaN(date.getTime())) return '—'
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()
  
  return `${month} ${day}, ${year}`
}

/** Display a 0–10 rating as a colored bar with the numeric value. */
function RatingBar({ value, label }: { value: number | null; label: string }) {
  if (value === null) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">—</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted" />
      </div>
    )
  }

  const pct = (value / 10) * 100
  // Color: low = green (easy/birdie), high = red (hard/bogey) for difficulty/bogey.
  // For birdie/DFS a higher value is desirable, so we use a different palette.
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold tabular-nums">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/** Format a decimal rate (0–1) as a percentage string. */
function fmtPct(value: number | null): string {
  if (value === null) return '—'
  return `${(value * 100).toFixed(1)}%`
}

/** Format confidence (0–1) into a human label. */
function confidenceLabel(score: number | null): string {
  if (score === null || score === 0) return 'No data'
  if (score < 0.25) return 'Low'
  if (score < 0.6) return 'Medium'
  return 'High'
}

function confidenceVariant(
  score: number | null,
): 'default' | 'secondary' | 'outline' {
  if (score === null || score < 0.25) return 'outline'
  if (score < 0.6) return 'secondary'
  return 'default'
}

/**
 * Historical Course Analytics panel for the Tournament hub.
 * Shows ratings, historical rates, archetype, and confidence — all
 * derived from real SportsDataIO data, never fabricated.
 */
export function TournamentCourseAnalytics({
  analytics,
  course,
}: TournamentCourseAnalyticsProps) {
  const confidence = analytics.confidenceScore

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        as="h3"
        title="Course analytics"
        description={`Historical scoring analytics for ${course.name} derived from SportsDataIO tournament data.`}
        actions={
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            View course
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        }
      />

      {/* Header: archetype + confidence */}
      <div className="flex flex-wrap items-center gap-3">
        {analytics.courseArchetype ? (
          <Badge variant="secondary" className="gap-1.5">
            <BarChart3 className="size-3" />
            {analytics.courseArchetype}
          </Badge>
        ) : null}
        <Badge variant={confidenceVariant(confidence)}>
          {confidenceLabel(confidence)} confidence
          {analytics.sampleSize > 0
            ? ` · ${analytics.sampleSize} rounds`
            : ''}
        </Badge>
        {analytics.lastCalculated ? (
          <span className="text-xs text-muted-foreground">
            Updated {formatAnalyticsDate(analytics.lastCalculated)}
          </span>
        ) : null}
      </div>

      {/* Rating bars */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ratings
          </p>
          <RatingBar value={analytics.difficultyRating} label="Difficulty" />
          <RatingBar value={analytics.birdieRating} label="Birdie Opportunity" />
          <RatingBar value={analytics.bogeyRating} label="Bogey Risk" />
          <RatingBar value={analytics.volatilityRating} label="Volatility" />
          <RatingBar value={analytics.dfsScoringRating} label="DFS Scoring Potential" />
        </div>

        <div className="flex flex-col gap-4">
          {/* Historical averages */}
          <div className="rounded-lg border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Historical Averages
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Score to par</dt>
                <dd className="font-mono font-semibold">
                  {analytics.averageScoreToPar !== null
                    ? (analytics.averageScoreToPar >= 0 ? '+' : '') +
                      analytics.averageScoreToPar.toFixed(2)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cut line</dt>
                <dd className="font-mono font-semibold">
                  {analytics.averageCutScore !== null
                    ? (analytics.averageCutScore >= 0 ? '+' : '') +
                      analytics.averageCutScore.toFixed(1)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Birdie rate</dt>
                <dd className="font-mono font-semibold">
                  {fmtPct(analytics.historicalBirdieRate)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Bogey rate</dt>
                <dd className="font-mono font-semibold">
                  {fmtPct(analytics.historicalBogeyRate)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Eagle rate</dt>
                <dd className="font-mono font-semibold">
                  {fmtPct(analytics.historicalEagleRate)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Par difficulty breakdown (when available) */}
          {(analytics.par3Difficulty !== null ||
            analytics.par4Difficulty !== null ||
            analytics.par5Difficulty !== null) && (
            <div className="rounded-lg border p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Par Difficulty
              </p>
              <div className="flex flex-col gap-2">
                <RatingBar value={analytics.par3Difficulty} label="Par 3s" />
                <RatingBar value={analytics.par4Difficulty} label="Par 4s" />
                <RatingBar value={analytics.par5Difficulty} label="Par 5s" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
