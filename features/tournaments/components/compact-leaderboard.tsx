'use client'

import Link from 'next/link'
import { ChevronRight, Users2 } from 'lucide-react'
import type { TournamentField } from '@/features/tournaments/types'
import { generateTournamentSlug } from '@/features/tournaments/utils/slug'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const BAND_TONE: Record<string, string> = {
  ELITE: 'text-chart-1',
  STRONG: 'text-chart-2',
  SOLID: 'text-foreground',
  AVERAGE: 'text-muted-foreground',
  DEVELOPING: 'text-muted-foreground',
}

interface CompactLeaderboardProps {
  field: TournamentField
  tournamentName: string
  tournamentId: string
}

/**
 * Compact leaderboard showing top 5 players by ranking score (not live tournament scores).
 * Links to full field roster in Field tab.
 */
export function CompactLeaderboard({
  field,
  tournamentName,
  tournamentId,
}: CompactLeaderboardProps) {
  // No live tournament scores available in TournamentField type.
  // Instead, show top-ranked players from ranking leaders (field strength).
  const topPlayers = field?.rankingLeaders?.topRanked?.slice(0, 5) ?? []

  if (!topPlayers || topPlayers.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Ranked</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-8">
          <Users2 className="size-5 text-muted-foreground/50" aria-hidden />
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">No ranking data</p>
            <p className="text-xs text-muted-foreground/70">Available after field commitment</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Top Ranked</CardTitle>
          <Link
            href={`/tournaments/${generateTournamentSlug(tournamentName, tournamentId)}?tab=field`}
            className="inline-flex gap-1 h-9 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
          >
            <span>View all</span>
            <ChevronRight className="size-4 ml-auto" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {topPlayers.map((player, idx) => (
          <div key={player.playerId} className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-muted-foreground font-mono w-5 text-right">{idx + 1}.</span>
              <Link
                href={`/players/${player.playerId}`}
                className="truncate text-primary hover:underline"
              >
                {player.playerName}
              </Link>
            </div>
            <span className={cn('shrink-0 text-xs font-semibold', BAND_TONE[player.band] || 'text-foreground')}>
              {Math.round(player.score)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
