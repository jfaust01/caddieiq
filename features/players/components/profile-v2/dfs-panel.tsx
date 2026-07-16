'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { TrendBadge } from './trend-badge'
import { cn } from '@/lib/utils'

export interface DfsMetric {
  /** Label (e.g., "Ownership", "Salary Cap"). */
  label: string
  /** Primary value display. */
  value: string
  /** Optional secondary description. */
  description?: string
  /** Optional trend indicator. */
  trend?: 'up' | 'down' | 'flat'
  /** Trend value if trend is set. */
  trendValue?: string
}

export interface DfsPanelProps {
  title?: string
  /** DFS metrics (Cash, GPP, Ownership, Value, Leverage, Salary Cap, Projected Points). */
  metrics: DfsMetric[]
  /** Additional CSS classes. */
  className?: string
}

/**
 * Placeholder panel for DFS (Daily Fantasy Sports) metrics.
 * Displays cash game value, GPP leverage, ownership, and related stats.
 */
export function DfsPanel({
  title = 'DFS Value',
  metrics,
  className,
}: DfsPanelProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {title}
          <Info className="size-4 text-muted-foreground opacity-50 cursor-help" />
        </CardTitle>
        <p className="text-xs text-muted-foreground pt-1">
          Daily Fantasy Sports analysis and positioning
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {metric.label}
                </span>
                {metric.trend && metric.trendValue && (
                  <TrendBadge
                    direction={metric.trend}
                    value={metric.trendValue}
                    className="text-xs"
                  />
                )}
              </div>
              <div className="text-xl font-bold">{metric.value}</div>
              {metric.description && (
                <p className="text-xs text-muted-foreground leading-tight">
                  {metric.description}
                </p>
              )}
            </div>
          ))}

          {metrics.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-8 text-sm text-muted-foreground">
              <div className="text-center">
                <Badge variant="outline" className="mb-2">
                  Data pending
                </Badge>
                <p>DFS metrics will appear when available</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            ℹ️ DFS analysis provided for informational purposes. Always verify current
            ownership, salary, and scoring rules with your DFS platform.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
