'use client'

import { ChevronRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { DfsValueField } from '@/features/tournaments/services/tournament-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CompactDfsSummaryProps {
  dfsField: DfsValueField | null
  tournamentId: string
}

/**
 * Compact DFS summary showing top 5-6 value plays.
 * Links to full DFS tab.
 */
export function CompactDfsSummary({
  dfsField,
  tournamentId,
}: CompactDfsSummaryProps) {
  if (!dfsField || !dfsField.players || dfsField.players.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          DFS data not available
        </CardContent>
      </Card>
    )
  }

  // Show top 5-6 by value
  const topPlays = dfsField.players.slice(0, 6)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Value Plays</CardTitle>
          <Link
            href={`/tournaments/${tournamentId}?tab=draftkings`}
            className="inline-flex gap-1 h-9 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
          >
            <span>View all DFS</span>
            <ChevronRight className="size-4 ml-auto" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topPlays.map((player) => (
            <div
              key={player.playerId}
              className="flex items-center justify-between gap-2 rounded bg-muted/30 p-2 text-sm"
            >
              <Link
                href={`/players/${player.playerId}`}
                className="truncate text-primary hover:underline"
              >
                {player.playerName}
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                {player.valueRating !== undefined && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="size-3 text-emerald-500" />
                    <span className="font-semibold">{player.valueRating.toFixed(1)}</span>
                  </div>
                )}
                <span className="text-xs text-muted-foreground font-mono">
                  ${player.salary?.toLocaleString() ?? '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
