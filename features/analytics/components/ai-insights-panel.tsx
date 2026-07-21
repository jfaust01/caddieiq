'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, AlertCircle, Database } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Insight {
  id: string
  title: string
  content: string
  sources: string[]
  confidence: number
  type: 'positive' | 'negative' | 'neutral'
}

interface AIInsightsPanelProps {
  context: string // e.g., "tournament:123", "player:456", "course:789"
  limit?: number
}

export function AIInsightsPanel({ context, limit = 3 }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [context])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/insights?context=${context}&limit=${limit}`)
      const data = await response.json()
      setInsights(data.data || [])
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <Lightbulb className="w-4 h-4 text-green-500" />
      case 'negative':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Database className="w-4 h-4 text-blue-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500/10 border-green-500/30'
    if (confidence >= 0.6) return 'bg-yellow-500/10 border-yellow-500/30'
    return 'bg-orange-500/10 border-orange-500/30'
  }

  if (loading) {
    return (
      <Card className="p-4 space-y-3">
        <Skeleton className="h-6 w-1/3" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </Card>
    )
  }

  if (insights.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <p>No insights available for this context</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        AI Insights
      </h3>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div
            key={insight.id}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${getConfidenceColor(insight.confidence)}`}
            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{insight.title}</p>
                {expandedIndex !== idx && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {insight.content}
                  </p>
                )}
              </div>
              <span className="text-xs font-medium text-muted-foreground flex-shrink-0">
                {(insight.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Expanded content */}
            {expandedIndex === idx && (
              <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                <p className="text-sm">{insight.content}</p>

                {/* Source Attribution */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold">Data Sources:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {insight.sources.map((source, idx) => (
                      <li key={idx}>{source}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Click any insight to see sources and full details
      </p>
    </Card>
  )
}
