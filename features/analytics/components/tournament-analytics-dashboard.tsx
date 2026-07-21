'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AISummaryCard } from './ai-summary-card'
import { PlayerAnalyticsTable } from './player-analytics-table'
import { AnalyticsCharts } from './analytics-charts'
import { AIInsightsPanel } from './ai-insights-panel'
import { TournamentDetailView } from '@/features/historical/components/tournament-detail-view'

interface TournamentAnalyticsDashboardProps {
  tournamentId: string
}

export default function TournamentAnalyticsDashboard({ tournamentId }: TournamentAnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tournament Analytics</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered insights, player comparisons, and historical data all in one view.
        </p>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="historical">Historical</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* AI Summary Card */}
          <AISummaryCard tournamentId={tournamentId} />

          {/* AI Insights */}
          <div>
            <h2 className="text-2xl font-bold mb-4">AI Insights</h2>
            <AIInsightsPanel context={`tournament:${tournamentId}`} limit={6} />
          </div>
        </TabsContent>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Player Rankings & Analytics</h2>
            <p className="text-muted-foreground mb-4">
              Click any player to view detailed profile, historical performance, course fit, and weather impact.
            </p>
          </div>
          <PlayerAnalyticsTable tournamentId={tournamentId} />
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Data Visualizations</h2>
            <p className="text-muted-foreground mb-4">
              Explore relationships between salary, ownership, performance, and weather impact.
            </p>
          </div>
          <AnalyticsCharts tournamentId={tournamentId} />
        </TabsContent>

        {/* Historical Tab */}
        <TabsContent value="historical" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Historical Tournament Data</h2>
            <p className="text-muted-foreground mb-4">
              Complete leaderboard, weather, odds, and DFS context from the Historical Intelligence Platform.
            </p>
          </div>
          <TournamentDetailView tournamentId={tournamentId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
