import Link from 'next/link'
import { Info, Target, TrendingDown, TrendingUp, HelpCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WhyButton } from '@/features/explainability/components/why-button'
import { toCourseFitExplanation } from '@/lib/explainability'
import type {
  FieldFitBoard as FieldFitBoardData,
  FieldFitEntry,
  FitConfidence,
} from '@/lib/analytics/course-fit'

interface FieldFitBoardProps {
  board: FieldFitBoardData
  /** Whether the event has a linked host course (drives the honest empty copy). */
  hasCourse: boolean
}

const CONFIDENCE_LABEL: Record<FitConfidence, string> = {
  none: 'No data',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

/** Rounded 0–100 value, or an em-dash when unavailable. */
function display(value: number | null): string {
  return value === null ? '\u2014' : `${Math.round(value)}`
}

type Metric = 'fit' | 'momentum' | 'uncertainty'

/** One ranked row: name (linked) + the list's headline metric. */
function FitRow({ entry, metric }: { entry: FieldFitEntry; metric: Metric }) {
  const { result } = entry
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <Link
        href={`/players/${entry.playerId}`}
        className="truncate text-sm font-medium text-foreground underline-offset-2 hover:underline"
      >
        {entry.displayName}
      </Link>
      {metric === 'fit' ? (
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums">{display(result.score)}</span>
          <WhyButton
            explanation={toCourseFitExplanation(result, {
              kind: 'player',
              id: entry.playerId,
              label: entry.displayName,
            })}
            srContext={`course fit for ${entry.displayName}`}
          />
        </span>
      ) : metric === 'momentum' ? (
        <span className="text-sm font-semibold tabular-nums">{display(entry.momentum)}</span>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          {CONFIDENCE_LABEL[result.confidence]}
        </Badge>
      )}
    </li>
  )
}

/** A single titled list column. Renders an honest empty note when no rows. */
function FitList({
  title,
  icon: Icon,
  entries,
  metric,
  emptyNote,
}: {
  title: string
  icon: typeof Target
  entries: readonly FieldFitEntry[]
  metric: Metric
  emptyNote: string
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5 text-primary" aria-hidden />
        {title}
      </h3>
      {entries.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border">
          {entries.map((entry) => (
            <FitRow key={entry.playerId} entry={entry} metric={metric} />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground/70 text-pretty">{emptyNote}</p>
      )}
    </section>
  )
}

/**
 * Field Course Fit board for the tournament hub. Ranks the field into four
 * lists using the Course Fit Model against the host course.
 *
 * Honesty: "Top Fits" and "Fades" only ever list players with a genuinely
 * computable fit — since the platform ingests no per-skill player data yet,
 * these stay empty and the board says so plainly instead of inventing an order.
 * "Trending Up" is a verified ranking-momentum read (explicitly NOT a fit
 * change), and "Most Uncertain" surfaces exactly where data is thinnest. It all
 * lights up automatically as course-demand and player-skill data arrive.
 */
export function FieldFitBoard({ board, hasCourse }: FieldFitBoardProps) {
  const { scoredPlayers, totalPlayers } = board

  const scoredEmptyNote = !hasCourse
    ? 'No host course is linked to this event yet, so fit cannot be scored.'
    : 'No player skill data is ingested yet, so no fit can be scored. This fills in automatically as data arrives.'

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="size-4 text-primary" aria-hidden />
          Course Fit — Field
        </CardTitle>
        <Badge variant="outline">
          {scoredPlayers} / {totalPlayers} scored
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <FitList
            title="Top Fits"
            icon={Target}
            entries={board.topFits}
            metric="fit"
            emptyNote={scoredEmptyNote}
          />
          <FitList
            title="Fades"
            icon={TrendingDown}
            entries={board.fades}
            metric="fit"
            emptyNote={scoredEmptyNote}
          />
          <FitList
            title="Trending Up"
            icon={TrendingUp}
            entries={board.trendingUp}
            metric="momentum"
            emptyNote="No verified ranking momentum in this field yet."
          />
          <FitList
            title="Most Uncertain"
            icon={HelpCircle}
            entries={board.mostUncertain}
            metric="uncertainty"
            emptyNote="No field members to assess yet."
          />
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="text-pretty">
            {
              'Top Fits and Fades rank only players with a computable fit (both course demand and player skill verified). Trending Up reflects verified ranking momentum — a form read, not a fit change. Nothing here is estimated.'
            }
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
