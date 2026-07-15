'use client'

import { Trophy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import type { ModelPreview } from '../types'

interface RankingPreviewProps {
  preview: ModelPreview
  isLoading?: boolean
  className?: string
}

/**
 * Right-panel live preview: the Top-N ranking the model's weights produce over
 * the real season population. Ordering and scores come straight from the
 * Analytics Engine, so there is nothing mock to caveat.
 */
export function RankingPreview({
  preview,
  isLoading = false,
  className,
}: RankingPreviewProps) {
  const { rows, season, ratedPlayers } = preview

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="size-4 text-muted-foreground" aria-hidden />
          Ranking preview
        </CardTitle>
        {season !== null ? (
          <Badge variant="secondary">{season} season</Badge>
        ) : null}
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
          <p className="px-3 py-6 text-center text-sm text-muted-foreground text-pretty">
            Enable at least one metric pillar to preview the ranking it produces.
          </p>
        ) : (
          <>
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
                  <span className="flex-1 truncate font-medium">
                    {row.name}
                    {row.countryCode ? (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground tabular-nums">
                        {row.countryCode}
                      </span>
                    ) : null}
                  </span>
                  <Badge variant="outline" className="tabular-nums">
                    {row.grade}
                  </Badge>
                  <span className="w-9 text-right font-semibold tabular-nums">
                    {row.score}
                  </span>
                </li>
              ))}
            </ol>
            <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground">
              Top {rows.length} of {ratedPlayers} ranked players
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
