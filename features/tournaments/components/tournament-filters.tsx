'use client'

import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  FilterOption,
  TournamentFilters as TournamentFiltersState,
} from '@/features/tournaments/types'
import { cn } from '@/lib/utils'

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
      <SelectTrigger aria-label={label} className={cn('w-full', className)}>
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

interface TournamentFiltersProps {
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
}

/** Filter toolbar for the tournament directory. */
export function TournamentFilters({
  filters,
  options,
  setFilter,
  hasActiveFilters,
  onReset,
}: TournamentFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap xl:items-center">
      <FilterSelect
        label="Filter by status"
        value={filters.status}
        options={options.status}
        onValueChange={(value) =>
          setFilter('status', value as TournamentFiltersState['status'])
        }
        className="xl:w-40"
      />
      <FilterSelect
        label="Filter by tour"
        value={filters.tour}
        options={options.tour}
        onValueChange={(value) => setFilter('tour', value as TournamentFiltersState['tour'])}
        className="xl:w-44"
      />
      <FilterSelect
        label="Filter by season"
        value={filters.season}
        options={options.season}
        onValueChange={(value) => setFilter('season', value)}
        className="xl:w-36"
      />
      {hasActiveFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="col-span-2 sm:col-span-1"
        >
          <X data-icon="inline-start" />
          Clear
        </Button>
      ) : null}
    </div>
  )
}
