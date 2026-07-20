'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ActivePlayerIntelligence } from '@/features/players/types'

interface PlayerIntelligencePanelProps {
  intelligence: ActivePlayerIntelligence | null | undefined
}

/**
 * Formats a numeric feature value with appropriate unit/formatting.
 * Handles percentages, currency, counts, and decimal values.
 */
function formatFeatureValue(featureName: string, value: number | null, valueStr: string | null): string {
  if (valueStr !== null) {
    return valueStr
  }
  if (value === null) {
    return '—'
  }

  // Map feature names to their formatting rules
  const percentageFeatures = ['cut_percentage', 'top10pct', 'top_10_percentage']
  const currencyFeatures = ['avg_salary', 'salary_value', 'average_salary']
  const countFeatures = ['tournament_count', 'tournaments', 'events']

  if (percentageFeatures.includes(featureName)) {
    return `${(value * 100).toFixed(1)}%`
  }

  if (currencyFeatures.includes(featureName)) {
    return `$${Math.round(value).toLocaleString()}`
  }

  if (countFeatures.includes(featureName)) {
    return Math.round(value).toString()
  }

  // Default: decimal with 2 places for most metrics
  return value.toFixed(2)
}

/**
 * Renders a human-friendly feature category label.
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    tournament_stats: 'Tournament Statistics',
    fantasy: 'Fantasy Points',
    sg_metrics: 'Strokes Gained',
    calculated: 'Calculated',
  }
  return labels[category] || category
}

/**
 * Gets a confidence badge color based on the confidence level (0-100).
 */
function getConfidenceBadgeColor(confidence: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (confidence >= 90) return 'default'
  if (confidence >= 75) return 'secondary'
  if (confidence >= 50) return 'outline'
  return 'destructive'
}

/**
 * Gets a human-readable confidence label.
 */
function getConfidenceLabel(confidence: number): string {
  if (confidence >= 90) return 'High'
  if (confidence >= 75) return 'Good'
  if (confidence >= 50) return 'Fair'
  return 'Low'
}

/**
 * Groups features by category for organized display.
 */
function groupFeaturesByCategory(
  features: Array<{ featureName: string; featureCategory: string }>
): Record<string, Array<{ featureName: string; featureCategory: string }>> {
  return features.reduce(
    (acc, feature) => {
      if (!acc[feature.featureCategory]) {
        acc[feature.featureCategory] = []
      }
      acc[feature.featureCategory].push(feature)
      return acc
    },
    {} as Record<string, Array<{ featureName: string; featureCategory: string }>>
  )
}

export function PlayerIntelligencePanel({ intelligence }: PlayerIntelligencePanelProps) {
  if (!intelligence) {
    return (
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle>Player Intelligence</CardTitle>
          <CardDescription>No active intelligence build</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Player intelligence is not currently available. A build will be generated once analysis is complete.
        </CardContent>
      </Card>
    )
  }

  // Group features by category
  const grouped = groupFeaturesByCategory(intelligence.features)
  const orderedCategories = ['tournament_stats', 'fantasy', 'sg_metrics', 'calculated'].filter(
    (cat) => grouped[cat]
  )

  // Calculate freshness
  const staleDays = 30
  const calculatedDate = new Date(intelligence.calculatedAt)
  const daysSinceCalculated = Math.floor(
    (Date.now() - calculatedDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const isStale = daysSinceCalculated > staleDays

  // Format date as "MMM d, yyyy"
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedDate = dateFormatter.format(calculatedDate)

  // Format relative time
  let relativeTime: string
  if (daysSinceCalculated === 0) {
    relativeTime = 'today'
  } else if (daysSinceCalculated === 1) {
    relativeTime = '1 day ago'
  } else if (daysSinceCalculated < 7) {
    relativeTime = `${daysSinceCalculated} days ago`
  } else if (daysSinceCalculated < 30) {
    const weeks = Math.floor(daysSinceCalculated / 7)
    relativeTime = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  } else {
    const months = Math.floor(daysSinceCalculated / 30)
    relativeTime = months === 1 ? '1 month ago' : `${months} months ago`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>Player Intelligence</CardTitle>
            <CardDescription className="mt-1">
              {intelligence.completedFeatureCount} of {intelligence.featureCount} features • {intelligence.dataCompleteness}% completeness
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getConfidenceLabel(intelligence.dataCompleteness)}
            </Badge>
            {isStale && <Badge variant="secondary" className="text-xs">Stale</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metadata */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Calculated:</span> {formattedDate} ({relativeTime})
          </div>
          {isStale && <div className="text-amber-600">Data may be outdated</div>}
        </div>

        {/* Features grouped by category */}
        {orderedCategories.map((category) => (
          <div key={category}>
            <h3 className="mb-3 font-semibold text-sm">{getCategoryLabel(category)}</h3>
            <div className="grid grid-cols-2 gap-4">
              {grouped[category].map((feature) => {
                const fullFeature = intelligence.features.find((f) => f.featureName === feature.featureName)
                if (!fullFeature) return null

                return (
                  <div key={feature.featureName} className="rounded-lg border p-3 bg-slate-50">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {feature.featureName.replace(/_/g, ' ')}
                      </span>
                      <Badge
                        variant={getConfidenceBadgeColor(fullFeature.confidence)}
                        className="text-xs ml-auto"
                      >
                        {fullFeature.confidence}%
                      </Badge>
                    </div>
                    <div className="text-base font-semibold">
                      {formatFeatureValue(feature.featureName, fullFeature.featureValue, fullFeature.featureValueStr)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {fullFeature.source}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {intelligence.features.length === 0 && (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No features available in this build
          </div>
        )}
      </CardContent>
    </Card>
  )
}
