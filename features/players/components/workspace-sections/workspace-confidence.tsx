'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gauge } from 'lucide-react'
import type { PlayerAnalytics } from '@/lib/analytics/types'

interface WorkspaceConfidenceProps {
  analytics: PlayerAnalytics
}

export function WorkspaceConfidence({ analytics }: WorkspaceConfidenceProps) {
  // Calculate confidence from data quality signals
  let confidence = 50

  // Count high-confidence scores
  const highConfScores = analytics.scores.filter(s => s.confidence === 'high').length
  confidence += highConfScores * 5

  // Count available scores
  const availableScores = analytics.scores.filter(s => s.value !== null).length
  confidence += Math.min(availableScores * 3, 20)

  confidence = Math.min(100, confidence)

  const confidenceColor =
    confidence >= 75
      ? 'text-green-600 dark:text-green-400'
      : confidence >= 50
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gauge className={`w-5 h-5 ${confidenceColor}`} />
          <CardTitle>Decision Confidence</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className={`text-3xl font-bold ${confidenceColor}`}>{confidence}%</div>
          <p className="text-xs text-muted-foreground mt-1">Based on data completeness</p>
        </div>

        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              confidence >= 75
                ? 'bg-green-600 dark:bg-green-400'
                : confidence >= 50
                  ? 'bg-yellow-600 dark:bg-yellow-400'
                  : 'bg-red-600 dark:bg-red-400'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>

        <div className="text-xs space-y-1 text-muted-foreground">
          {analytics.overallRating && <p>✓ Overall Rating available</p>}
          <p>✓ {availableScores} metrics with data</p>
          <p>✓ {highConfScores} high-confidence scores</p>
        </div>
      </CardContent>
    </Card>
  )
}
