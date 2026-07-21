'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingDown, Wind, CloudRain } from 'lucide-react'

interface RiskFactor {
  name: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  impact: string
}

interface RiskAssessment {
  overallRisk: 'critical' | 'high' | 'medium' | 'low'
  riskScore: number
  topRisks: RiskFactor[]
  weatherRisks: string[]
  concentrationRisks: string[]
  contraryRisks: string[]
  mitigationStrategies: string[]
}

interface RiskAssessmentPanelProps {
  assessment: RiskAssessment
}

export function RiskAssessmentPanel({ assessment }: RiskAssessmentPanelProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-700 border-red-500/30'
      case 'high':
        return 'bg-orange-500/20 text-orange-700 border-orange-500/30'
      case 'medium':
        return 'bg-amber-500/20 text-amber-700 border-amber-500/30'
      case 'low':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getRiskMeterColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-green-600'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Risk Assessment</CardTitle>
            <CardDescription>Analysis of potential downside scenarios</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
            <p className={`text-3xl font-bold ${getRiskMeterColor(assessment.riskScore)}`}>
              {assessment.riskScore}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Risk */}
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Overall Risk Level</p>
            <Badge variant={assessment.overallRisk === 'low' ? 'default' : 'destructive'}>
              {assessment.overallRisk.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Top Risks */}
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Top Risk Factors
          </h4>
          <div className="space-y-2">
            {assessment.topRisks.map((risk, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(risk.severity)}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-sm">{risk.name}</p>
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {risk.severity}
                  </Badge>
                </div>
                <p className="text-xs mb-1">{risk.description}</p>
                <p className="text-xs font-medium">Impact: {risk.impact}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Risks */}
        {assessment.weatherRisks.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Wind className="w-4 h-4" />
              Weather Risks
            </h4>
            <ul className="space-y-1">
              {assessment.weatherRisks.map((risk, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex gap-2 items-start">
                  <span className="text-amber-600 mt-0.5">⚠</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concentration Risks */}
        {assessment.concentrationRisks.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Concentration Risks
            </h4>
            <ul className="space-y-1">
              {assessment.concentrationRisks.map((risk, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex gap-2 items-start">
                  <span className="text-red-600 mt-0.5">✕</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mitigation Strategies */}
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <h4 className="font-semibold text-sm mb-2">Mitigation Strategies</h4>
          <ul className="space-y-1">
            {assessment.mitigationStrategies.map((strategy, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex gap-2 items-start">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{strategy}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
