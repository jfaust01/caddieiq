'use client'

import { Trophy } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import { TournamentPagination } from '@/features/tournaments/components/tournament-pagination'

import { RankingTabs } from './components/ranking-tabs'
import { RankingSummaryBar } from './components/ranking-summary-bar'
import { RankingFilters } from './components/ranking-filters'
import { RankingsTable } from './components/rankings-table'
import { useRankings } from './hooks/use-rankings'
import type { RankingView } from './types'

interface RankingsViewProps {
  /** The live view computed on the server (the engine runs in an RSC). */
  view: RankingView
}

/**
 * The live Rankings directory: a filterable, paginated leaderboard of the
 * CaddieIQ Ranking Engine's boards. The active board is route-driven
 * (`/rankings/[type]`) so it is linkable and shareable; Search, Tour, and
 * Season filters plus pagination run over the ranked population on the client.
 *
 * This is the platform's real "opinion layer" — every row, score, grade, band,
 * and confidence is engine output over live analytics. It deliberately shows
 * only what the data can back, so there are no fabricated trend, course-fit, or
 * market-value columns.
 */
export function RankingsView({ view }: RankingsViewProps) {
  const rankings = useRankings(view)

  const boardEmpty = view.totalRanked === 0

  return (
    <PageShell>
      <PageHeader
        title="Rankings"
        description="CaddieIQ's leaderboards — every player ordered by the same season-normalized analytics shown across the platform."
      />

      <RankingTabs activeSlug={view.slug} />

      <RankingSummaryBar summary={rankings.summary} />

      {boardEmpty ? (
        <EmptyState
          icon={Trophy}
          title="No players ranked yet"
          description="Once season statistics are imported, players will be scored and ranked here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <RankingFilters
            filters={rankings.filters}
            options={rankings.options}
            setSearch={rankings.setSearch}
            setFilter={rankings.setFilter}
            hasActiveFilters={rankings.hasActiveFilters}
            onReset={rankings.resetFilters}
          />

          <p className="text-xs text-muted-foreground">
            {rankings.filteredCount === rankings.totalRanked
              ? `${rankings.totalRanked} ${rankings.totalRanked === 1 ? 'player' : 'players'} ranked`
              : `${rankings.filteredCount} of ${rankings.totalRanked} players`}
          </p>

          {rankings.pageRows.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No players match these filters"
              description="Try clearing the filters or broadening your search to see more of the board."
              action={
                rankings.hasActiveFilters ? (
                  <Button variant="outline" onClick={rankings.resetFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <RankingsTable rows={rankings.pageRows} />
          )}

          <TournamentPagination
            page={rankings.page}
            totalPages={rankings.totalPages}
            onPageChange={rankings.setPage}
          />
        </div>
      )}
    </PageShell>
  )
}
