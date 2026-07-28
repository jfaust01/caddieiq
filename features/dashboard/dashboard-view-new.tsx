'use client'

import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@auth/core/types'
import { useDashboardViewModel } from './hooks/use-dashboard-view-model'
import { DashboardGreeting } from './components/dashboard-greeting'
import { FeaturedTournamentHero } from './components/featured-tournament-hero'
import { HeroStatusPanel } from './components/hero-status-panel'
import { DashboardInsightCard } from './components/dashboard-insight-card'
import { AiSlateSummaryCard } from './components/ai-slate-summary-card'
import { TrendingGolfersCard } from './components/trending-golfers-card'
import { WeatherCourseCard } from './components/weather-course-card'
import { VegasOwnershipCard } from './components/vegas-ownership-card'
import { ActivityFeedCard } from './components/activity-feed-card'

interface DashboardViewProps {
  session: Session | null
}

export function DashboardViewNew({ session }: DashboardViewProps) {
  const queryClient = useQueryClient()
  const dashboardData = useDashboardViewModel()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-tournaments'] })
  }

  const userName = session?.user?.name

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071015] to-[#0A1118]">
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Greeting Bar */}
        <DashboardGreeting
          userName={userName}
          lastRefreshTime={dashboardData.lastRefreshTime}
          onRefresh={handleRefresh}
        />

        {/* Featured Tournament Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Hero */}
          <div className="lg:col-span-2">
            {dashboardData.liveTournament ? (
              <>
                <FeaturedTournamentHero tournament={dashboardData.liveTournament} status="live" />
              </>
            ) : dashboardData.upcomingTournament ? (
              <FeaturedTournamentHero
                tournament={dashboardData.upcomingTournament}
                status="upcoming"
              />
            ) : (
              <FeaturedTournamentHero
                tournament={dashboardData.completedTournament}
                status="completed"
              />
            )}
          </div>

          {/* Right Panel: Status */}
          <div className="flex flex-col gap-4">
            <HeroStatusPanel label="Cash Lock" value="1h 14m 22s" unit="Today" />
            <HeroStatusPanel
              label="Contests Active"
              value="12"
              trend={{ value: 15, direction: 'up' }}
            />
          </div>
        </div>

        {/* Top 5 Insight Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <DashboardInsightCard
            title="Best Play"
            primaryLabel="Player"
            primaryValue="Scottie Scheffler"
            secondaryLabel="Rating"
            secondaryValue="98"
            badge={{ label: 'Proj. 108.3 DK Pts', color: 'bg-emerald-500/20 text-emerald-400' }}
          />
          <DashboardInsightCard
            title="Best Value"
            primaryLabel="Player"
            primaryValue="Ben Griffin"
            secondaryLabel="Salary"
            secondaryValue="$7,600"
            badge={{ label: '5.8x Value', color: 'bg-blue-500/20 text-blue-400' }}
          />
          <DashboardInsightCard
            title="Highest Leverage"
            primaryLabel="Player"
            primaryValue="Cameron Young"
            secondaryLabel="Leverage"
            secondaryValue="91"
            badge={{ label: 'Prob. 96.4 DK Pts', color: 'bg-purple-500/20 text-purple-400' }}
          />
          <DashboardInsightCard
            title="Projected Cut"
            primaryLabel="Score"
            primaryValue="-1"
            secondaryLabel="Confidence"
            secondaryValue="70%"
            badge={{ label: 'Probability', color: 'bg-orange-500/20 text-orange-400' }}
          />
          <DashboardInsightCard
            title="Ownership Leader"
            primaryLabel="Player"
            primaryValue="Scottie Scheffler"
            secondaryLabel="Owned"
            secondaryValue="34%"
            badge={{ label: '6% vs Yesterday', color: 'bg-red-500/20 text-red-400' }}
          />
        </div>

        {/* AI Slate Summary */}
        <AiSlateSummaryCard />

        {/* Three Column Intelligence Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <TrendingGolfersCard />
          <WeatherCourseCard />
          <VegasOwnershipCard />
        </div>

        {/* Activity Feed */}
        <ActivityFeedCard />

        {/* Footer Info */}
        {dashboardData.hasError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            Some data failed to load. Please try refreshing.
          </div>
        )}
      </div>
    </div>
  )
}
