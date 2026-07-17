'use client'

import { Lightbulb, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PremiumInsight } from '@/features/tournaments/utils/tournament-elevation'

interface PremiumInsightsListProps {
  insights: PremiumInsight[]
  className?: string
}

/**
 * Premium Insights List - 5-10 expert observations about the tournament.
 * Highlights key strategic themes and actionable takeaways.
 */
export function PremiumInsightsList({ insights, className }: PremiumInsightsListProps) {
  if (!insights || insights.length === 0) {
    return null
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Lightbulb className="size-5 text-primary" aria-hidden />
        <CardTitle>Premium Insights</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex gap-3 rounded-lg border border-border bg-card/50 p-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">{insight.title}</div>
                <p className="text-xs text-muted-foreground mt-1">{insight.insight}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    How to apply
                  </Badge>
                  <p className="text-xs text-muted-foreground">{insight.application}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
