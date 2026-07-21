'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, TrendingUp, Wind, DollarSign, Users, Radar, Cloud, Zap } from 'lucide-react'
import { PageHeader, LoadingState, EmptyState } from '@/features/ui/shared'

interface SlateAnalysisReport {
  tournamentId: string
  generatedAt: Date
  sections: any
  confidence: number
  dataSources: string[]
}

export default function SlateAnalysisPage() {
  const [report, setReport] = useState<SlateAnalysisReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSlateAnalysis = async () => {
      try {
        const response = await fetch('/api/slate-analysis/current')
        if (!response.ok) {
          throw new Error('Failed to load slate analysis')
        }
        const data = await response.json()
        setReport(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSlateAnalysis()
  }, [])

  if (loading) {
    return (
      <div className="page-container py-6 md:py-8">
        <LoadingState message="Loading slate analysis..." variant="page" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <Card className="p-6 border-red-500/50 bg-red-500/5">
        <div className="flex gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-500">Unable to Load Slate Analysis</h3>
            <p className="text-sm text-foreground/70 mt-1">
              {error || 'No active tournament found for this week'}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const overview = report.sections.overview
  const courseBreakdown = report.sections.courseBreakdown
  const weatherReport = report.sections.weatherReport
  const topPlays = report.sections.topPlays
  const dfsStrategy = report.sections.dfsStrategy

  return (
    <div className="page-container space-y-6 py-6 md:py-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold">{overview.name}</h1>
            <p className="text-foreground/60 mt-1">
              {overview.location} • {overview.dates.start.toLocaleDateString()}
            </p>
          </div>
          <div className="text-right space-y-2">
            <Badge variant="outline" className="ml-auto block">
              AI Confidence: {(report.confidence * 100).toFixed(0)}%
            </Badge>
            <p className="text-xs text-foreground/50">
              Generated {new Date(report.generatedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-foreground/60">Purse</p>
            <p className="text-xl font-bold mt-1">{overview.purse}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-foreground/60">Par / Yards</p>
            <p className="text-xl font-bold mt-1">
              {overview.courseStats?.par} / {overview.courseStats?.yardage?.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-foreground/60">Projected Winner</p>
            <p className="text-xl font-bold mt-1">{overview.projectedWinningScore}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-foreground/60">Difficulty</p>
            <p className="text-xl font-bold mt-1 text-amber-400">{overview.aiTournamentDifficulty}</p>
          </Card>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 overflow-x-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="weather" className="text-xs sm:text-sm">Weather</TabsTrigger>
          <TabsTrigger value="topplays" className="text-xs sm:text-sm">Plays</TabsTrigger>
          <TabsTrigger value="strategy" className="text-xs sm:text-sm">Strategy</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs sm:text-sm">Insights</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Course Characteristics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                  <span className="text-sm text-foreground/70">Driving Importance</span>
                  <div className="flex gap-1">
                    {Array(5).fill(null).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-6 rounded ${
                          i < Math.round(courseBreakdown.importance.driving)
                            ? 'bg-blue-500'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                  <span className="text-sm text-foreground/70">Approach Play</span>
                  <div className="flex gap-1">
                    {Array(5).fill(null).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-6 rounded ${
                          i < Math.round(courseBreakdown.importance.approach)
                            ? 'bg-green-500'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                  <span className="text-sm text-foreground/70">Putting</span>
                  <div className="flex gap-1">
                    {Array(5).fill(null).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-6 rounded ${
                          i < Math.round(courseBreakdown.importance.putting)
                            ? 'bg-purple-500'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-foreground/70 mt-6 leading-relaxed">
                {courseBreakdown.aiCourseSummary}
              </p>
            </Card>

            {/* Tournament Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Historical Context</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-foreground/60">Average Winning Score</p>
                  <p className="text-2xl font-bold text-green-500">
                    {courseBreakdown.keyStatistics.averageWinningScore}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Scoring Volatility</p>
                  <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${courseBreakdown.keyStatistics.volatilityRating * 100}%` }}
                    />
                  </div>
                </div>
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-xs text-foreground/60 mb-2">Sample Size</p>
                  <p className="text-lg font-semibold">
                    {courseBreakdown.keyStatistics.sampleSize} tournaments
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* WEATHER TAB */}
        <TabsContent value="weather" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wind className="w-5 h-5" />
                <h3 className="text-lg font-bold">Hourly Forecast</h3>
              </div>
              <div className="space-y-2">
                {weatherReport.hourlyWeather.map((hour: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center pb-2 border-b border-slate-700">
                    <span className="text-sm">{hour.time}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{hour.temp}°F</p>
                      <p className="text-xs text-foreground/60">{hour.wind} {hour.direction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Wave Advantage</h3>
              <div className="space-y-3">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                  <p className="text-xs font-semibold text-blue-400 mb-1">MORNING</p>
                  <p className="text-sm">{weatherReport.morningVsAfternoon.morning.advantage}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3">
                  <p className="text-xs font-semibold text-amber-400 mb-1">AFTERNOON</p>
                  <p className="text-sm">{weatherReport.morningVsAfternoon.afternoon.advantage}</p>
                </div>
                <p className="text-sm text-foreground/70 mt-4 leading-relaxed">
                  {weatherReport.aiWeatherConclusions}
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* TOP PLAYS TAB */}
        <TabsContent value="topplays" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(topPlays).map(([key, play]: [string, any]) => {
              if (key === 'bestOverall' || key === 'highestCeiling' || key === 'mostUnderpriced') {
                return (
                  <Card key={key} className="p-4 border-green-500/30 bg-green-500/5">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-green-400 text-sm">{key.replace('best', '').replace('most', '').replace('highest', '')}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {(play.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-lg font-bold">{play.player}</p>
                    {play.salary && <p className="text-xs text-foreground/60">${play.salary}</p>}
                    <p className="text-xs text-foreground/70 mt-2 leading-snug">{play.rationale}</p>
                  </Card>
                )
              }
              return null
            })}
          </div>
        </TabsContent>

        {/* STRATEGY TAB */}
        <TabsContent value="strategy" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              DFS Strategy Breakdown
            </h3>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-sm mb-2">Cash Games</p>
                <p className="text-sm text-foreground/70">{dfsStrategy.cashStrategy.approach}</p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-2">Single Entry</p>
                <p className="text-sm text-foreground/70">{dfsStrategy.singleEntryStrategy.approach}</p>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <p className="font-semibold text-sm mb-2">Key Recommendation</p>
                <p className="text-sm text-amber-400">{dfsStrategy.leverageRecommendations}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* INSIGHTS TAB */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              AI Takeaways
            </h3>
            <div className="space-y-6">
              <div>
                <p className="font-semibold text-green-400 text-sm mb-3">Key Insights</p>
                {report.sections.aiTakeaways.fiveKeyInsights.map((insight: any, idx: number) => (
                  <div key={idx} className="flex gap-3 mb-3 p-2 rounded border border-slate-700">
                    <div className="text-green-500 text-lg mt-1">✓</div>
                    <div>
                      <p className="text-sm">{insight.insight}</p>
                      <p className="text-xs text-foreground/60 mt-1">{insight.source} • {(insight.confidence * 100).toFixed(0)}% confidence</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="font-semibold text-red-400 text-sm mb-3">Biggest Risks</p>
                {report.sections.aiTakeaways.threeBiggestRisks.map((risk: any, idx: number) => (
                  <div key={idx} className="flex gap-3 mb-3 p-2 rounded border border-slate-700">
                    <div className="text-red-500 text-lg mt-1">!</div>
                    <div>
                      <p className="text-sm">{risk.risk}</p>
                      <p className="text-xs text-foreground/60 mt-1">Mitigation: {risk.mitigation}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-700 pt-4 mt-6">
                <p className="font-semibold text-purple-400 text-sm mb-2">Bold Prediction</p>
                <p className="text-lg font-bold text-purple-400">{report.sections.aiTakeaways.boldPrediction}</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Sources Footer */}
      <Card className="p-4 bg-slate-800/50">
        <p className="text-xs text-foreground/60">
          Data Sources: {report.dataSources.join(' • ')}
        </p>
      </Card>
    </div>
  )
}
