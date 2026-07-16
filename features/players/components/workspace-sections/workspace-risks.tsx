'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import type { PlayerAnalytics } from '@/lib/analytics/types'
import type { Explanation } from '@/lib/explainability'

interface WorkspaceRisksProps {
  analytics: PlayerAnalytics
  explanation?: Explanation
}

export function WorkspaceRisks({ analytics, explanation }: WorkspaceRisksProps) {
  const risks: string[] = []

  // Extract risks from limitations
  if (explanation?.limitations) {
    for (const lim of explanation.limitations.slice(0, 2)) {
      if (lim.message) {
        risks.push(lim.message)
      }
    }
  }

  // Add low-confidence or missing data as risks
  const lowConfScores = analytics.scores.filter(s => s.confidence === 'low')
  if (lowConfScores.length > 0) {
    risks.push(`${lowConfScores.length} metric${lowConfScores.length > 1 ? 's' : ''} with lower confidence`)
  }

  const missingScores = analytics.scores.filter(s => s.value === null)
  if (missingScores.length > 0) {
    risks.push(`Limited data for ${missingScores.length} metric${missingScores.length > 1 ? 's' : ''}`)
  }

  if (risks.length === 0) {
    return null
  }

  return (
    <Card className="border-red-500/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <CardTitle>Risks</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {risks.map((risk, idx) => (
            <Badge key={idx} variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
              {risk}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
