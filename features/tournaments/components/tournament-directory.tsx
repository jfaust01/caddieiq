'use client'

import { TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'

import { EmptyState } from '@/components/shared/empty-state'
import { EmptyTournamentsState } from '@/features/tournaments/components/empty-tournaments-state'
import { TournamentCard } from '@/features/tournaments/components/tournament-card'
import { TournamentIndexHero } from '@/features/tournaments/components/tournament-index-hero'
import { TournamentSectionHeader } from '@/features/tournaments/components/tournament-section-header'
import { TournamentToolbar } from '@/features/tournaments/components/tournament-toolbar'
import { TournamentPagination } from '@/features/tournaments/components/tournament-pagination'
import { TournamentSkeleton } from '@/features/tournaments/components/tournament-skeleton'
import type { TournamentSummary } from '@/features/tournaments/types'
import { TOURNAMENTS_PAGE_SIZE, useTournaments } from '@/features/tournaments/hooks/use-tournaments'

/**
 * The searchable, filterable tournament directory. Owns directory UI state via
 * the `useTournaments` hook and renders status-aware sections, loading, empty,
 * and error states against the live tournament data.
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

  // Group tournaments by status for sectioned display
  const groupedTournaments = useMemo(() => {
    const groups: Record<string, TournamentSummary[]> = {
      live: [],
      upcoming: [],
      completed: [],
    }

    result.items.forEach((tournament) => {
      if (tournament.status === 'ACTIVE') groups.live.push(tournament)
      else if (tournament.status === 'SCHEDULED') groups.upcoming.push(tournament)
      else if (tournament.status === 'COMPLETED') groups.completed.push(tournament)
    })

    return groups
  }, [result.items])

  return (
    <div className="flex flex-col gap-8">
      {/* Hero with metrics */}
      <TournamentIndexHero tournaments={result.items} isLoading={isLoading} />

      {/* Toolbar */}
      <TournamentToolbar
        search={filters.search}
        onSearchChange={setSearch}
        filters={filters}
        options={options}
        setFilter={setFilter}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />

      {/* Content */}
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
        <div className="space-y-8">
          {/* Live Section */}
          {groupedTournaments.live.length > 0 && (
            <div className="space-y-4">
              <TournamentSectionHeader
                title="Live"
                count={groupedTournaments.live.length}
                accentColor="text-amber-400"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groupedTournaments.live.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          {groupedTournaments.upcoming.length > 0 && (
            <div className="space-y-4">
              <TournamentSectionHeader
                title="Upcoming"
                count={groupedTournaments.upcoming.length}
                accentColor="text-emerald-400"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groupedTournaments.upcoming.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </div>
          )}

          {/* Recently Completed Section */}
          {groupedTournaments.completed.length > 0 && (
            <div className="space-y-4">
              <TournamentSectionHeader
                title="Recently Completed"
                count={groupedTournaments.completed.length}
                accentColor="text-sky-400"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groupedTournaments.completed.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && !showEmpty ? (
        <div className="flex justify-center border-t border-white/5 pt-8">
          <TournamentPagination
            page={result.page}
            totalPages={result.totalPages}
            onPageChange={setPage}
          />
        </div>
      ) : null}
    </div>
  )
}
