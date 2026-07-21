'use client'

import { TrendingUp, Zap, Target, Clock, ChevronRight, Trophy, Wind } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardViewProps {
  name: string
  email: string
  tier: string
  isAdmin: boolean
}

export function DashboardView({
  name,
  email,
  tier,
  isAdmin,
}: DashboardViewProps) {
  // Sample tournament data - replace with real data
  const tournament = {
    name: 'PGA Championship',
    location: 'Bethpage Black, NY',
    fieldSize: 156,
    courseRating: 77.8,
    courseSlope: 154,
    status: 'field-locked',
  }

  // Sample player recommendations
  const recommendedPlays = [
    {
      id: 1,
      name: 'Rory McIlroy',
      position: 'PRO',
      salary: 11200,
      projected: 45.2,
      confidence: 87,
      reason: 'Favorable wind pattern, strong driving form',
      ownership: 22,
    },
    {
      id: 2,
      name: 'Jon Rahm',
      position: 'PRO',
      salary: 10800,
      projected: 43.8,
      confidence: 82,
      reason: 'Course history, approach game advantage',
      ownership: 18,
    },
    {
      id: 3,
      name: 'Viktor Hovland',
      position: 'PRO',
      salary: 10400,
      projected: 41.5,
      confidence: 75,
      reason: 'Recent form spike, low ownership contrarian play',
      ownership: 8,
    },
  ]

  const modelPerformance = {
    winRate: 0.68,
    roi: 12.4,
    confidence: 78,
    lastRun: '2 hours ago',
    nextRun: 'Today at 5:00 PM',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">Welcome back, {name}</h1>
            <p className="text-slate-400">Your control center for this week&apos;s tournament</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Quick Status Strip - Always Visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* This Week's Tournament */}
          <Card className="bg-slate-800 border-slate-700 hover:border-emerald-500/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tournament</div>
                  <h3 className="text-lg font-bold text-white truncate">{tournament.name}</h3>
                  <p className="text-xs text-slate-400 mt-2">{tournament.location}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <span className="text-slate-300">
                      <span className="font-semibold">{tournament.fieldSize}</span> golfers
                    </span>
                    <span className="text-slate-300">
                      <span className="font-semibold">{tournament.courseRating}</span> rating
                    </span>
                  </div>
                </div>
                <Trophy className="h-8 w-8 text-emerald-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Your Model Performance */}
          <Card className="bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Performance</div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-white">{(modelPerformance.winRate * 100).toFixed(0)}%</span>
                    <span className="text-xs text-slate-400">win rate</span>
                  </div>
                  <div className="text-sm text-emerald-400 font-semibold mt-2">+{modelPerformance.roi}% ROI</div>
                  <p className="text-xs text-slate-400 mt-3">Last run {modelPerformance.lastRun}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Best Opportunity */}
          <Card className="bg-gradient-to-br from-amber-900/40 to-amber-950/40 border-amber-700/50 hover:border-amber-600/70 transition-colors lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">Top Recommendation</div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white">{recommendedPlays[0].name}</h3>
                    <span className="text-xs font-semibold text-slate-300">${recommendedPlays[0].salary / 100}</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{recommendedPlays[0].reason}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-amber-300">{recommendedPlays[0].projected}</span>
                      <span className="text-slate-400">projected</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-emerald-400">{recommendedPlays[0].confidence}%</span>
                      <span className="text-slate-400">confidence</span>
                    </span>
                  </div>
                </div>
                <Zap className="h-8 w-8 text-amber-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Tournament Context */}
          <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Tournament Context</h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Weather</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Wind className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-300">12 mph NW, 72°F, Clear</span>
                  </div>
                </div>
                <div className="pb-4 border-b border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">TV Schedule</div>
                  <p className="text-sm text-slate-300">7:00 AM - 7:00 PM ET</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Par/Scoring</div>
                  <div className="text-sm text-slate-300">
                    <div>Par: 70 / Rating: {tournament.courseRating}</div>
                    <div className="text-xs text-slate-400 mt-1">Average Score: 71.2</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CENTER: Recommended Plays */}
          <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Top Plays This Week</h3>
              <div className="space-y-3">
                {recommendedPlays.map((player) => (
                  <div key={player.id} className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-semibold text-white">{player.name}</div>
                        <div className="text-xs text-slate-400 mt-1">${player.salary / 100}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400">{player.projected.toFixed(1)}</div>
                        <div className="text-xs text-slate-400">proj</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mb-2 line-clamp-2">{player.reason}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{player.confidence}% confidence</span>
                      <span className="text-slate-400">{player.ownership}% owned</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Model Status */}
          <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Model Status</h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Latest Run</div>
                  <div className="text-2xl font-bold text-white">{(modelPerformance.winRate * 100).toFixed(0)}%</div>
                  <div className="text-xs text-slate-400 mt-1">{modelPerformance.lastRun}</div>
                </div>
                <div className="pb-4 border-b border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Season Performance</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-emerald-400">+{modelPerformance.roi}%</span>
                    <span className="text-xs text-slate-400">ROI</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Next Run</div>
                  <p className="text-sm text-slate-300">{modelPerformance.nextRun}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors">
            <Link href="/slate-analysis" className="flex items-center justify-center gap-2">
              <Target className="h-5 w-5" />
              Enter Slate Analysis
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 h-12 border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold rounded-lg">
            <Link href="/lineup-builder" className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5" />
              Build Lineup
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
