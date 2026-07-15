import { Trophy } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ordinal } from '@/features/players/utils/format'
import type { AnalyticsBand } from '@/lib/analytics/types'
import type { PlayerRankingProfile, RankingEntry } from '@/lib/rankings/types'
import { cn } from '@/lib/utils'

interface PlayerRankingBadgesProps {
  profile: PlayerRankingProfile
}

/**
 * Tone per band, reusing the analytics band vocabulary so a ranking badge
 * reads with the same color language as the score it came from. No new colors.
 */
const BAND_TONE: Record<AnalyticsBand, string> = {
  ELITE: 'border-success/25 bg-success/10 text-success',
  STRONG: 'border-primary/25 bg-primary/10 text-primary',
  SOLID: 'border-primary/15 bg-primary/5 text-primary',
  AVERAGE: 'border-border bg-muted text-muted-foreground',
  DEVELOPING: 'border-border bg-muted text-muted-foreground',
}

/** A single ranking badge: category, the player's position, and the field size. */
function RankingBadge({ entry }: { entry: RankingEntry }) {
  const ranked = entry.rank !== null && entry.band !== null
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-lg border p-3',
        ranked ? BAND_TONE[entry.band as AnalyticsBand] : 'border-border bg-muted/40 text-muted-foreground',
      )}
    >
      <span className="text-xs font-medium tracking-tight opacity-90">{entry.shortLabel}</span>
      {ranked ? (
        <>
          <span className="text-xl font-semibold tabular-nums leading-none">
            {ordinal(entry.rank as number)}
          </span>
          <span className="text-[11px] opacity-80">of {entry.totalRanked} ranked</span>
        </>
      ) : (
        <>
          <span className="text-xl font-semibold leading-none">{'\u2014'}</span>
          <span className="text-[11px]">Unranked</span>
        </>
      )}
    </div>
  )
}

/**
 * Ranking badges for the player's Analytics tab. Surfaces where the player
 * places across the Ranking Engine's categories (Overall, Recent Form,
 * Fantasy, Consistency, Season), ranked against every player with data in the
 * current season. The ranks come directly from the Ranking Engine, which orders
 * the same analytics shown below — never a parallel calculation — so a badge
 * can never disagree with the ratings on this page. When the player has no
 * season data the engine returns an unranked profile and this panel says so
 * honestly rather than inventing a position.
 */
export function PlayerRankingBadges({ profile }: PlayerRankingBadgesProps) {
  if (!profile.isRanked) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-4 text-muted-foreground" aria-hidden />
          Rankings
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {profile.entries.map((entry) => (
            <RankingBadge key={entry.category} entry={entry} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-pretty">
          Position among {profile.entries[0]?.totalRanked ?? 0} players with
          {profile.season === null ? '' : ` ${profile.season}`} season data,
          ordered by the analytics below.
        </p>
      </CardContent>
    </Card>
  )
}
