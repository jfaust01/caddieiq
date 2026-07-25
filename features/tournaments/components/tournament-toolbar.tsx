'use client'

import { RotateCcw, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchBar } from '@/components/shared/search-bar'
import type {
  FilterOption,
  TournamentFilters as TournamentFiltersState,
} from '@/features/tournaments/types'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

interface FilterSelectProps {
  label: string
  value: string
  options: FilterOption[]
  onValueChange: (value: string) => void
  className?: string
}

function FilterSelect({ label, value, options, onValueChange, className }: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(String(next))}>
      <SelectTrigger
        aria-label={label}
        className={cn('h-11 bg-background/50 border-white/10', className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface TournamentToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  filters: TournamentFiltersState
  options: {
    status: FilterOption[]
    tour: FilterOption[]
    season: FilterOption[]
  }
  setFilter: <K extends keyof TournamentFiltersState>(
    key: K,
    value: TournamentFiltersState[K],
  ) => void
  hasActiveFilters: boolean
  onReset: () => void
  className?: string
}

/**
 * Premium glass toolbar for tournament filters and search.
 * Desktop: grows flexbox with search on left, filters and reset on right.
 * Mobile: full-width search, then 2-column filter grid.
 */
export function TournamentToolbar({
  search,
  onSearchChange,
  filters,
  options,
  setFilter,
  hasActiveFilters,
  onReset,
  className,
}: TournamentToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      onSearchChange(localSearch)
    }, 200)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [localSearch, onSearchChange])

  const activeFilterCount = [
    filters.status !== 'ALL',
    filters.tour !== 'ALL',
    filters.season !== 'ALL',
  ].filter(Boolean).length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop: flex layout with search growing */}
      <div className="hidden flex-col gap-3 sm:flex">
        {/* Search bar full width */}
        <SearchBar
          placeholder="Search tournaments, courses, or locations..."
          value={localSearch}
          onSearch={setLocalSearch}
          className="w-full h-11"
        />

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Filter by status"
            value={filters.status}
            options={options.status}
            onValueChange={(value) =>
              setFilter('status', value as TournamentFiltersState['status'])
            }
            className="w-40"
          />
          <FilterSelect
            label="Filter by tour"
            value={filters.tour}
            options={options.tour}
            onValueChange={(value) => setFilter('tour', value as TournamentFiltersState['tour'])}
            className="w-44"
          />
          <FilterSelect
            label="Filter by season"
            value={filters.season}
            options={options.season}
            onValueChange={(value) => setFilter('season', value)}
            className="w-40"
          />

          {/* Active filters badge and reset */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-0">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-9 px-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-4" />
                <span className="sr-only">Clear all filters</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="flex flex-col gap-3 sm:hidden">
        <SearchBar
          placeholder="Search tournaments..."
          value={localSearch}
          onSearch={setLocalSearch}
          className="w-full h-11"
        />

        <div className="grid grid-cols-2 gap-2">
          <FilterSelect
            label="Filter by status"
            value={filters.status}
            options={options.status}
            onValueChange={(value) =>
              setFilter('status', value as TournamentFiltersState['status'])
            }
            className="h-10"
          />
          <FilterSelect
            label="Filter by tour"
            value={filters.tour}
            options={options.tour}
            onValueChange={(value) => setFilter('tour', value as TournamentFiltersState['tour'])}
            className="h-10"
          />
          <FilterSelect
            label="Filter by season"
            value={filters.season}
            options={options.season}
            onValueChange={(value) => setFilter('season', value)}
            className="h-10"
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="col-span-2 h-10 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
