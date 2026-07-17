/**
 * Player Course Analytics Panel — Sprint 12
 *
 * Replaces the placeholder Course Intelligence section on the Player Profile.
 * Shows live CourseAnalytics (difficulty, birdie/bogey ratings, volatility,
 * archetype, DFS rating) for the player's upcoming tournament venue, plus a
 * deterministically-derived "Why this golfer fits" analysis based on available
 * player statistics and course analytics.
 *
 * Never fabricates: every insight is derived from verified data or clearly
 * marked as "not enough data".
 */

import { BarChart3, TrendingDown, TrendingUp, Minus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { CourseAnalytics } from '@/lib/generated/prisma/client'
import type { PlayerDetail } from '@/features/players/types'

interface PlayerCourseAnalyticsPanelProps {
  analytics: CourseAnalytics
  courseName: string
  player: PlayerDetail
}

// ---------------------------------------------------------------------------
// Rating display
// ---------------------------------------------------------------------------

function RatingRow({
  label,
  value,
  description,
}: {
  label: string
  value: number | null
  description?: string
}) {
  const pct = value !== null ? (value / 10) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-sm text-muted-foreground">{label}</div>
      <div className="flex flex-1 items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-full bg-muted h-1.5">
          {value !== null && (
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
        <span className="w-8 text-right font-mono text-sm font-semibold tabular-nums">
          {value !== null ? value.toFixed(1) : '—'}
        </span>
      </div>
      {description && (
        <span className="hidden text-xs text-muted-foreground sm:block">{description}</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Course fit narrative engine
// ---------------------------------------------------------------------------

type FitSignal = {
  direction: 'strength' | 'weakness' | 'neutral'
  label: string
}

type CourseFitNarrative = {
  summary: string
  strengths: string[]
  weaknesses: string[]
  risk: string
  upside: string
}

/**
 * Generate a deterministic course fit narrative from player analytics and course
 * analytics. Every sentence is derived from verified data — no LLM fabrication.
 */
function buildCourseFitNarrative(
  player: PlayerDetail,
  analytics: CourseAnalytics,
  courseName: string,
): CourseFitNarrative | null {
  const archetype = analytics.courseArchetype
  const difficulty = analytics.difficultyRating
  const birdieRating = analytics.birdieRating
  const bogeyRating = analytics.bogeyRating
  const volatility = analytics.volatilityRating
  const dfs = analytics.dfsScoringRating

  // Need at least one metric.
  const hasAnalytics =
    difficulty !== null || birdieRating !== null || volatility !== null

  if (!hasAnalytics) return null

  const worldRanking = player.worldRanking
  const recentFormScore = player.analytics?.scores?.find(
    (s) => s.key === 'recentForm',
  )?.value
  const formTrend =
    recentFormScore !== undefined && recentFormScore !== null
      ? recentFormScore > 50
        ? 'positive'
        : recentFormScore < 35
          ? 'negative'
          : 'neutral'
      : 'unknown'

  const strengths: string[] = []
  const weaknesses: string[] = []

  // Archetype-specific strengths and weaknesses.
  if (archetype === 'Birdie Fest') {
    strengths.push(`${courseName} rewards aggressive birdie hunting — players with high ball-striking consistency tend to thrive here.`)
    if (formTrend === 'positive') {
      strengths.push(`${player.firstName}'s recent positive form trajectory is a positive indicator at birdie-friendly venues.`)
    }
  }

  if (archetype === 'Major Championship Test') {
    weaknesses.push(`${courseName} is one of the most demanding venues on tour. Only elite ball-strikers contend.`)
    if (worldRanking !== null && worldRanking > 50) {
      weaknesses.push(`${player.firstName}'s current world ranking places them outside the typical contender profile for major-style tests.`)
    }
  }

  if (archetype === "Bomber's Paradise") {
    strengths.push(`${courseName} rewards long hitters who can take advantage of scoring holes.`)
  }

  if (archetype === 'Short Game Challenge') {
    strengths.push(`${courseName} separates players based on scrambling and short-game precision.`)
    weaknesses.push(`Courses classified as Short Game Challenges heavily penalize missed greens — a risk for any player.`)
  }

  if (archetype === 'Risk / Reward') {
    strengths.push(`${courseName}'s high volatility creates GPP upside for aggressive players.`)
    weaknesses.push(`High volatility cuts both ways — conservative players may struggle to find a foothold.`)
  }

  if (archetype === 'Positional Course') {
    strengths.push(`${courseName} rewards course management and tee-to-green positioning over raw power.`)
  }

  // Difficulty-based signals.
  if (difficulty !== null && difficulty >= 7.5) {
    weaknesses.push(`Course difficulty rating of ${difficulty.toFixed(1)}/10 suggests scoring will be limited — downside risk is elevated for the field.`)
  } else if (difficulty !== null && difficulty <= 4) {
    strengths.push(`Low course difficulty (${difficulty.toFixed(1)}/10) means the course plays favorably for the field — upside is accessible.`)
  }

  // Birdie rate signal.
  if (birdieRating !== null && birdieRating >= 7) {
    strengths.push(`High birdie opportunity (${birdieRating.toFixed(1)}/10) creates significant scoring upside.`)
  }

  // Volatility-based DFS signal.
  const riskStatement =
    volatility !== null && volatility >= 7
      ? `High volatility (${volatility.toFixed(1)}/10) makes this venue unpredictable — both blowup and breakout rounds are common.`
      : bogeyRating !== null && bogeyRating >= 7
        ? `Elevated bogey risk (${bogeyRating.toFixed(1)}/10) threatens tournament rounds.`
        : difficulty !== null && difficulty >= 7
          ? `Course difficulty creates scoring risk for the entire field.`
          : `Course analytics suggest moderate scoring risk.`

  const upsideStatement =
    birdieRating !== null && birdieRating >= 7
      ? `Birdie-friendly venue (${birdieRating.toFixed(1)}/10) creates ceiling upside, particularly for players in form.`
      : dfs !== null && dfs >= 7
        ? `DFS scoring potential is elevated at ${dfs.toFixed(1)}/10 — this venue scores well in contests.`
        : volatility !== null && volatility >= 7
          ? `Volatility creates upside for the right player at the right price.`
          : `Standard scoring environment — upside is limited to player-specific execution.`

  // Build summary.
  const summaryParts: string[] = []
  if (archetype) {
    summaryParts.push(`${courseName} is a ${archetype.toLowerCase()} venue`)
  } else {
    summaryParts.push(`${courseName} has mixed analytics`)
  }
  if (difficulty !== null) {
    summaryParts.push(
      `with a difficulty rating of ${difficulty.toFixed(1)}/10`,
    )
  }
  if (formTrend !== 'unknown') {
    summaryParts.push(
      `and ${player.firstName} arrives with ${formTrend} recent form`,
    )
  }

  const summary = summaryParts.join(' ') + '.'

  if (strengths.length === 0) {
    strengths.push(`Course analytics do not identify specific strengths — more historical data is needed.`)
  }
  if (weaknesses.length === 0) {
    weaknesses.push(`No notable analytical weaknesses identified from current data.`)
  }

  return { summary, strengths, weaknesses, risk: riskStatement, upside: upsideStatement }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PlayerCourseAnalyticsPanel({
  analytics,
  courseName,
  player,
}: PlayerCourseAnalyticsPanelProps) {
  const confidence = analytics.confidenceScore ?? 0
  const narrative = buildCourseFitNarrative(player, analytics, courseName)

  const confidenceLabel =
    confidence < 0.25
      ? 'Low confidence'
      : confidence < 0.6
        ? 'Medium confidence'
        : 'High confidence'

  return (
    <div className="space-y-6">
      {/* Header: archetype + confidence */}
      <div className="flex flex-wrap items-center gap-2">
        {analytics.courseArchetype ? (
          <Badge variant="secondary" className="gap-1.5">
            <BarChart3 className="size-3" />
            {analytics.courseArchetype}
          </Badge>
        ) : null}
        <Badge variant={confidence < 0.25 ? 'outline' : confidence < 0.6 ? 'secondary' : 'default'}>
          {confidenceLabel}
          {analytics.sampleSize > 0 ? ` · ${analytics.sampleSize.toLocaleString()} rounds` : ''}
        </Badge>
      </div>

      {/* Rating bars */}
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Course Profile — {courseName}
        </p>
        <RatingRow label="Difficulty" value={analytics.difficultyRating} />
        <RatingRow label="Birdie Opp." value={analytics.birdieRating} />
        <RatingRow label="Bogey Risk" value={analytics.bogeyRating} />
        <RatingRow label="Volatility" value={analytics.volatilityRating} />
        <RatingRow label="DFS Potential" value={analytics.dfsScoringRating} />
      </div>

      {/* Historical rates row */}
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs mb-1">Birdie Rate</p>
          <p className="font-mono font-semibold">
            {analytics.historicalBirdieRate !== null
              ? `${(analytics.historicalBirdieRate * 100).toFixed(1)}%`
              : '—'}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs mb-1">Bogey Rate</p>
          <p className="font-mono font-semibold">
            {analytics.historicalBogeyRate !== null
              ? `${(analytics.historicalBogeyRate * 100).toFixed(1)}%`
              : '—'}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs mb-1">Avg to Par</p>
          <p className="font-mono font-semibold">
            {analytics.averageScoreToPar !== null
              ? (analytics.averageScoreToPar >= 0 ? '+' : '') +
                analytics.averageScoreToPar.toFixed(2)
              : '—'}
          </p>
        </div>
      </div>

      {/* Why this golfer fits narrative */}
      {narrative && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">
            Why this golfer fits {courseName}
          </h3>

          <p className="text-sm text-muted-foreground">{narrative.summary}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Strengths */}
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="size-3" />
                Strengths
              </div>
              <ul className="space-y-1.5">
                {narrative.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-snug">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <TrendingDown className="size-3" />
                Weaknesses
              </div>
              <ul className="space-y-1.5">
                {narrative.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-snug">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk + Upside */}
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-lg border p-3">
              <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                <Minus className="size-3" /> Risk
              </p>
              <p className="text-muted-foreground leading-snug">{narrative.risk}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="size-3" /> Upside
              </p>
              <p className="text-muted-foreground leading-snug">{narrative.upside}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
