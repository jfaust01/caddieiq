import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CountryFlag } from '@/features/players/components/country-flag'
import { PlayerHeadshot } from '@/features/players/components/player-headshot'
import { PlayerStatusBadge } from '@/features/players/components/player-status-badge'
import { RecentForm } from '@/features/players/components/recent-form'
import type { Player } from '@/features/players/types'
import { tourShortLabel, worldRankDisplay } from '@/features/players/utils/format'

interface PlayerCardProps {
  player: Player
}

/** Grid card for the player directory. */
export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <Card className="justify-between transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlayerHeadshot player={player} size="lg" />
            <div className="flex flex-col gap-1">
              <Link
                href={`/players/${player.id}`}
                className="font-medium tracking-tight outline-none hover:underline focus-visible:underline"
              >
                {player.fullName}
              </Link>
              <CountryFlag nationality={player.nationality} showName />
            </div>
          </div>
          <PlayerStatusBadge status={player.status} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5 rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">World Rank</span>
            <span className="text-lg font-semibold tabular-nums">
              {worldRankDisplay(player.worldRanking)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">Tour</span>
            <span className="flex h-7 items-center">
              <Badge variant="outline">{tourShortLabel(player.tour)}</Badge>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Recent form</span>
          <RecentForm form={player.recentForm} limit={5} />
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          nativeButton={false}
          render={
            <Link href={`/players/${player.id}`}>
              View profile
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          }
        />
      </CardFooter>
    </Card>
  )
}
