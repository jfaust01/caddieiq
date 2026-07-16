'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'
import type { PlayerAnalytics } from '@/lib/analytics/types'
import type { Explanation } from '@/lib/explainability'

interface WorkspaceStrengthsProps {
  analytics: PlayerAnalytics
  explanation?: Explanation
}

export function WorkspaceStrengths({ analytics, explanation }: WorkspaceStrengthsProps) {
  const strengths: string[] = []

  // Extract strengths from highest-scoring metrics
  const topScores = analytics.scores
    .filter(s => s.value !== null && (s.value ?? 0) > 65)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 3)

  for (const score of topScores) {
    if (score.label) {
      strengths.push(`Strong ${score.label.toLowerCase()}`)
    }
  }

  if (strengths.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          <CardTitle>Strengths</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {strengths.map((strength, idx) => (
            <Badge key={idx} variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
              {strength}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
