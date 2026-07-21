'use client'

import { AiGolfAnalystInterface } from '@/features/analyst/components/ai-golf-analyst-interface'
import { Brain, Zap, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default function AnalystPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <Brain className="h-8 w-8 text-blue-400" />
                AI Golf Analyst
              </h1>
              <p className="text-slate-400 mt-2">Ask questions. Get answers. Improve your decisions.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Context Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Quick Analysis</div>
                  <p className="text-sm text-slate-300 mt-1">Compare players, slates, or lineups instantly</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Insights</div>
                  <p className="text-sm text-slate-300 mt-1">Understand why plays work or don't</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Context</div>
                  <p className="text-sm text-slate-300 mt-1">Explore course, weather, and form data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Interface - Full Height */}
        <Card className="bg-slate-800 border-slate-700 h-[600px]">
          <AiGolfAnalystInterface />
        </Card>
      </div>
    </div>
  )
}
