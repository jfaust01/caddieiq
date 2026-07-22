'use client'

import { Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDkTotal } from '@/features/tournaments/utils/format'

interface DkTotalCardProps {
  dkTotal: number | null
  className?: string
}

/**
 * DK Total Card - displays the sum of all DraftKings fantasy points for the tournament.
 * Compact summary showing aggregate player fantasy points across the entire field.
 */
export function DkTotalCard({ dkTotal, className }: DkTotalCardProps) {
  const formattedValue = formatDkTotal(dkTotal)

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
        <Zap className="size-5 text-primary" aria-hidden />
        <CardTitle>DK Total</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <div className="text-3xl font-bold tabular-nums text-foreground">{formattedValue}</div>
        <p className="text-xs text-muted-foreground">Sum of all player fantasy points</p>
      </CardContent>
    </Card>
  )
}
