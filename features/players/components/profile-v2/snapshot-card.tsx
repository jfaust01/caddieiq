'use client'

import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface SnapshotCardProps {
  title: string
  value: string
  /** Optional secondary label (e.g., "vs field average"). */
  label?: string
  /** Trend direction: 'up', 'down', or 'flat'. */
  trend?: 'up' | 'down' | 'flat'
  /** Trend percentage or label (e.g., "+2.3%"). */
  trendValue?: string
  /** Confidence level affecting styling. */
  confidence?: 'high' | 'medium' | 'low'
  /** Optional tooltip message. */
  tooltip?: string
  /** Additional CSS classes. */
  className?: string
}

/**
 * Reusable metric card for player analytics snapshots.
 * Displays a metric with trend indicator and optional confidence badge.
 */
export function SnapshotCard({
  title,
  value,
  label,
  trend,
  trendValue,
  confidence = 'high',
  tooltip,
  className,
}: SnapshotCardProps) {
  const confidenceColor = {
    high: 'bg-success/10 text-success border-success/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    low: 'bg-destructive/10 text-destructive border-destructive/20',
  }

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {tooltip && (
            <div title={tooltip}>
              <Info className="size-4 text-muted-foreground cursor-help" />
            </div>
          )}
        </div>
        {trend && trendValue && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold',
              trend === 'up' && 'text-success',
              trend === 'down' && 'text-destructive',
              trend === 'flat' && 'text-muted-foreground',
            )}
          >
            <TrendIcon className="size-3" />
            <span>{trendValue}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
        {confidence && (
          <Badge
            variant="outline"
            className={cn(
              'w-fit text-xs font-medium',
              confidenceColor[confidence],
            )}
          >
            {confidence === 'high' && 'Verified'}
            {confidence === 'medium' && 'Partial'}
            {confidence === 'low' && 'Unavailable'}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
