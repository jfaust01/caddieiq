'use client'

import { TriangleAlert } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { EmptyPlayersState } from '@/features/players/components/empty-players-state'
import { PlayerCard } from '@/features/players/components/player-card'
import { PlayerFilters } from '@/features/players/components/player-filters'
import { PlayerListItem } from '@/features/players/components/player-list-item'
import { PlayerPagination } from '@/features/players/components/player-pagination'
import { PlayerSearch } from '@/features/players/components/player-search'
import { PlayerSkeleton } from '@/features/players/components/player-skeleton'
import { ViewToggle } from '@/features/players/components/view-toggle'
import { PLAYERS_PAGE_SIZE, usePlayers } from '@/features/players/hooks/use-players'

function ResultSummary({
  page,
  pageSize,
  total,
  isLoading,
}: {
  page: number
  pageSize: number
  total: number
  isLoading: boolean
}) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading players…</p>
  }
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No players found</p>
  }
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      Showing <span className="font-medium text-foreground">{start}</span>–
      <span className="font-medium text-foreground">{end}</span> of{' '}
      <span className="font-medium text-foreground">{total}</span> players
    </p>
  )
}

/**
 * The searchable, filterable player directory. Owns directory UI state via the
 * `usePlayers` hook and renders grid/list, loading, and empty states.
 */
export function PlayerDirectory() {
  const {
    filters,
    setSearch,
    setFilter,
    resetFilters,
    hasActiveFilters,
    page,
    setPage,
    view,
    setView,
    result,
    isLoading,
    isError,
    tourFilterEnabled,
    options,
  } = usePlayers()

  const showEmpty = !isLoading && !isError && result.items.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PlayerSearch
            defaultValue={filters.search}
            onSearch={setSearch}
            className="sm:max-w-sm"
          />
          <ViewToggle view={view} onViewChange={setView} />
        </div>
        <PlayerFilters
          filters={filters}
          options={options}
          setFilter={setFilter}
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
          tourFilterEnabled={tourFilterEnabled}
        />
      </div>

      <ResultSummary
        page={result.page}
        pageSize={PLAYERS_PAGE_SIZE}
        total={result.total}
        isLoading={isLoading}
      />

      {isError ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load players"
          description="We couldn't reach the database. Please try again in a moment."
        />
      ) : isLoading ? (
        <PlayerSkeleton view={view} count={PLAYERS_PAGE_SIZE} />
      ) : showEmpty ? (
        <EmptyPlayersState hasFilters={hasActiveFilters} onReset={resetFilters} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.items.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {result.items.map((player) => (
            <PlayerListItem key={player.id} player={player} />
          ))}
        </div>
      )}

      {!isLoading && !isError && !showEmpty ? (
        <PlayerPagination
          page={result.page}
          totalPages={result.totalPages}
          onPageChange={setPage}
          className="pt-2"
        />
      ) : null}
    </div>
  )
}
