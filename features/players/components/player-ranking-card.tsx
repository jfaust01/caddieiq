import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { PlayerRanking } from '@/features/players/types'
import { cn } from '@/lib/utils'

const MOVEMENT = {
  up: { icon: ArrowUpRight, className: 'text-success' },
  down: { icon: ArrowDownRight, className: 'text-destructive' },
  flat: { icon: Minus, className: 'text-muted-foreground' },
} as const

interface PlayerRankingCardProps {
  ranking: PlayerRanking
}

/** A single ranking row within the rankings panel. */
export function PlayerRankingCard({ ranking }: PlayerRankingCardProps) {
  const movement = MOVEMENT[ranking.movement]
  const MovementIcon = movement.icon

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{ranking.label}</span>
        <span className="text-xs text-muted-foreground">{ranking.system}</span>
      </div>

      {ranking.comingSoon ? (
        <Badge variant="secondary" className="shrink-0">
          Coming soon
        </Badge>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-lg font-semibold tabular-nums">
            {ranking.rank !== null ? `#${ranking.rank}` : '—'}
          </span>
          {ranking.delta > 0 ? (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium tabular-nums',
                movement.className,
              )}
            >
              <MovementIcon className="size-3.5" />
              {ranking.delta}
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}
