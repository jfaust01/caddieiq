import Link from 'next/link'
import { Info, Target } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PlayerCourseFit } from '@/features/players/types'
import type { FitBand, FitConfidence, FitSignal } from '@/lib/analytics/course-fit'

interface CourseFitCardProps {
  fit: PlayerCourseFit | null
}

/** Visual tone per fit band — semantic tokens only, no new colors. */
const BAND_STYLES: Record<FitBand, { label: string; chip: string }> = {
  STRONG: { label: 'Strong fit', chip: 'bg-success/15 text-success border-success/20' },
  ABOVE_AVERAGE: { label: 'Above average', chip: 'bg-primary/15 text-primary border-primary/20' },
  AVERAGE: { label: 'Average', chip: 'bg-muted text-muted-foreground border-border' },
  BELOW_AVERAGE: {
    label: 'Below average',
    chip: 'bg-muted text-muted-foreground border-border',
  },
  WEAK: { label: 'Weak fit', chip: 'bg-destructive/15 text-destructive border-destructive/20' },
}

const CONFIDENCE_LABEL: Record<FitConfidence, string> = {
  none: 'No data',
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
}

/** Reason copy for an unavailable signal. */
const REASON_LABEL: Record<NonNullable<FitSignal['reason']>, string> = {
  'course-demand-missing': 'Course demand not yet mapped',
  'player-skill-missing': 'Player skill not yet measured',
  'both-missing': 'Course demand and player skill not yet available',
}

/** Rounded 0–100 score for display, or an em-dash when unavailable. */
function scoreDisplay(value: number | null): string {
  return value === null ? '\u2014' : `${Math.round(value)}`
}

/**
 * Human label for the event the fit was computed against. Course Fit is only
 * ever computed for a verified upcoming entry, so this is always "Next start".
 */
const CONTEXT_LABEL = 'Next start'

/**
 * Course Fit card. Surfaces the {@link PlayerCourseFit} computed by the Course
 * Fit Model for the venue of the player's next verified **upcoming** tournament.
 * When there is no such context (`fit` is `null`), it shows a neutral placeholder
 * rather than a fit derived from a past event. It is scrupulously honest: when no
 * signal can be scored — the case today, since the platform ingests no per-skill
 * player data — it shows the model's real confidence and explains exactly which
 * inputs are missing rather than inventing a fit number. It lights up
 * automatically as course demand and player skill data arrive.
 */
export function CourseFitCard({ fit }: CourseFitCardProps) {
  // No scheduled or historical event with a linked course to evaluate against.
  if (!fit) {
    return (
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4 text-primary" aria-hidden />
            Course Fit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="text-pretty">
              Course Fit becomes available when this player has a verified upcoming tournament with a
              linked host course. It is not calculated from past events, and nothing here is
              estimated.
            </span>
          </p>
        </CardContent>
      </Card>
    )
  }

  const { context, result } = fit
  const band = result.band
  const bandStyle = band ? BAND_STYLES[band] : null

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="size-4 text-primary" aria-hidden />
          Course Fit
        </CardTitle>
        <Badge variant="outline">
          {result.coverage.scored} / {result.coverage.total} signals
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Context: which event/course this fit is for */}
        <p className="text-xs text-muted-foreground text-pretty">
          {CONTEXT_LABEL} ·{' '}
          <Link
            href={`/courses/${context.courseId}`}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            {context.courseName}
          </Link>
        </p>

        {/* Headline score, labelled with the upcoming tournament it is for */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Fit score · {context.tournamentName}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tabular-nums">
                {scoreDisplay(result.score)}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
              {bandStyle ? (
                <Badge className={cn('border', bandStyle.chip)}>{bandStyle.label}</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Not enough data
                </Badge>
              )}
            </div>
          </div>
          <span className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground/70">
            {CONFIDENCE_LABEL[result.confidence]}
          </span>
        </div>

        {/* Plain-language summary from the model — never fabricated */}
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{result.summary}</p>

        {/* Drivers — what moved a scored fit */}
        {result.drivers.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What drives this fit
            </span>
            <ul className="flex flex-col gap-1.5">
              {result.drivers.map((driver) => (
                <li key={driver.key} className="flex items-start gap-2 text-sm">
                  <span
                    className={cn(
                      'mt-1.5 size-1.5 shrink-0 rounded-full',
                      driver.direction === 'positive' ? 'bg-success' : 'bg-destructive',
                    )}
                    aria-hidden
                  />
                  <span className="text-pretty text-muted-foreground">{driver.rationale}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Missing signals — explicit about the gaps */}
        {result.missing.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Not yet scored
            </span>
            <ul className="flex flex-col divide-y divide-border">
              {result.missing.map((signal) => (
                <li key={signal.key} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-sm text-muted-foreground">{signal.label}</span>
                  <span className="text-xs text-muted-foreground/70 text-right text-pretty">
                    {signal.reason ? REASON_LABEL[signal.reason] : 'Unavailable'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="text-pretty">
            {
              'A skill is only scored when both the course demand and the player skill are verified. The composite blends scored signals by demand weight; unscored ones are listed above and never guessed.'
            }
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
