'use client'

import {
  CircleDollarSign,
  Flame,
  MapPin,
  TrendingDown,
  TrendingUp,
  Wind,
  type LucideIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CountryFlag } from '@/features/players/components/country-flag'
import { cn } from '@/lib/utils'

import type { RankingInsight, RankingInsightKind } from '../types'

const KIND_META: Record<
  RankingInsightKind,
  { icon: LucideIcon; className: string }
> = {
  risers: { icon: TrendingUp, className: 'text-success' },
  fallers: { icon: TrendingDown, className: 'text-destructive' },
  value: { icon: CircleDollarSign, className: 'text-primary' },
  form: { icon: Flame, className: 'text-warning' },
  course: { icon: MapPin, className: 'text-primary' },
  wind: { icon: Wind, className: 'text-primary' },
}

interface InsightCardProps {
  insight: RankingInsight
  onSelectPlayer: (playerId: string) => void
}

/** A single professional summary card listing the top players for a metric. */
export function InsightCard({ insight, onSelectPlayer }: InsightCardProps) {
  const { icon: Icon, className } = KIND_META[insight.kind]

  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-lg bg-muted',
              className,
            )}
          >
            <Icon className="size-4" />
          </span>
          {insight.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insight.entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No qualifying players.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {insight.entries.map((entry, index) => (
              <li key={entry.playerId}>
                <button
                  type="button"
                  onClick={() => onSelectPlayer(entry.playerId)}
                  className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="w-4 text-xs font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-foreground">
                    {entry.name}
                  </span>
                  <CountryFlag nationality={entry.nationality} />
                  <span className="w-9 text-right text-sm font-semibold tabular-nums text-foreground">
                    {entry.value}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
