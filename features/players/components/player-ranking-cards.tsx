import { Trophy } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ordinal } from '@/features/players/utils/format'
import type { AnalyticsBand, AnalyticsConfidence } from '@/lib/analytics/types'
import type { PlayerRankingProfile, RankingEntry } from '@/lib/rankings/types'
import { cn } from '@/lib/utils'

interface PlayerRankingCardsProps {
  profile: PlayerRankingProfile
}

/**
 * Tone per band, reusing the analytics band vocabulary so a ranking card reads
 * with the same color language as the score it came from. No new colors.
 */
const BAND_TONE: Record<AnalyticsBand, { grade: string; chip: string }> = {
  ELITE: { grade: 'text-success', chip: 'border-success/20 bg-success/10 text-success' },
  STRONG: { grade: 'text-primary', chip: 'border-primary/20 bg-primary/10 text-primary' },
  SOLID: { grade: 'text-primary', chip: 'border-primary/15 bg-primary/5 text-primary' },
  AVERAGE: { grade: 'text-foreground', chip: 'border-border bg-muted text-muted-foreground' },
  DEVELOPING: { grade: 'text-muted-foreground', chip: 'border-border bg-muted text-muted-foreground' },
}

const BAND_LABEL: Record<AnalyticsBand, string> = {
  ELITE: 'Elite',
  STRONG: 'Strong',
  SOLID: 'Solid',
  AVERAGE: 'Average',
  DEVELOPING: 'Developing',
}

const CONFIDENCE_LABEL: Record<AnalyticsConfidence, string> = {
  none: 'No data',
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
}

/**
 * A single ranking card: the category, its letter grade + 0–100 score, the
 * qualitative band, the player's rank within the field, and the confidence the
 * grade carries. Falls back to an honest "unranked" state when the player has
 * no score in the category rather than inventing a placement.
 */
function RankingCard({ entry }: { entry: RankingEntry }) {
  const ranked = entry.rank !== null && entry.band !== null && entry.grade !== null

  if (!ranked) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3">
        <span className="text-xs font-medium tracking-tight text-muted-foreground">
          {entry.shortLabel}
        </span>
        <span className="text-2xl font-semibold leading-none text-muted-foreground">{'\u2014'}</span>
        <span className="text-[11px] text-muted-foreground">Unranked</span>
      </div>
    )
  }

  const band = entry.band as AnalyticsBand
  const tone = BAND_TONE[band]

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium tracking-tight text-muted-foreground text-pretty">
          {entry.shortLabel}
        </span>
        <Badge variant="outline" className={cn('h-5 border px-1.5 text-[10px]', tone.chip)}>
          {BAND_LABEL[band]}
        </Badge>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={cn('text-3xl font-semibold leading-none tracking-tight', tone.grade)}>
          {entry.grade}
        </span>
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {Math.round(entry.score as number)}
          <span className="text-xs">/100</span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">
          {ordinal(entry.rank as number)}{' '}
          <span className="font-normal text-muted-foreground">of {entry.totalRanked}</span>
        </span>
        <span>{CONFIDENCE_LABEL[entry.confidence]}</span>
      </div>
    </div>
  )
}

/**
 * CaddieIQ ranking cards for the player's Analytics tab — the platform's
 * official "opinion layer". Surfaces where the player places across every
 * Ranking Engine category (Overall, Recent Form, Fantasy, Consistency, Season),
 * as a letter grade + rank against every player with data in the current
 * season. The grades come directly from the Ranking Engine, which orders the
 * SAME analytics detailed below — never a parallel calculation — so a card can
 * never disagree with the ratings on this page. When the player has no season
 * data the engine returns an unranked profile and this panel says so honestly
 * rather than inventing a placement.
 */
export function PlayerRankingCards({ profile }: PlayerRankingCardsProps) {
  if (!profile.isRanked) return null

  const denominator = profile.entries.find((entry) => entry.totalRanked > 0)?.totalRanked ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-4 text-muted-foreground" aria-hidden />
          CaddieIQ Rankings
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {profile.entries.map((entry) => (
            <RankingCard key={entry.category} entry={entry} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-pretty">
          Graded against {denominator} players with
          {profile.season === null ? '' : ` ${profile.season}`} season data, ordered by the analytics
          below. Letter grades reflect standing among peers, so a median score grades around a C.
        </p>
      </CardContent>
    </Card>
  )
}
