'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

interface PlayerExplanation {
  playerName: string
  rank: number
  salary: number
  projectedPoints: number
  ownership: number
  confidence: 'high' | 'medium' | 'low'
  reasons: string[]
  risks: string[]
  weatherFit: string
  courseHistory: string
}

interface PlayerExplanationPanelProps {
  player: PlayerExplanation
}

export function PlayerExplanationPanel({ player }: PlayerExplanationPanelProps) {
  const valueScore = player.projectedPoints / (player.salary / 1000)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{player.playerName}</CardTitle>
            <CardDescription>
              Rank #{player.rank} | Salary: ${(player.salary / 1000).toFixed(1)}k
            </CardDescription>
          </div>
          <Badge
            variant={
              player.confidence === 'high' ? 'default' : player.confidence === 'medium' ? 'secondary' : 'outline'
            }
          >
            {player.confidence.toUpperCase()} CONFIDENCE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground mb-1">Projected</p>
            <p className="text-lg font-semibold">{player.projectedPoints.toFixed(1)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground mb-1">Ownership</p>
            <p className="text-lg font-semibold">{(player.ownership * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground mb-1">Value</p>
            <p className="text-lg font-semibold">{valueScore.toFixed(2)}pts/$k</p>
          </div>
        </div>

        {/* Why This Player */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Why {player.playerName}?</h4>
          <ul className="space-y-1">
            {player.reasons.map((reason, idx) => (
              <li key={idx} className="text-sm flex gap-2 items-start">
                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weather & Course Fit */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-border">
            <p className="font-semibold text-sm mb-1">Weather Fit</p>
            <p className="text-xs text-muted-foreground">{player.weatherFit}</p>
          </div>
          <div className="p-3 rounded-lg border border-border">
            <p className="font-semibold text-sm mb-1">Course History</p>
            <p className="text-xs text-muted-foreground">{player.courseHistory}</p>
          </div>
        </div>

        {/* Risks */}
        {player.risks.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Risks to Consider
            </h4>
            <ul className="space-y-1">
              {player.risks.map((risk, idx) => (
                <li key={idx} className="text-sm flex gap-2 items-start">
                  <TrendingDown className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
