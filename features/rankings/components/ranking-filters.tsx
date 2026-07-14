'use client'

import { Search, Star, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import type { FilterOption, RankingFiltersState } from '../types'

interface FilterSelectProps {
  label: string
  value: string
  options: FilterOption[]
  onValueChange: (value: string) => void
  className?: string
}

function FilterSelect({
  label,
  value,
  options,
  onValueChange,
  className,
}: FilterSelectProps) {
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
  options: {
    tour: FilterOption[]
    nationality: FilterOption[]
    minEvents: FilterOption[]
    form: FilterOption[]
  }
  setSearch: (value: string) => void
  setFilter: <K extends keyof RankingFiltersState>(
    key: K,
    value: RankingFiltersState[K],
  ) => void
  hasActiveFilters: boolean
  onReset: () => void
}

/** Rankings toolbar: search, tour, nationality, min events, form, favorites. */
export function RankingFilters({
  filters,
  options,
  setSearch,
  setFilter,
  hasActiveFilters,
  onReset,
}: RankingFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <InputGroup className="lg:w-64">
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-center">
        <FilterSelect
          label="Filter by tour"
          value={filters.tour}
          options={options.tour}
          onValueChange={(value) =>
            setFilter('tour', value as RankingFiltersState['tour'])
          }
          className="lg:w-36"
        />
        <FilterSelect
          label="Filter by nationality"
          value={filters.nationality}
          options={options.nationality}
          onValueChange={(value) => setFilter('nationality', value)}
          className="lg:w-40"
        />
        <FilterSelect
          label="Filter by minimum events"
          value={String(filters.minEvents)}
          options={options.minEvents}
          onValueChange={(value) => setFilter('minEvents', Number(value))}
          className="lg:w-36"
        />
        <FilterSelect
          label="Filter by recent form"
          value={filters.form}
          options={options.form}
          onValueChange={(value) =>
            setFilter('form', value as RankingFiltersState['form'])
          }
          className="lg:w-36"
        />
      </div>

      <div className="flex items-center gap-4 lg:ml-auto">
        <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <Switch
            checked={filters.favoritesOnly}
            onCheckedChange={(checked) => setFilter('favoritesOnly', checked)}
          />
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5" aria-hidden />
            Favorites
          </span>
        </Label>

        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X data-icon="inline-start" />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  )
}
