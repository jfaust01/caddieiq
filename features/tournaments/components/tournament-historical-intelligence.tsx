'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataWithProvenance } from '@/components/data-provenance/data-with-provenance'
import { History, TrendingDown, TrendingUp } from 'lucide-react'

interface HistoricalData {
  lastWinners: Array<{
    year: number
    winner: string
    score: number
    payoutPercentage: number
  }>
  winningScores: {
    average: number
    trend: 'improving' | 'declining' | 'stable'
    best: number
    worst: number
  }
  cutLines: {
    average: number
    trend: 'improving' | 'declining' | 'stable'
    best: number
    worst: number
  }
  averageScores: {
    round1: number
    round2: number
    round3: number
    round4: number
  }
  scoringStats: {
    birdieRate: number
    bogeyRate: number
    eagleRate: number
    doubleBogeySaved: number
  }
}

interface TournamentHistoricalIntelligenceProps {
  historicalData: HistoricalData | null
  yearsAnalyzed?: number
}

export function TournamentHistoricalIntelligence({
  historicalData,
  yearsAnalyzed = 5,
}: TournamentHistoricalIntelligenceProps) {
  if (!historicalData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="size-5" />
            <CardTitle>Historical Intelligence</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Historical data unavailable - this tournament venue may be new or data has not synced
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="size-5" />
          <CardTitle>Historical Intelligence</CardTitle>
          <span className="text-xs text-muted-foreground">({yearsAnalyzed}-year analysis)</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recent Winners */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Recent Winners</h3>
          <div className="space-y-2">
            {historicalData.lastWinners.map((winner) => (
              <div key={winner.year} className="flex items-center justify-between text-sm py-1">
                <div>
                  <div className="font-medium">{winner.winner}</div>
                  <div className="text-xs text-muted-foreground">{winner.year}</div>
                </div>
                <DataWithProvenance
                  value={winner.score}
                  status="REAL_DATABASE"
                  source={{ name: 'Tournament Results', table: 'tournament_results' }}
                  format={(v) => `${v > 0 ? '+' : ''}${v}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Winning Scores Trend */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Winning Scores</div>
            <div className="space-y-2">
              <DataWithProvenance
                label="Average"
                value={historicalData.winningScores.average}
                status="CALCULATED"
                source={{ name: 'Historical Results', formula: 'mean(winning_scores)' }}
                format={(v) => `${v > 0 ? '+' : ''}${v}`}
              />
              <div className={`text-xs flex items-center gap-1 ${
                historicalData.winningScores.trend === 'improving' ? 'text-green-600' : 
                historicalData.winningScores.trend === 'declining' ? 'text-red-600' : 
                'text-muted-foreground'
              }`}>
                {historicalData.winningScores.trend === 'improving' ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {historicalData.winningScores.trend}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Cut Lines</div>
            <div className="space-y-2">
              <DataWithProvenance
                label="Average"
                value={historicalData.cutLines.average}
                status="CALCULATED"
                source={{ name: 'Historical Results', formula: 'mean(cut_lines)' }}
                format={(v) => `${v > 0 ? '+' : ''}${v}`}
              />
              <div className={`text-xs flex items-center gap-1 ${
                historicalData.cutLines.trend === 'improving' ? 'text-green-600' : 
                historicalData.cutLines.trend === 'declining' ? 'text-red-600' : 
                'text-muted-foreground'
              }`}>
                {historicalData.cutLines.trend === 'improving' ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {historicalData.cutLines.trend}
              </div>
            </div>
          </div>
        </div>

        {/* Scoring Statistics */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Scoring Statistics</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <DataWithProvenance
              label="Birdie Rate"
              value={`${historicalData.scoringStats.birdieRate.toFixed(1)}%`}
              status="CALCULATED"
              source={{ name: 'Player Scores', formula: 'birdies / total_holes' }}
            />
            <DataWithProvenance
              label="Bogey Rate"
              value={`${historicalData.scoringStats.bogeyRate.toFixed(1)}%`}
              status="CALCULATED"
              source={{ name: 'Player Scores', formula: 'bogeys / total_holes' }}
            />
            <DataWithProvenance
              label="Eagle Rate"
              value={`${historicalData.scoringStats.eagleRate.toFixed(1)}%`}
              status="CALCULATED"
              source={{ name: 'Player Scores', formula: 'eagles / total_holes' }}
            />
            <DataWithProvenance
              label="Avg Round"
              value={historicalData.averageScores.round1.toFixed(1)}
              status="CALCULATED"
              source={{ name: 'Player Scores', formula: 'mean(round_scores)' }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
