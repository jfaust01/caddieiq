'use client'

import Link from 'next/link'
import { ArrowLeft, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/shared/page-shell'
import { EmptyState } from '@/components/shared/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePlayerDetail } from '@/features/players/hooks/use-player-detail'
import { PlayerHeader } from '@/features/players/components/player-header'
import { CareerSummary } from '@/features/players/components/career-summary'
import { PlayerRankingPanel } from '@/features/players/components/player-ranking-panel'
import { PlayerStatsGrid } from '@/features/players/components/player-stats-grid'
import { AiSummaryCard } from '@/features/players/components/ai-summary-card'
import { CourseHistory } from '@/features/players/components/course-history'
import { TournamentHistory } from '@/features/players/components/tournament-history'
import { RecentActivity } from '@/features/players/components/recent-activity'
import { RecentForm } from '@/features/players/components/recent-form'
import { PlayerDetailSkeleton } from '@/features/players/components/player-detail-skeleton'

interface PlayerDetailViewProps {
  playerId: string
}

export function PlayerDetailView({ playerId }: PlayerDetailViewProps) {
  const { player, isLoading, notFound } = usePlayerDetail(playerId)

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
        <PlayerDetailSkeleton />
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

      <AiSummaryCard />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <CareerSummary summary={player.careerSummary} />
              <RecentForm
                form={player.recentForm}
                className="rounded-lg border border-border bg-card p-4"
              />
            </div>
            <PlayerRankingPanel rankings={player.rankings} />
          </div>
        </TabsContent>

        <TabsContent value="statistics">
          <PlayerStatsGrid statistics={player.statistics} />
        </TabsContent>

        <TabsContent value="history">
          <div className="flex flex-col gap-6">
            <TournamentHistory history={player.tournamentHistory} />
            <CourseHistory history={player.courseHistory} />
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <RecentActivity activity={player.activity} />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
