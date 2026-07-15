'use client'

import { TriangleAlert } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { EmptyTournamentsState } from '@/features/tournaments/components/empty-tournaments-state'
import { TournamentCard } from '@/features/tournaments/components/tournament-card'
import { TournamentFilters } from '@/features/tournaments/components/tournament-filters'
import { TournamentPagination } from '@/features/tournaments/components/tournament-pagination'
import { TournamentSearch } from '@/features/tournaments/components/tournament-search'
import { TournamentSkeleton } from '@/features/tournaments/components/tournament-skeleton'
import { TOURNAMENTS_PAGE_SIZE, useTournaments } from '@/features/tournaments/hooks/use-tournaments'

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
    return <p className="text-sm text-muted-foreground">Loading tournaments…</p>
  }
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No tournaments found</p>
  }
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      Showing <span className="font-medium text-foreground">{start}</span>–
      <span className="font-medium text-foreground">{end}</span> of{' '}
      <span className="font-medium text-foreground">{total}</span> tournaments
    </p>
  )
}

/**
 * The searchable, filterable tournament directory. Owns directory UI state via
 * the `useTournaments` hook and renders grid, loading, empty, and error states
 * against the live tournament data.
 */
export function TournamentDirectory() {
  const {
    filters,
    setSearch,
    setFilter,
    resetFilters,
    hasActiveFilters,
    setPage,
    result,
    isLoading,
    isError,
    options,
  } = useTournaments()

  const showEmpty = !isLoading && !isError && result.items.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <TournamentSearch
          defaultValue={filters.search}
          onSearch={setSearch}
          className="sm:max-w-sm"
        />
        <TournamentFilters
          filters={filters}
          options={options}
          setFilter={setFilter}
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
        />
      </div>

      <ResultSummary
        page={result.page}
        pageSize={TOURNAMENTS_PAGE_SIZE}
        total={result.total}
        isLoading={isLoading}
      />

      {isError ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load tournaments"
          description="We couldn't reach the database. Please try again in a moment."
        />
      ) : isLoading ? (
        <TournamentSkeleton count={TOURNAMENTS_PAGE_SIZE} />
      ) : showEmpty ? (
        <EmptyTournamentsState hasFilters={hasActiveFilters} onReset={resetFilters} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.items.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}

      {!isLoading && !isError && !showEmpty ? (
        <TournamentPagination
          page={result.page}
          totalPages={result.totalPages}
          onPageChange={setPage}
          className="pt-2"
        />
      ) : null}
    </div>
  )
}
