'use client'

import Link from 'next/link'
import { ArrowLeft, TriangleAlert, UserX, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/shared/page-shell'
import { EmptyState, PageHeader, LoadingState } from '@/features/ui/shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePlayerDetail } from '@/features/players/hooks/use-player-detail'
import { PlayerHeader } from '@/features/players/components/player-header'
import { CareerSummary } from '@/features/players/components/career-summary'
import { PlayerRankingPanel } from '@/features/players/components/player-ranking-panel'
import { PlayerStatsGrid } from '@/features/players/components/player-stats-grid'
import { PlayerAnalyticsPanel } from '@/features/players/components/player-analytics-panel'
import { PlayerDfsValueCard } from '@/features/players/components/player-dfs-value-card'
import { PlayerOddsCard } from '@/features/players/components/player-odds-card'
import { PlayerSkillCard } from '@/features/players/components/player-skill-card'
import { UpcomingTournamentCard } from '@/features/players/components/upcoming-tournament-card'
import { PlayerRankingCards } from '@/features/players/components/player-ranking-cards'
import { AiSummaryCard } from '@/features/players/components/ai-summary-card'
import { PlayerTournamentContextWrapper } from '@/features/players/components/player-tournament-context-wrapper'
import { PlayerAiSummaryEnhanced } from '@/features/players/components/player-ai-summary-enhanced'
import { PlayerFormChart } from '@/features/players/components/player-form-chart'
import { PlayerSeasonStatsCategorized } from '@/features/players/components/player-season-stats-categorized'
import { CourseHistory } from '@/features/players/components/course-history'
import { TournamentHistory } from '@/features/players/components/tournament-history'
import { RecentActivity } from '@/features/players/components/recent-activity'
import { RecentForm } from '@/features/players/components/recent-form'
import { PlayerNews } from '@/features/players/components/player-news'
import { PlayerDetailSkeleton } from '@/features/players/components/player-detail-skeleton'
import { DecisionWorkspace } from '@/features/players/components/decision-workspace'
import { PlayerProfileV2View } from '@/features/players/components/profile-v2'
import { PlayerIntelligencePanel } from '@/features/players/components/player-intelligence-panel'
import { toOverallRatingExplanation } from '@/lib/explainability'

interface PlayerDetailViewProps {
  playerId: string
}

export function PlayerDetailView({ playerId }: PlayerDetailViewProps) {
  const { player, isLoading, notFound, isError } = usePlayerDetail(playerId)

  const backButton = (
    <Button
      variant="ghost"
      size="sm"
      nativeButton={false}
      render={
        <Link href="/players">
          <ArrowLeft data-icon="inline-start" />
          All players
        </Link>
      }
    />
  )

  if (isLoading) {
    return (
      <PageShell>
        {backButton}
        <LoadingState message="Loading player profile..." variant="page" />
      </PageShell>
    )
  }

  if (isError) {
    return (
      <PageShell>
        {backButton}
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load player"
          description="We couldn't reach the database. Please try again in a moment."
        />
      </PageShell>
    )
  }

  if (notFound || !player) {
    return (
      <PageShell>
        {backButton}
        <EmptyState
          icon={UserX}
          title="Player not found"
          description="We couldn't find a player with that ID. They may have been removed or the link is incorrect."
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      {backButton}

      <PlayerHeader player={player} />

      <AiSummaryCard analytics={player.analytics} playerName={player.fullName} />

      <Tabs defaultValue="profile-v2">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 w-full">
          <TabsTrigger value="profile-v2" className="text-xs sm:text-sm">Profile</TabsTrigger>
          <TabsTrigger value="workspace" className="text-xs sm:text-sm">Workspace</TabsTrigger>
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="statistics" className="text-xs sm:text-sm">Stats</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
          <TabsTrigger value="news" className="text-xs sm:text-sm">News</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile-v2" className="flex flex-col gap-6">
          <PlayerProfileV2View player={player} />
        </TabsContent>

        <TabsContent value="workspace" className="flex flex-col gap-6">
          <DecisionWorkspace
            playerId={player.id}
            playerName={player.fullName}
            analytics={player.analytics}
            explanation={toOverallRatingExplanation(player.analytics, {
              kind: 'player',
              id: player.id,
              label: player.fullName,
            })}
          />
        </TabsContent>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <PlayerAiSummaryEnhanced player={player} />
          <div className="grid gap-6 lg:grid-cols-2">
            <PlayerFormChart player={player} />
            <PlayerRankingPanel rankings={player.rankings} />
          </div>
          <CareerSummary summary={player.careerSummary} />
          <PlayerIntelligencePanel intelligence={player.playerIntelligence} />
        </TabsContent>

        <TabsContent value="analytics" className="flex flex-col gap-6">
          <PlayerRankingCards profile={player.rankingProfile} />
          <PlayerTournamentContextWrapper
            player={player}
            courseProfile={player.upcoming?.courseIntelligence ? { coverage: { verified: 1, total: 1 } } as any : null}
          />
          <PlayerDfsValueCard playerId={player.id} playerName={player.fullName} />
          <PlayerSkillCard playerId={player.id} playerName={player.fullName} />
          <PlayerOddsCard playerId={player.id} />
          <PlayerAnalyticsPanel analytics={player.analytics} playerName={player.fullName} />
          <UpcomingTournamentCard context={player.upcoming} />
        </TabsContent>

        <TabsContent value="statistics" className="flex flex-col gap-6">
          <PlayerSeasonStatsCategorized player={player} />
          <PlayerStatsGrid
            seasonStatistics={player.seasonStatistics}
            verifiedWorldRanking={player.worldRanking}
          />
        </TabsContent>

        <TabsContent value="history">
          <div className="flex flex-col gap-6">
            <TournamentHistory history={player.tournamentHistory} />
            <CourseHistory history={player.courseHistory} />
          </div>
        </TabsContent>

        <TabsContent value="news">
          <PlayerNews news={player.news} />
        </TabsContent>

        <TabsContent value="activity">
          <RecentActivity activity={player.activity} />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
