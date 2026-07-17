'use client'

import { Info, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { FieldStrengthAnalysis } from '@/features/tournaments/utils/tournament-elevation'

interface FieldStrengthCardProps {
  analysis: FieldStrengthAnalysis
  className?: string
}

/**
 * Field Strength Card - comprehensive field quality breakdown.
 * Shows rating, metrics, and strategic implications of the tournament field.
 */
export function FieldStrengthCard({ analysis, className }: FieldStrengthCardProps) {
  const ratingColors: Record<typeof analysis.rating, string> = {
    elite: 'bg-green-500/10 text-green-700 dark:text-green-400',
    strong: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    regular: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    weak: 'bg-red-500/10 text-red-700 dark:text-red-400',
  }

  const ratingBadgeVariants: Record<typeof analysis.rating, 'default' | 'secondary' | 'outline'> = {
    elite: 'default',
    strong: 'secondary',
    regular: 'outline',
    weak: 'outline',
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" aria-hidden />
          <CardTitle>Field Strength</CardTitle>
        </div>
        <Badge variant={ratingBadgeVariants[analysis.rating]} className="capitalize">
          {analysis.rating}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Score Display */}
        <div className={cn('rounded-lg p-4', ratingColors[analysis.rating])}>
          <div className="text-sm font-medium opacity-75">Field Quality Score</div>
          <div className="text-3xl font-bold tabular-nums">{analysis.scoreOutOf100}/100</div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">{analysis.description}</p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {analysis.avgOwgr !== undefined && (
            <div className="rounded border border-border bg-card/50 p-2">
              <div className="text-xs font-medium text-muted-foreground">Avg OWGR</div>
              <div className="text-sm font-semibold">{analysis.avgOwgr.toFixed(1)}</div>
            </div>
          )}
          {analysis.topFiftyPercent !== undefined && (
            <div className="rounded border border-border bg-card/50 p-2">
              <div className="text-xs font-medium text-muted-foreground">Top 50</div>
              <div className="text-sm font-semibold">{analysis.topFiftyPercent}%</div>
            </div>
          )}
        </div>

        {/* Strategic Implication */}
        <div className="flex gap-2 rounded-lg bg-blue-500/5 p-3">
          <Info className="size-4 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden />
          <p className="text-xs text-muted-foreground">
            {analysis.rating === 'elite'
              ? 'Elite field means favorites are more likely to perform. Play chalk in cash; leverage contrarian plays in GPP.'
              : analysis.rating === 'strong'
                ? 'Strong field offers balanced opportunities. Mix chalk with value plays; avoid extreme fades.'
                : 'Regular field creates variance. Exploit GPP leverage; play conservative cash.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
