'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, TrendingUp, Wind, DollarSign, Users, Zap, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-slate-400">Loading slate analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-slate-800 border-red-500/50">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white">Unable to Load Slate Analysis</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    {error || 'No active tournament found for this week'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const overview = report.sections.overview
  const courseBreakdown = report.sections.courseBreakdown
  const weatherReport = report.sections.weatherReport
  const topPlays = report.sections.topPlays || []
  const dfsStrategy = report.sections.dfsStrategy

  // Mock players for demonstration
  const playerPool = [
    { name: 'Rory McIlroy', salary: 11200, projected: 45.2, ownership: 22 },
    { name: 'Jon Rahm', salary: 10800, projected: 43.8, ownership: 18 },
    { name: 'Viktor Hovland', salary: 10400, projected: 41.5, ownership: 8 },
    { name: 'Collin Morikawa', salary: 10000, projected: 39.2, ownership: 14 },
    { name: 'Scottie Scheffler', salary: 9600, projected: 37.8, ownership: 28 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">{overview.name}</h1>
              <p className="text-slate-400 mt-1">{overview.location}</p>
            </div>
            <div className="text-right">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {(report.confidence * 100).toFixed(0)}% Confidence
              </Badge>
              <p className="text-xs text-slate-400 mt-2">Updated now</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Critical Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Salary Cap</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">$50,000</span>
                <span className="text-xs text-slate-400">/ $2,200 remaining</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Max Exposure</div>
              <div className="text-2xl font-bold text-white">25%</div>
              <div className="text-xs text-slate-400 mt-1">Recommended</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Avg DK Score</div>
              <div className="text-2xl font-bold text-emerald-400">234.2</div>
              <div className="text-xs text-slate-400 mt-1">+3.1 vs last week</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Lineup Status</div>
              <div className="text-xl font-bold text-white">Valid</div>
              <div className="text-xs text-slate-400 mt-1">6/6 positions</div>
            </CardContent>
          </Card>
        </div>

        {/* 3-Section Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECTION 1: Player Pool Overview */}
          <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" />
                Player Pool Analysis
              </h3>
              
              {/* Visual Chart Placeholder */}
              <div className="bg-slate-700/50 rounded-lg p-8 mb-4 flex items-center justify-center min-h-64">
                <div className="text-center">
                  <div className="text-slate-400 mb-4">Interactive Salary vs Points Chart</div>
                  <div className="text-sm text-slate-500">(Bubble size = ownership, Color = position)</div>
                </div>
              </div>

              {/* Insights */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-700/50">
                  <div className="text-xs font-semibold text-amber-300 uppercase mb-1">Ownership Alert</div>
                  <p className="text-sm text-slate-200">3 contrarian plays vs consensus at 8% vs 22% average ownership</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/50">
                  <div className="text-xs font-semibold text-emerald-300 uppercase mb-1">Value Zone</div>
                  <p className="text-sm text-slate-200">5 players with 20%+ projected upside at reasonable salary</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: Tournament Context */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Tournament Context</h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Weather</div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Wind className="h-4 w-4" />
                    12 mph NW, 72°F
                  </div>
                </div>
                <div className="pb-4 border-b border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Course Stats</div>
                  <div className="text-sm text-slate-300">
                    <div>Par: {overview.courseStats?.par}</div>
                    <div>Yards: {overview.courseStats?.yardage?.toLocaleString()}</div>
                    <div className="text-xs text-slate-400 mt-1">Rating: {courseBreakdown.importance.driving}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Scoring</div>
                  <div className="text-sm text-slate-300">
                    <div>Avg Winning: {courseBreakdown.keyStatistics?.averageWinningScore || '-'}</div>
                    <div className="text-xs text-slate-400 mt-1">Difficulty: Medium</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 3: Detailed Player Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recommended Players</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Player</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Salary</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Proj</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Upside</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Own %</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {playerPool.map((player) => (
                    <tr key={player.name} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-3 font-medium text-white">{player.name}</td>
                      <td className="py-3 px-3 text-right text-slate-300">${player.salary / 100}</td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-400">{player.projected.toFixed(1)}</td>
                      <td className="py-3 px-3 text-right text-slate-300">+12.3%</td>
                      <td className="py-3 px-3 text-right text-slate-300">{player.ownership}%</td>
                      <td className="py-3 px-3 text-right">
                        <button className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="flex gap-3">
          <Button asChild className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg">
            <Link href="/lineup-builder" className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5" />
              Build Lineup
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 border-slate-700 text-slate-300 hover:bg-slate-800">
            <Link href="/analyst" className="px-6">Ask AI</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
