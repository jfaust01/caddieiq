import { Info } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  AnalyticsBand,
  AnalyticsConfidence,
  AnalyticsScore,
  PlayerAnalytics,
} from '@/lib/analytics/types'

interface PlayerAnalyticsPanelProps {
  analytics: PlayerAnalytics
}

/** Visual tone per band. Kept to the app's semantic tokens (no new colors). */
const BAND_STYLES: Record<
  AnalyticsBand,
  { label: string; chip: string; bar: string }
> = {
  ELITE: {
    label: 'Elite',
    chip: 'bg-success/15 text-success border-success/20',
    bar: 'bg-success',
  },
  STRONG: {
    label: 'Strong',
    chip: 'bg-primary/15 text-primary border-primary/20',
    bar: 'bg-primary',
  },
  SOLID: {
    label: 'Solid',
    chip: 'bg-primary/10 text-primary border-primary/15',
    bar: 'bg-primary/80',
  },
  AVERAGE: {
    label: 'Average',
    chip: 'bg-muted text-muted-foreground border-border',
    bar: 'bg-muted-foreground/50',
  },
  DEVELOPING: {
    label: 'Developing',
    chip: 'bg-muted text-muted-foreground border-border',
    bar: 'bg-muted-foreground/35',
  },
}

const CONFIDENCE_LABEL: Record<AnalyticsConfidence, string> = {
  none: 'No data',
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
}

/** Rounded 0–100 score for display, or an em-dash when unavailable. */
function scoreDisplay(value: number | null): string {
  return value === null ? '\u2014' : `${Math.round(value)}`
}

/** A qualitative band chip, or a muted "No data" chip when the score is null. */
function BandChip({ band }: { band: AnalyticsBand | null }) {
  if (band === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No data
      </Badge>
    )
  }
  const style = BAND_STYLES[band]
  return <Badge className={cn('border', style.chip)}>{style.label}</Badge>
}

/** A single 0–100 metric with a score bar, band, and plain-language basis. */
function MetricCard({ score }: { score: AnalyticsScore }) {
  const pct = score.value === null ? 0 : Math.max(0, Math.min(100, score.value))
  const barTone = score.band ? BAND_STYLES[score.band].bar : 'bg-muted-foreground/35'

  return (
    <Card size="sm" className="gap-0">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium tracking-tight text-pretty">{score.label}</span>
          <BandChip band={score.band} />
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">{scoreDisplay(score.value)}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={score.value === null ? undefined : Math.round(score.value)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${score.label} score`}
        >
          <div
            className={cn('h-full rounded-full transition-all', barTone)}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
          {score.description}
        </p>
        <span className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/70">
          {CONFIDENCE_LABEL[score.confidence]}
        </span>
      </CardContent>
    </Card>
  )
}

/**
 * Performance Analytics tab. Renders the player's derived analytics from the
 * Analytics Engine — a composite rating plus per-metric 0–100 scores, each
 * normalized against the current season's field. When the engine has no data
 * for the player (absent from the normalization season) it returns an empty
 * profile and this panel shows an honest "not enough data" state rather than
 * inventing scores.
 */
export function PlayerAnalyticsPanel({ analytics }: PlayerAnalyticsPanelProps) {
  if (analytics.isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-pretty">
            {analytics.season === null
              ? "Analytics become available once season statistics have been imported."
              : `We don't have enough ${analytics.season} season data for this player to compute analytics yet.`}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Independent signals (e.g. ranking momentum) are shown apart from the core
  // metrics because they are deliberately excluded from the overall rating.
  const coreScores = analytics.scores.filter((score) => !score.independent)
  const independentScores = analytics.scores.filter((score) => score.independent)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Composite headline */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Overall Rating
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tabular-nums">
                {scoreDisplay(analytics.overallRating)}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
              <BandChip band={analytics.overallBand} />
            </div>
          </div>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground text-pretty">
            Normalized against {analytics.sampleSize} ranked players
            {analytics.season === null ? '' : ` in the ${analytics.season} season`}. A blend of the
            core metrics below.
          </p>
        </div>

        {/* Core weighted metrics — these are what the Overall Rating blends. */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coreScores.map((score) => (
            <MetricCard key={score.key} score={score} />
          ))}
        </div>

        {/* Independent signals — surfaced for context, not part of the rating. */}
        {independentScores.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Independent Signals
              </span>
              <span className="text-[0.6875rem] text-muted-foreground/70">
                Context only — not part of the overall rating
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {independentScores.map((score) => (
                <MetricCard key={score.key} score={score} />
              ))}
            </div>
          </div>
        ) : null}

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="text-pretty">
            {
              'Analytics are derived from imported season data (world ranking and week-over-week movement, events played, and fantasy-point totals) and scored 0–100 relative to the field. Metrics needing shot-level data (scoring, driving, putting, approach) are omitted until that data is ingested rather than estimated. World-ranking-based scores are treated as indicative given known provider precision limits.'
            }
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
