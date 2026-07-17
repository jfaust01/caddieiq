'use client'

import { AlertTriangle, Info, Shield } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RiskFactor } from '@/features/tournaments/utils/tournament-elevation'

interface RiskFactorsCardProps {
  risks: RiskFactor[]
  className?: string
}

/**
 * Risk Factors Card - key risks to monitor for the tournament.
 * Identifies threats and provides mitigation strategies.
 */
export function RiskFactorsCard({ risks, className }: RiskFactorsCardProps) {
  if (!risks || risks.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Shield className="size-5 text-primary" aria-hidden />
          <CardTitle>Risk Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No major risks identified for this tournament.</p>
        </CardContent>
      </Card>
    )
  }

  const severityColor = (severity: number) => {
    if (severity >= 4) return 'bg-red-500/10 text-red-700 dark:text-red-400'
    if (severity >= 3) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
    return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
  }

  const severityBadge = (severity: number): 'default' | 'secondary' | 'destructive' => {
    if (severity >= 4) return 'destructive'
    if (severity >= 3) return 'secondary'
    return 'outline'
  }

  const categoryIcon = (category: RiskFactor['category']) => {
    switch (category) {
      case 'weather':
        return '⛈️'
      case 'field':
        return '👥'
      case 'course':
        return '⛳'
      default:
        return '⚠️'
    }
  }

  const sortedRisks = [...risks].sort((a, b) => b.severity - a.severity)

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <AlertTriangle className="size-5 text-primary" aria-hidden />
        <CardTitle>Risk Factors</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {sortedRisks.map((risk, idx) => (
          <div key={idx} className={cn('rounded-lg border p-3', severityColor(risk.severity))}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-start gap-2 flex-1">
                <span className="text-lg mt-0.5">{categoryIcon(risk.category)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{risk.name}</div>
                  <div className="text-xs opacity-75 mt-1">{risk.description}</div>
                </div>
              </div>
              <Badge variant={severityBadge(risk.severity)}>
                {risk.severity === 5
                  ? 'Critical'
                  : risk.severity === 4
                    ? 'High'
                    : risk.severity === 3
                      ? 'Med'
                      : 'Low'}
              </Badge>
            </div>

            {/* Mitigation Strategy */}
            <div className="mt-2 pl-8 text-xs">
              <span className="font-medium opacity-75">Mitigation: </span>
              <span className="opacity-75">{risk.mitigation}</span>
            </div>
          </div>
        ))}

        {/* Summary */}
        {sortedRisks.length > 0 && (
          <div className="flex gap-2 rounded-lg bg-blue-500/5 p-3">
            <Info className="size-4 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden />
            <p className="text-xs text-muted-foreground">
              Monitor these {sortedRisks.length} {sortedRisks.length === 1 ? 'risk' : 'risks'} closely. Build flexibility into your lineups to adjust if conditions change.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
