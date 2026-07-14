import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { StatMetric } from '@/types'

const TREND_STYLES: Record<
  NonNullable<StatMetric['trend']>,
  { icon: typeof ArrowUpRight; className: string }
> = {
  up: { icon: ArrowUpRight, className: 'text-success' },
  down: { icon: ArrowDownRight, className: 'text-destructive' },
  neutral: { icon: Minus, className: 'text-muted-foreground' },
}

export function StatCard({ label, value, delta, trend, icon: Icon, hint }: StatMetric) {
  const trendConfig = trend ? TREND_STYLES[trend] : null
  const TrendIcon = trendConfig?.icon

  return (
    <Card className="gap-0 transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          {Icon ? (
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </span>
          ) : null}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </span>
          {delta && trendConfig && TrendIcon ? (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium tabular-nums',
                trendConfig.className,
              )}
            >
              <TrendIcon className="size-3.5" />
              {delta}
            </span>
          ) : null}
        </div>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
