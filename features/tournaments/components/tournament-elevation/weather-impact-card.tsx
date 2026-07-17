'use client'

import { Cloud, Droplets, Info, Wind } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { WeatherImpactAnalysis } from '@/features/tournaments/utils/tournament-elevation'

interface WeatherImpactCardProps {
  analysis: WeatherImpactAnalysis
  className?: string
}

/**
 * Weather Impact Card - how today's conditions change player value and strategy.
 * Explains the impact of wind, temperature, and moisture on gameplay.
 */
export function WeatherImpactCard({ analysis, className }: WeatherImpactCardProps) {
  const scoringColor =
    analysis.scoringShift < -1
      ? 'text-red-600 dark:text-red-400'
      : analysis.scoringShift < -0.3
        ? 'text-amber-600 dark:text-amber-400'
        : analysis.scoringShift > 0.5
          ? 'text-green-600 dark:text-green-400'
          : 'text-foreground'

  const windColor =
    analysis.windImpactFactor > 1.3
      ? 'bg-red-500/10 text-red-700 dark:text-red-400'
      : analysis.windImpactFactor > 1.1
        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
        : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Cloud className="size-5 text-primary" aria-hidden />
          <CardTitle>Weather Impact</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Scoring Environment Impact */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-xs font-medium text-muted-foreground">Scoring Shift</div>
            <div className={cn('text-lg font-bold tabular-nums', scoringColor)}>
              {analysis.scoringShift > 0 ? '+' : ''}
              {analysis.scoringShift.toFixed(1)} strokes
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {analysis.scoringShift < -1
                ? 'Much tougher scoring'
                : analysis.scoringShift < -0.3
                  ? 'Slightly tougher'
                  : analysis.scoringShift > 0.5
                    ? 'Scoring boost'
                    : 'Neutral conditions'}
            </div>
          </div>

          <div className={cn('rounded-lg p-3', windColor)}>
            <div className="text-xs font-medium opacity-75">Wind Impact</div>
            <div className="text-lg font-bold tabular-nums">
              {(analysis.windImpactFactor * 100).toFixed(0)}%
            </div>
            <div className="text-xs opacity-75 mt-1">
              {analysis.windImpactFactor > 1.3
                ? 'Major factor'
                : analysis.windImpactFactor > 1.1
                  ? 'Moderate'
                  : 'Minor'}
            </div>
          </div>
        </div>

        {/* Affected Skills */}
        {analysis.affectedSkills.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">Skills Most Affected:</div>
            <div className="flex flex-wrap gap-2">
              {analysis.affectedSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="capitalize">
                  {skill.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Adjustments */}
        <div className="flex flex-col gap-2">
          {analysis.adjustments.length > 0 && (
            <div className="flex gap-2 rounded-lg bg-amber-500/5 p-3">
              <Droplets className="size-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden />
              <div className="flex flex-col gap-1">
                <div className="text-xs font-medium text-muted-foreground">Strategy Adjustments:</div>
                {analysis.adjustments.map((adj, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    • {adj}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="flex gap-2 rounded-lg bg-blue-500/5 p-3">
          <Info className="size-4 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden />
          <p className="text-xs text-muted-foreground">
            {analysis.scoringShift < -1
              ? 'Expect lower scoring and increased importance of accuracy and consistency.'
              : analysis.scoringShift < -0.3
                ? 'Slightly tougher scoring environment. Prioritize proven players.'
                : analysis.scoringShift > 0.5
                  ? 'Favorable scoring conditions. Elite players can gain separation.'
                  : 'Neutral conditions. Standard strategy applies.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
