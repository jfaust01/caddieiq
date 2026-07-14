'use client'

import { cn } from '@/lib/utils'
import type { MetricRow, Tone } from '@/features/rankings/utils/format'
import { scoreTone } from '@/features/rankings/utils/format'

const TONE_TEXT: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  muted: 'text-muted-foreground',
  default: 'text-foreground',
  destructive: 'text-destructive',
}

interface MetricBreakdownProps {
  metrics: MetricRow[]
}

/**
 * Weighted per-module contribution list shown in the detail preview panel.
 * Each row shows the module label, its normalized 0-100 score, and the
 * weight applied by the active ranking type.
 */
export function MetricBreakdown({ metrics }: MetricBreakdownProps) {
  if (metrics.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No metric breakdown available for this ranking.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Score breakdown by metric">
      {metrics.map((metric) => (
        <li key={metric.key} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-foreground">{metric.label}</span>
            <span className="flex items-center gap-2 tabular-nums">
              <span className={cn('font-semibold', TONE_TEXT[scoreTone(metric.value)])}>
                {Math.round(metric.value)}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(metric.weight * 100)}%
              </span>
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="presentation"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${Math.max(2, Math.min(100, metric.value))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
