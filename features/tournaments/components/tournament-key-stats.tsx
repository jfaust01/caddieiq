'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from '@/components/shared/section-header'
import { BarChart3 } from 'lucide-react'

interface StatCategory {
  title: string
  stats: Array<{
    label: string
    value: string | number
    unit?: string
  }>
}

interface TournamentKeyStatsProps {
  categories: StatCategory[]
}

/**
 * Key Stats — displays tour-wide golf statistics that impact player performance.
 * Shows: Driving Distance, Accuracy, GIR, Strokes Gained, Birdie %, Scrambling, etc.
 * Helps players understand which skills are most important at this course.
 */
export function TournamentKeyStats({ categories }: TournamentKeyStatsProps) {
  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <section aria-label="Key statistics">
      <SectionHeader
        title="Key Statistics"
        description="Tour-wide performance metrics for this event"
        icon={BarChart3}
      />
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{category.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.stats.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold">{stat.value}</span>
                      {stat.unit && <span className="text-xs text-muted-foreground ml-1">{stat.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
