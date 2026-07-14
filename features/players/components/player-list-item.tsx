import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CountryFlag } from '@/features/players/components/country-flag'
import { PlayerHeadshot } from '@/features/players/components/player-headshot'
import { PlayerStatusBadge } from '@/features/players/components/player-status-badge'
import { RecentForm } from '@/features/players/components/recent-form'
import type { Player } from '@/features/players/types'
import { tourShortLabel } from '@/features/players/utils/format'

interface PlayerListItemProps {
  player: Player
}

/** Row layout for the player directory's list view. */
export function PlayerListItem({ player }: PlayerListItemProps) {
  return (
    <Card size="sm" className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="hidden w-10 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground sm:block">
            #{player.worldRanking}
          </span>
          <PlayerHeadshot player={player} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={`/players/${player.id}`}
              className="truncate font-medium tracking-tight outline-none hover:underline focus-visible:underline"
            >
              {player.fullName}
            </Link>
            <CountryFlag nationality={player.nationality} showName />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{tourShortLabel(player.tour)}</Badge>
          <PlayerStatusBadge status={player.status} />
        </div>

        <div className="hidden lg:flex lg:w-44 lg:justify-end">
          <RecentForm form={player.recentForm} limit={5} />
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`View ${player.fullName}'s profile`}
          nativeButton={false}
          render={
            <Link href={`/players/${player.id}`}>
              <ArrowUpRight />
            </Link>
          }
        />
      </CardContent>
    </Card>
  )
}
