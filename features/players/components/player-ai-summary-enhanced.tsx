/**
 * Enhanced Player AI Summary — Tournament-Aware Form & Strength Analysis
 *
 * Generates a concise 3-5 sentence AI-driven summary explaining:
 * - Current form status (trending up/down/stable)
 * - Key strengths relative to this week
 * - Primary concern or red flag
 * - Overall DFS recommendation
 */

'use client'

import { TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PlayerDetail } from '@/features/players/types'
import type { CourseProfile } from '@/lib/domain/course'

interface PlayerAiSummaryEnhancedProps {
  player: PlayerDetail
  courseProfile?: CourseProfile | null
}

export function PlayerAiSummaryEnhanced({ player, courseProfile }: PlayerAiSummaryEnhancedProps) {
  const formStatus = player.analytics.form?.status || 'neutral'
  const consistency = player.analytics.consistency || 'medium'
  const volatility = player.analytics.volatility || 'medium'
  const recentForm = player.recentForm || []

  // Determine form trend
  const formTrend =
    formStatus === 'trending_up'
      ? 'improving'
      : formStatus === 'trending_down'
        ? 'declining'
        : formStatus === 'hot'
          ? 'hot'
          : formStatus === 'cold'
            ? 'cold'
            : 'stable'

  // Calculate form score based on recent finishes
  const recentFinishes = recentForm.slice(0, 5).map((f) => f.finishPosition).filter((f) => f !== null)
  const avgFinish = recentFinishes.length > 0 ? recentFinishes.reduce((a, b) => a + b) / recentFinishes.length : 50

  // Generate summary narrative
  let summary = ''
  let recommendation = ''
  let tone = 'neutral'

  if (formTrend === 'hot' && volatility === 'low') {
    summary = `${player.fullName} is playing elite golf with excellent consistency. Recent performances show a player peaking at the right time. This is a strong DFS candidate at any salary tier. The combination of hot form and low volatility makes him ideal for both cash games and tournament lineups.`
    recommendation = 'Strong Play'
    tone = 'positive'
  } else if (formTrend === 'improving' && avgFinish < 30) {
    summary = `${player.fullName} is trending in the right direction with improving course fit. Recent finishes suggest a player building toward peak performance. Look for him to contend this week. Worth considering across game types as risk/reward improves.`
    recommendation = 'Consider'
    tone = 'positive'
  } else if (formTrend === 'stable' && consistency === 'high') {
    summary = `${player.fullName} brings steady, reliable production with consistent execution. While not in a hot streak, the predictability of his game is valuable in cash formats. A solid floor with moderate ceiling makes him a secondary consideration.`
    recommendation = 'Secondary'
    tone = 'neutral'
  } else if (formTrend === 'declining' || formStatus === 'cold') {
    summary = `${player.fullName} has struggled recently with inconsistent results and missing cuts. Until form stabilizes, proceed cautiously. Consider waiting for a return to form or limit exposure to value plays only.`
    recommendation = 'Avoid / Fade'
    tone = 'negative'
  } else if (volatility === 'high') {
    summary = `${player.fullName} exhibits high volatility with a mix of excellent and poor finishes. This boom-bust pattern suits tournament formats where ceiling is prioritized over floor. Use selectively in GPPs; avoid in cash games.`
    recommendation = 'GPP Only'
    tone = 'neutral'
  } else {
    summary = `${player.fullName} presents a balanced profile with moderate form and consistency. Recent performances are competitive but not exceptional. He's a secondary candidate depending on salary and field composition.`
    recommendation = 'Secondary'
    tone = 'neutral'
  }

  const trendIcon =
    formTrend === 'hot' || formTrend === 'improving' ? (
      <TrendingUp className="size-4 text-green-500" />
    ) : formTrend === 'cold' || formTrend === 'declining' ? (
      <TrendingDown className="size-4 text-red-500" />
    ) : (
      <Zap className="size-4 text-amber-500" />
    )

  const bgColor =
    tone === 'positive' ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : tone === 'negative' ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'

  const badgeVariant =
    recommendation === 'Strong Play'
      ? 'default'
      : recommendation === 'Avoid / Fade'
        ? 'destructive'
        : 'outline'

  return (
    <Card className={`border ${bgColor}`}>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            {trendIcon}
            <span className="text-sm font-semibold capitalize">{formTrend}</span>
          </div>
          <Badge variant={badgeVariant}>{recommendation}</Badge>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Form</span>
            <p className="font-semibold capitalize">{formStatus.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Consistency</span>
            <p className="font-semibold capitalize">{consistency}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Volatility</span>
            <p className="font-semibold capitalize">{volatility}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
