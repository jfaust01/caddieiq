import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CountryFlag } from '@/features/players/components/country-flag'
import { PlayerHeadshot } from '@/features/players/components/player-headshot'
import { PlayerStatusBadge } from '@/features/players/components/player-status-badge'
import { RecentForm } from '@/features/players/components/recent-form'
import type { PlayerDetail } from '@/features/players/types'
import { handednessLabel, tourLabel } from '@/features/players/utils/format'

interface PlayerHeaderProps {
  player: PlayerDetail
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  )
}

/** Profile header: identity, key facts, and recent form. */
export function PlayerHeader({ player }: PlayerHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        nativeButton={false}
        render={
          <Link href="/players">
            <ChevronLeft data-icon="inline-start" />
            All players
          </Link>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <PlayerHeadshot player={player} size="lg" className="size-16" />
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-balance">
                  {player.fullName}
                </h1>
                <PlayerStatusBadge status={player.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <CountryFlag nationality={player.nationality} showName />
                <span aria-hidden>•</span>
                <Badge variant="outline">{tourLabel(player.tour)}</Badge>
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground">
                  Recent form
                </span>
                <RecentForm form={player.recentForm} />
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Fact label="World Rank" value={`#${player.worldRanking}`} />
            <Fact label="Age" value={`${player.age}`} />
            <Fact label="Turned Pro" value={`${player.turnedPro}`} />
            <Fact label="Plays" value={handednessLabel(player.handedness)} />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
