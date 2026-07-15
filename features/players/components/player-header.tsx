import { ChevronLeft, ArrowDown, ArrowUp, Minus } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CountryFlag } from '@/features/players/components/country-flag'
import { PlayerHeadshot } from '@/features/players/components/player-headshot'
import { PlayerStatusBadge } from '@/features/players/components/player-status-badge'
import { RecentForm } from '@/features/players/components/recent-form'
import type { PlayerDetail } from '@/features/players/types'
import {
  handednessLabel,
  numberDisplay,
  rankMovementDisplay,
  tourLabel,
  worldRankDisplay,
} from '@/features/players/utils/format'
import { cn } from '@/lib/utils'

interface PlayerHeaderProps {
  player: PlayerDetail
}

function Fact({
  label,
  value,
  movement,
}: {
  label: string
  value: string
  movement?: { current: number | null; previous: number | null }
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5 text-sm font-medium tabular-nums">
        {value}
        {movement ? (
          <RankMovement current={movement.current} previous={movement.previous} />
        ) : null}
      </dd>
    </div>
  )
}

/**
 * Weekly world-ranking movement, computed from real provider data
 * (`worldRanking` vs `worldRankingLastWeek`). A lower ranking number is better,
 * so a positive delta is an improvement (up, success). Renders nothing when
 * either side is missing — never a fabricated zero.
 */
function RankMovement({
  current,
  previous,
}: {
  current: number | null
  previous: number | null
}) {
  const label = rankMovementDisplay(current, previous)
  if (label === '—') return null

  const isEven = label === 'even'
  const isUp = label.startsWith('+')
  const Icon = isEven ? Minus : isUp ? ArrowUp : ArrowDown

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold',
        isEven && 'text-muted-foreground',
        !isEven && isUp && 'text-success',
        !isEven && !isUp && 'text-destructive',
      )}
      title={
        isEven
          ? 'No change from last week'
          : `${isUp ? 'Up' : 'Down'} ${label.replace(/[+-]/, '')} from last week`
      }
    >
      <Icon className="size-3" aria-hidden />
      <span className="sr-only">
        {isEven
          ? 'No change from last week'
          : `${isUp ? 'Up' : 'Down'} ${label.replace(/[+-]/, '')} spots from last week`}
      </span>
      {!isEven ? <span aria-hidden>{label.replace(/[+-]/, '')}</span> : null}
    </span>
  )
}

/** Profile header: identity, key facts, and recent form. */
export function PlayerHeader({ player }: PlayerHeaderProps) {
  // Prefer the player's own world ranking; otherwise fall back to the most
  // recent imported season ranking (both are real provider data — never fabricated).
  const rankedSeason = player.seasonStatistics.find((s) => s.worldRanking !== null)
  const worldRanking = player.worldRanking ?? rankedSeason?.worldRanking ?? null
  // Weekly movement is only meaningful when the displayed rank comes from the
  // same season row that carries last week's rank.
  const worldRankingLastWeek =
    player.worldRanking === null || player.worldRanking === rankedSeason?.worldRanking
      ? rankedSeason?.worldRankingLastWeek ?? null
      : null

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
            <Fact
              label="World Rank"
              value={worldRankDisplay(worldRanking)}
              movement={{ current: worldRanking, previous: worldRankingLastWeek }}
            />
            <Fact label="Age" value={numberDisplay(player.age)} />
            <Fact label="Turned Pro" value={numberDisplay(player.turnedPro)} />
            <Fact label="Plays" value={handednessLabel(player.handedness)} />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
