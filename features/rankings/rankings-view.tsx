'use client'

import { Trophy } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import type { RankingType } from '@/lib/ranking'

import { RankingTabs } from './components/ranking-tabs'
import { RankingSummaryBar } from './components/ranking-summary-bar'
import { RankingFilters } from './components/ranking-filters'
import { RankingsTable } from './components/rankings-table'
import { RankingsTableSkeleton } from './components/rankings-table-skeleton'
import { InsightPanel } from './components/insight-panel'
import { RankingDetailPanel } from './components/ranking-detail-panel'
import { useRankings } from './hooks/use-rankings'

interface RankingsViewProps {
  /** Active ranking type, resolved from the route. */
  type: RankingType
}

/**
 * Rankings Experience: a tabbed, filterable leaderboard driven by the Ranking
 * Engine. Selecting a row opens a slide-over preview with the weighted score
 * breakdown and a placeholder AI rationale. The active board is route-driven
 * (`/rankings/[type]`) so it is linkable and shareable.
 */
export function RankingsView({ type }: RankingsViewProps) {
  const rankings = useRankings(type)

  return (
    <PageShell>
      <PageHeader
        title="Rankings"
        description="Multi-model leaderboards blending recent form, course fit, value, and momentum into a single composite score."
      />

      <RankingTabs activeType={type} />

      <RankingSummaryBar
        summary={rankings.summary}
        isLoading={rankings.isLoading}
      />

      <InsightPanel
        insights={rankings.insights}
        isLoading={rankings.isLoading}
        onSelectPlayer={rankings.selectPlayer}
      />

      <div className="flex flex-col gap-4">
        <RankingFilters
          filters={rankings.filters}
          options={rankings.options}
          setSearch={rankings.setSearch}
          setFilter={rankings.setFilter}
          hasActiveFilters={rankings.hasActiveFilters}
          onReset={rankings.resetFilters}
        />

        {rankings.isLoading ? (
          <RankingsTableSkeleton />
        ) : rankings.rows.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No players match these filters"
            description="Try clearing the filters or broadening your search to see more of the field."
            action={
              rankings.hasActiveFilters ? (
                <Button variant="outline" onClick={rankings.resetFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <RankingsTable
            rows={rankings.rows}
            selectedPlayerId={rankings.selectedPlayerId}
            onSelect={rankings.selectPlayer}
            isFavorite={rankings.isFavorite}
            onToggleFavorite={rankings.toggleFavorite}
          />
        )}
      </div>

      <RankingDetailPanel
        row={rankings.selectedRow}
        weights={rankings.weights}
        open={rankings.selectedPlayerId !== null}
        onOpenChange={(open) => {
          if (!open) rankings.selectPlayer(null)
        }}
      />
    </PageShell>
  )
}
