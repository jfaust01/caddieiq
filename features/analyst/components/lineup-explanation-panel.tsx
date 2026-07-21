'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Zap } from 'lucide-react'

interface LineupExplanation {
  lineupName: string
  totalSalary: number
  salaryCap: number
  projectedPoints: number
  ownership: number
  exposure: number
  grade: string
  balance: string
  strengths: string[]
  weaknesses: string[]
  pivots: string[]
}

interface LineupExplanationPanelProps {
  lineup: LineupExplanation
}

export function LineupExplanationPanel({ lineup }: LineupExplanationPanelProps) {
  const salaryUsage = (lineup.totalSalary / lineup.salaryCap) * 100
  const gradeColor =
    lineup.grade === 'A'
      ? 'text-green-600'
      : lineup.grade === 'B'
        ? 'text-blue-600'
        : lineup.grade === 'C'
          ? 'text-amber-600'
          : 'text-red-600'

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{lineup.lineupName}</CardTitle>
            <CardDescription>
              ${lineup.totalSalary.toLocaleString()} / ${lineup.salaryCap.toLocaleString()} ({salaryUsage.toFixed(1)}%)
            </CardDescription>
          </div>
          <div className={`text-4xl font-bold ${gradeColor}`}>{lineup.grade}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground mb-1">Projected</p>
            <p className="text-lg font-semibold">{lineup.projectedPoints.toFixed(1)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground mb-1">Avg Ownership</p>
            <p className="text-lg font-semibold">{(lineup.ownership * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground mb-1">Exposure</p>
            <p className="text-lg font-semibold">{(lineup.exposure * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Lineup Balance */}
        <div className="p-3 rounded-lg bg-muted border border-border">
          <p className="font-semibold text-sm mb-2">Roster Balance</p>
          <p className="text-sm text-muted-foreground">{lineup.balance}</p>
        </div>

        {/* Strengths */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Strengths
          </h4>
          <ul className="space-y-1">
            {lineup.strengths.map((strength, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex gap-2 items-start">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        {lineup.weaknesses.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Potential Weaknesses
            </h4>
            <ul className="space-y-1">
              {lineup.weaknesses.map((weakness, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex gap-2 items-start">
                  <span className="text-amber-600 mt-0.5">⚠</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Pivots */}
        {lineup.pivots.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Pivot Ideas
            </h4>
            <ul className="space-y-1">
              {lineup.pivots.map((pivot, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex gap-2 items-start">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>{pivot}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
