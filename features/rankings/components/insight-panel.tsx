'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/shared/section-header'

import type { RankingInsight } from '../types'
import { InsightCard } from './insight-card'

interface InsightPanelProps {
  insights: RankingInsight[]
  isLoading: boolean
  onSelectPlayer: (playerId: string) => void
}

function InsightSkeleton() {
  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-6 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

/** The insight panel: a responsive grid of summary cards. */
export function InsightPanel({
  insights,
  isLoading,
  onSelectPlayer,
}: InsightPanelProps) {
  return (
    <section aria-labelledby="insights-heading" className="flex flex-col gap-4">
      <SectionHeader
        title="Insights"
        description="Automatically surfaced storylines from the current board."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <InsightSkeleton key={index} />
            ))
          : insights.map((insight) => (
              <InsightCard
                key={insight.kind}
                insight={insight}
                onSelectPlayer={onSelectPlayer}
              />
            ))}
      </div>
    </section>
  )
}
