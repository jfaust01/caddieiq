'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BettingMetric {
  /** Label (e.g., "Outright", "Top 10"). */
  label: string
  /** Placeholder or actual odds (e.g., "+800", "8/1"). */
  odds?: string
  /** Optional recommendation or value assessment. */
  assessment?: string
  /** Confidence level. */
  confidence?: 'high' | 'medium' | 'low'
}

export interface BettingPanelProps {
  title?: string
  /** Array of betting markets (Outright, Top 5, Top 10, Top 20, Make Cut). */
  metrics: BettingMetric[]
  /** Optional disclaimer text. */
  disclaimer?: string
  /** Additional CSS classes. */
  className?: string
}

/**
 * Placeholder panel displaying betting markets and value assessments.
 * Used for Outright, Top 5/10/20, Make Cut, etc.
 */
export function BettingPanel({
  title = 'Betting Value',
  metrics,
  disclaimer = 'Odds are placeholders pending integration with live betting data feeds.',
  className,
}: BettingPanelProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground pt-1">
          Placeholder betting markets
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
            >
              <span className="text-sm font-medium">{metric.label}</span>
              {metric.odds ? (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-amber-600">
                    {metric.odds}
                  </span>
                  {metric.confidence && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        metric.confidence === 'high' && 'bg-success/10 text-success border-success/20',
                        metric.confidence === 'medium' && 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                        metric.confidence === 'low' && 'bg-muted text-muted-foreground border-border',
                      )}
                    >
                      {metric.confidence === 'high' ? 'Strong' : metric.confidence === 'medium' ? 'Partial' : 'Weak'}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Data pending
                </div>
              )}
              {metric.assessment && (
                <p className="text-xs text-muted-foreground leading-tight">
                  {metric.assessment}
                </p>
              )}
            </div>
          ))}
        </div>

        {disclaimer && (
          <div className="flex gap-2 mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <AlertCircle className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {disclaimer}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
