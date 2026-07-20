'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { TournamentField } from '@/features/tournaments/services/tournament-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CompactLeaderboardProps {
  field: TournamentField
  tournamentId: string
}

/**
 * Compact leaderboard showing top 5 players only.
 * Links to full leaderboard in Field tab.
 */
export function CompactLeaderboard({
  field,
  tournamentId,
}: CompactLeaderboardProps) {
  const top5 = field.leaderboard.slice(0, 5)

  if (top5.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No leaderboard data available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Leaderboard</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            nativeButton={false}
            render={
              <Link href={`/tournaments/${tournamentId}?tab=field`}>
                View all
                <ChevronRight className="size-4" />
              </Link>
            }
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {top5.map((player, idx) => {
          const score = player.scoreRelativeToPar ?? 0
          const scoreDisplay = score > 0 ? `+${score}` : score === 0 ? 'E' : `${score}`
          
          return (
            <div key={player.playerId} className="flex items-center justify-between gap-2 rounded bg-muted/30 p-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground font-mono w-6 text-center">{idx + 1}.</span>
                <Link
                  href={`/players/${player.playerId}`}
                  className="truncate text-primary hover:underline"
                >
                  {player.playerName}
                </Link>
              </div>
              <span className="font-semibold text-primary shrink-0">{scoreDisplay}</span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
