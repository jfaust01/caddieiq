'use client'

import { ArrowDown, ArrowUp, Minus, Trophy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import type { ModelPreviewRow } from '../types'

interface RankingPreviewProps {
  rows: ModelPreviewRow[]
  isLoading?: boolean
  className?: string
}

/**
 * Right-panel live preview: the Top-N mock ranking the Ranking Engine produces
 * for the model's current weights. Updates as the user tunes the builder.
 */
export function RankingPreview({
  rows,
  isLoading = false,
  className,
}: RankingPreviewProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="size-4 text-muted-foreground" aria-hidden />
          Ranking preview
        </CardTitle>
        <Badge variant="secondary">Mock</Badge>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        {isLoading ? (
          <ul className="flex flex-col gap-1" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-2 py-1.5">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-8" />
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Enable at least one metric to preview a ranking.
          </p>
        ) : (
          <ol className="flex flex-col">
            {rows.map((row) => (
              <li
                key={row.playerId}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                    row.rank <= 3
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {row.rank}
                </span>
                <span className="flex-1 truncate font-medium">{row.name}</span>
                <MovementIndicator movement={row.movement} delta={row.delta} />
                <span className="w-9 text-right font-semibold tabular-nums">
                  {row.score}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

function MovementIndicator({
  movement,
  delta,
}: {
  movement: ModelPreviewRow['movement']
  delta: number
}) {
  if (movement === 'flat' || delta === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="size-3" aria-hidden />
        <span className="sr-only">No change</span>
      </span>
    )
  }

  const isUp = movement === 'up'
  const Icon = isUp ? ArrowUp : ArrowDown
  return (
    <span
      className={cn(
        'flex items-center gap-0.5 text-xs font-medium tabular-nums',
        isUp ? 'text-success' : 'text-destructive',
      )}
    >
      <Icon className="size-3" aria-hidden />
      {Math.abs(delta)}
      <span className="sr-only">
        {isUp ? 'up' : 'down'} {Math.abs(delta)} positions
      </span>
    </span>
  )
}
