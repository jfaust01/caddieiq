import Link from 'next/link'
import { CalendarClock, ChevronRight, Info, MapPin, Target } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PlayerUpcomingContext } from '@/features/players/types'
import type { CourseFitResult, FitBand, FitConfidence, FitSignal } from '@/lib/analytics/course-fit'

interface UpcomingTournamentCardProps {
  context: PlayerUpcomingContext
}

/** Visual tone per fit band — semantic tokens only, no new colors. */
const BAND_STYLES: Record<FitBand, { label: string; chip: string }> = {
  STRONG: { label: 'Strong fit', chip: 'bg-success/15 text-success border-success/20' },
  ABOVE_AVERAGE: { label: 'Above average', chip: 'bg-primary/15 text-primary border-primary/20' },
  AVERAGE: { label: 'Average', chip: 'bg-muted text-muted-foreground border-border' },
  BELOW_AVERAGE: { label: 'Below average', chip: 'bg-muted text-muted-foreground border-border' },
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

/** Context-level confidence tone. */
const CONTEXT_CONFIDENCE: Record<
  PlayerUpcomingContext['confidence'],
  { label: string; chip: string }
> = {
  verified: { label: 'Verified', chip: 'bg-success/15 text-success border-success/20' },
  partial: { label: 'Partial', chip: 'bg-primary/15 text-primary border-primary/20' },
  unavailable: { label: 'Unavailable', chip: 'bg-muted text-muted-foreground border-border' },
}

/** Rounded 0–100 score for display, or an em-dash when unavailable. */
function scoreDisplay(value: number | null): string {
  return value === null ? '\u2014' : `${Math.round(value)}`
}

/** Format an ISO date as e.g. "May 9, 2025", or null when unschedulable. */
function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Upcoming Tournament card — the player-side surface of the Tournament Context
 * Engine. It shows the player's single active (next verified upcoming) event and
 * everything downstream models derive from that shared context: a Course
 * Intelligence summary for the host course and the Course Fit computed for it,
 * with a link into the tournament hub.
 *
 * Honest by construction. The card mirrors the context's confidence:
 * - `unavailable` — the player is in no verified upcoming field. A neutral
 *   placeholder explains fit becomes available with a verified context; nothing
 *   is computed from past events.
 * - `partial` — an upcoming event with no linked host course yet. The event is
 *   shown, but Course Intelligence and Course Fit are withheld, not guessed.
 * - `verified` — the full block renders. Course Fit itself stays scrupulously
 *   honest: with no per-skill player data ingested today it reports real
 *   confidence and lists unscored signals rather than inventing a number.
 */
export function UpcomingTournamentCard({ context }: UpcomingTournamentCardProps) {
  const confidenceStyle = CONTEXT_CONFIDENCE[context.confidence]

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-primary" aria-hidden />
            Upcoming Tournament
          </CardTitle>
          <p className="text-xs text-muted-foreground">Next start · Course Fit &amp; intelligence</p>
        </div>
        <Badge className={cn('border', confidenceStyle.chip)}>{confidenceStyle.label}</Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {context.status === 'unavailable' || !context.tournament ? (
          <UnavailableState detail={context.detail} />
        ) : (
          <>
            <TournamentHeader context={context} />
            {context.courseIntelligence ? (
              <CourseIntelligenceSummary
                courseName={context.course?.name ?? null}
                headline={context.courseIntelligence.headline}
                verified={context.courseIntelligence.verified}
              />
            ) : null}
            {context.fit ? (
              <CourseFitSection fit={context.fit} />
            ) : (
              <PartialFitNote detail={context.detail} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/** The event identity row: name (links to the hub), date, and course. */
function TournamentHeader({ context }: { context: PlayerUpcomingContext }) {
  const tournament = context.tournament!
  const date = formatDate(tournament.startDate)
  return (
    <Link
      href={`/tournaments/${tournament.slug}`}
      className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-4 transition-colors hover:bg-muted"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground text-pretty">{tournament.name}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {date ? (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3" aria-hidden />
              {date}
            </span>
          ) : null}
          {context.course ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden />
              {context.course.name}
            </span>
          ) : (
            <span className="text-muted-foreground/70">Host course not yet linked</span>
          )}
        </span>
      </div>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  )
}

/** One-line Course Intelligence coverage read for the host course. */
function CourseIntelligenceSummary({
  courseName,
  headline,
  verified,
}: {
  courseName: string | null
  headline: string
  verified: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Course Intelligence{courseName ? ` · ${courseName}` : ''}
        </span>
        <span className={cn('text-sm', verified ? 'text-foreground' : 'text-muted-foreground')}>
          {headline}
        </span>
      </div>
    </div>
  )
}

/** The Course Fit sub-section for a verified context. */
function CourseFitSection({ fit }: { fit: CourseFitResult }) {
  const bandStyle = fit.band ? BAND_STYLES[fit.band] : null
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Target className="size-4 text-primary" aria-hidden />
          Course Fit
        </span>
        <Badge variant="outline">
          {fit.coverage.scored} / {fit.coverage.total} signals
        </Badge>
      </div>

      {/* Headline score */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Fit score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums">{scoreDisplay(fit.score)}</span>
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
          {CONFIDENCE_LABEL[fit.confidence]}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{fit.summary}</p>

      {fit.drivers.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What drives this fit
          </span>
          <ul className="flex flex-col gap-1.5">
            {fit.drivers.map((driver) => (
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

      {fit.missing.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Not yet scored
          </span>
          <ul className="flex flex-col divide-y divide-border">
            {fit.missing.map((signal) => (
              <li key={signal.key} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-muted-foreground">{signal.label}</span>
                <span className="text-right text-xs text-muted-foreground/70 text-pretty">
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
    </div>
  )
}

/** Partial context: event known, no host course to fit against yet. */
function PartialFitNote({ detail }: { detail: string | null }) {
  return (
    <p className="flex items-start gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span className="text-pretty">
        {detail ??
          'Course Fit becomes available once a host course is linked to this tournament.'}
      </span>
    </p>
  )
}

/** No verified upcoming context at all. */
function UnavailableState({ detail }: { detail: string | null }) {
  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span className="text-pretty">
        {detail ??
          'Course Fit becomes available when this player has a verified upcoming tournament with a linked host course. It is not calculated from past events, and nothing here is estimated.'}
      </span>
    </p>
  )
}
