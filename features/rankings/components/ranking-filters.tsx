'use client'

import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import type { FilterOption, RankingFiltersState } from '../types'

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
      <SelectTrigger aria-label={label} size="sm" className={cn('w-full', className)}>
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

interface RankingFiltersProps {
  filters: RankingFiltersState
  options: { tour: FilterOption[]; season: FilterOption[] }
  setSearch: (value: string) => void
  setFilter: <K extends keyof RankingFiltersState>(
    key: K,
    value: RankingFiltersState[K],
  ) => void
  hasActiveFilters: boolean
  onReset: () => void
}

/**
 * Live directory toolbar: search by name plus Tour and Season filters. Only
 * these three controls are offered because they are the dimensions the live
 * data can actually partition — there are no fabricated "form band", "minimum
 * events", or "favorites" filters here.
 */
export function RankingFilters({
  filters,
  options,
  setSearch,
  setFilter,
  hasActiveFilters,
  onReset,
}: RankingFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <InputGroup className="sm:w-64">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          value={filters.search}
          placeholder="Search players..."
          aria-label="Search players"
          onChange={(event) => setSearch(event.target.value)}
        />
      </InputGroup>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <FilterSelect
          label="Filter by tour"
          value={filters.tour}
          options={options.tour}
          onValueChange={(value) => setFilter('tour', value as RankingFiltersState['tour'])}
          className="sm:w-40"
        />
        <FilterSelect
          label="Filter by season"
          value={filters.season}
          options={options.season}
          onValueChange={(value) => setFilter('season', value as RankingFiltersState['season'])}
          className="sm:w-36"
        />
      </div>

      {hasActiveFilters ? (
        <Button variant="ghost" size="sm" onClick={onReset} className="sm:ml-auto">
          <X data-icon="inline-start" />
          Clear
        </Button>
      ) : null}
    </div>
  )
}
