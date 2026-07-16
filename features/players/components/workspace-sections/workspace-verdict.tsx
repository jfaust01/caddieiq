'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'
import type { PlayerAnalytics } from '@/lib/analytics/types'
import type { Explanation } from '@/lib/explainability'

interface WorkspaceVerdictProps {
  analytics: PlayerAnalytics
  explanation?: Explanation
}

export function WorkspaceVerdict({ analytics, explanation }: WorkspaceVerdictProps) {
  const overallRating = analytics.overallRating ?? 0
  
  // Get confidence from highest-scoring metric
  const topScore = analytics.scores.find(s => s.value !== null)
  const confidence = topScore?.confidence ?? 'medium'

  const confidenceColor =
    confidence === 'high'
      ? 'bg-green-500/15 text-green-700 dark:text-green-400'
      : confidence === 'medium'
        ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400'
        : 'bg-red-500/15 text-red-700 dark:text-red-400'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <CardTitle>Verdict</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div>
            <div className="text-4xl font-bold text-primary">{Math.round(overallRating)}</div>
            <p className="text-sm text-muted-foreground">Overall Rating</p>
          </div>
          <Badge className={confidenceColor}>
            {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
          </Badge>
        </div>

        <p className="text-sm leading-relaxed text-foreground">
          {Math.round(overallRating)} — {confidence === 'high' ? 'High confidence' : confidence === 'medium' ? 'Moderate confidence' : 'Low confidence'} assessment
        </p>
      </CardContent>
    </Card>
  )
}
