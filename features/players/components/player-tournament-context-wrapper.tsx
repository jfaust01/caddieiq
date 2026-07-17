/**
 * PlayerTournamentContextWrapper — Orchestrates tournament-specific insights
 * when a player is competing in an active event.
 *
 * Displays:
 * - Strategic summary (how tournament impacts player value)
 * - DFS strategy by game type
 * - Risk factors with severity indicators
 * - Overall recommendation (Strong/Moderate/Weak/Avoid)
 */

'use client'

import { AlertTriangle, CheckCircle, Info, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PlayerDetail } from '@/features/players/types'
import type { CourseProfile } from '@/lib/domain/course'
import type { WeatherIntelligence } from '@/lib/weather-intelligence'
import {
  getTournamentImpactSummary,
  computePlayerDfsStrategyForTournament,
  identifyPlayerTournamentRisks,
} from '@/features/players/utils/player-tournament-context'

interface PlayerTournamentContextWrapperProps {
  player: PlayerDetail
  courseProfile: CourseProfile | null
  weather?: WeatherIntelligence
}

export function PlayerTournamentContextWrapper({
  player,
  courseProfile,
  weather,
}: PlayerTournamentContextWrapperProps) {
  // If player doesn't have an active tournament context, return null
  if (!player.upcoming || player.upcoming.status === 'unavailable') {
    return null
  }

  const impact = getTournamentImpactSummary(player, courseProfile, weather)
  const strategy = computePlayerDfsStrategyForTournament(player, courseProfile)
  const risks = identifyPlayerTournamentRisks(player, courseProfile, weather)

  const recommendationColor: Record<string, string> = {
    strong: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    moderate: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    weak: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
    avoid: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  }

  const recommendationIcon: Record<string, React.ReactNode> = {
    strong: <CheckCircle className="size-5 text-green-600 dark:text-green-400" />,
    moderate: <Info className="size-5 text-blue-600 dark:text-blue-400" />,
    weak: <TrendingDown className="size-5 text-amber-600 dark:text-amber-400" />,
    avoid: <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />,
  }

  const recommendationLabel: Record<string, string> = {
    strong: 'Strong Play',
    moderate: 'Moderate',
    weak: 'Weak Fit',
    avoid: 'Avoid',
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tournament Context Header */}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Tournament Context</h3>
        <p className="text-sm text-muted-foreground">
          How {player.fullName} fits this week's tournament at {player.upcoming.course?.name}
        </p>
      </div>

      {/* Strategic Summary Card */}
      <Card
        className={`border ${recommendationColor[impact.recommendation]}`}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {recommendationIcon[impact.recommendation]}
              {recommendationLabel[impact.recommendation]}
            </CardTitle>
            <CardDescription>Strategic Assessment</CardDescription>
          </div>
          <Badge variant="outline">{impact.confidence} confidence</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">{impact.strategySummary}</p>
        </CardContent>
      </Card>

      {/* DFS Strategy by Game Type */}
      <Card>
        <CardHeader>
          <CardTitle>DFS Strategy by Game Type</CardTitle>
          <CardDescription>Recommended positioning for each format</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Cash Games */}
          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium">Cash Games (50/50, Double-Ups)</h4>
              <Badge
                variant={
                  strategy.cashGames.recommendation === 'primary'
                    ? 'default'
                    : strategy.cashGames.recommendation === 'secondary'
                      ? 'outline'
                      : 'destructive'
                }
              >
                {strategy.cashGames.recommendation}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{strategy.cashGames.reason}</p>
            {strategy.cashGames.targetPercentage && (
              <p className="mt-2 text-xs text-foreground">
                Target Exposure: <span className="font-semibold">{strategy.cashGames.targetPercentage}</span>
              </p>
            )}
          </div>

          {/* Single Entry */}
          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium">Single Entry Tournaments</h4>
              <Badge
                variant={
                  strategy.singleEntry.recommendation === 'primary'
                    ? 'default'
                    : strategy.singleEntry.recommendation === 'secondary'
                      ? 'outline'
                      : 'destructive'
                }
              >
                {strategy.singleEntry.recommendation}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{strategy.singleEntry.reason}</p>
            {strategy.singleEntry.ceiling && strategy.singleEntry.floor && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Ceiling: </span>
                  <span className="font-semibold">{strategy.singleEntry.ceiling}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Floor: </span>
                  <span className="font-semibold">{strategy.singleEntry.floor}</span>
                </div>
              </div>
            )}
          </div>

          {/* Large Field GPP */}
          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium">Large Field GPP</h4>
              <Badge
                variant={
                  strategy.largeFieldGpp.recommendation === 'primary'
                    ? 'default'
                    : strategy.largeFieldGpp.recommendation === 'secondary'
                      ? 'outline'
                      : 'destructive'
                }
              >
                {strategy.largeFieldGpp.recommendation}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{strategy.largeFieldGpp.reason}</p>
            {strategy.largeFieldGpp.targetPercentage && (
              <p className="mt-2 text-xs text-foreground">
                Target Exposure: <span className="font-semibold">{strategy.largeFieldGpp.targetPercentage}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Factors</CardTitle>
            <CardDescription>Potential concerns to monitor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {risks.map((risk) => {
                const severityColor = {
                  high: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
                  medium: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
                  low: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
                }

                const severityIcon = {
                  high: <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />,
                  medium: <TrendingDown className="size-4 text-amber-600 dark:text-amber-400" />,
                  low: <Info className="size-4 text-blue-600 dark:text-blue-400" />,
                }

                return (
                  <div key={risk.id} className={`rounded-lg border p-3 ${severityColor[risk.severity]}`}>
                    <div className="mb-1 flex items-center gap-2">
                      {severityIcon[risk.severity]}
                      <span className="font-medium text-sm">{risk.label}</span>
                      <Badge variant="outline" className="ml-auto">
                        {risk.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">{risk.description}</p>
                    {risk.mitigation && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold">Mitigation:</span> {risk.mitigation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
