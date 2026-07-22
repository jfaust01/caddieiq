'use client'

import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDkTotal } from '@/features/tournaments/utils/format'

interface TopDkScorerCardProps {
  topDkScorer: {
    playerId: string
    playerName: string
    headshotUrl: string | null
    dkFantasyPoints: number
  } | null
  className?: string
}

/**
 * Top DK Scorer Card - displays the player with the highest actual DraftKings
 * fantasy points for the tournament, including their headshot and points total.
 */
export function TopDkScorerCard({ topDkScorer, className }: TopDkScorerCardProps) {
  const formattedPoints = topDkScorer ? formatDkTotal(topDkScorer.dkFantasyPoints) : '—'
  
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
        <Trophy className="size-5 text-primary" aria-hidden />
        <CardTitle>Top DK Scorer</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {topDkScorer ? (
          <>
            {/* Player with Headshot or Initials */}
            <div className="flex items-center gap-3">
              {topDkScorer.headshotUrl ? (
                <img
                  src={topDkScorer.headshotUrl}
                  alt={topDkScorer.playerName}
                  className="size-10 rounded-full object-cover bg-muted"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {topDkScorer.playerName
                    .split(' ')
                    .slice(0, 2)
                    .map(name => name[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <div className="text-sm font-semibold text-foreground">{topDkScorer.playerName}</div>
                <div className="text-xs text-muted-foreground tabular-nums">{formattedPoints} DK</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-3xl font-bold text-muted-foreground">—</div>
        )}
      </CardContent>
    </Card>
  )
}
