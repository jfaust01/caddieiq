'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import type { FieldLeader } from '@/features/tournaments/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TournamentTopCourseFitsProps {
  /** Real ranking data from field.rankingLeaders.topRanked */
  leaders: FieldLeader[] | undefined
}

/**
 * Course Fit component using real field ranking data only.
 *
 * Data contract:
 * - Input: leaders from field.rankingLeaders.topRanked (FieldLeader[])
 * - Source: Analytics Engine ranking calculation
 * - Fields: rank, playerId, playerName, score (0-100), band
 * - Handles: empty arrays, undefined gracefully
 * - No invented data: if leaders empty, shows honest empty state
 */
export function TournamentTopCourseFits({ leaders }: TournamentTopCourseFitsProps) {
  // Graceful empty state if no leaders
  if (!leaders || leaders.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Course Fit</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-8">
          <TrendingUp className="size-5 text-muted-foreground/50" aria-hidden />
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Field data unavailable</p>
            <p className="text-xs text-muted-foreground/70">Rankings pending</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Display top 5 leaders only
  const topFive = leaders.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Course Fit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topFive.map((leader) => (
            <div key={leader.playerId} className="flex items-center justify-between gap-2 pb-2 border-b border-border/50 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">
                  {leader.rank}
                </span>
                <Link
                  href={`/players/${leader.playerId}`}
                  className="text-sm font-medium truncate hover:underline text-foreground"
                >
                  {leader.playerName}
                </Link>
              </div>
              <div className="text-sm font-bold text-primary shrink-0">
                {leader.score}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
