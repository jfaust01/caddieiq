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
import type { FilterOption, PlayerFilters as PlayerFiltersState } from '@/features/players/types'
import { cn } from '@/lib/utils'

interface FilterSelectProps {
  label: string
  value: string
  options: FilterOption[]
  onValueChange: (value: string) => void
  className?: string
  disabled?: boolean
  /** Accessible explanation shown on hover when the control is disabled. */
  disabledHint?: string
}

function FilterSelect({
  label,
  value,
  options,
  onValueChange,
  className,
  disabled,
  disabledHint,
}: FilterSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={label}
        title={disabled ? disabledHint : undefined}
        className={cn('w-full', className)}
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

interface PlayerFiltersProps {
  filters: PlayerFiltersState
  options: {
    tour: FilterOption[]
    nationality: FilterOption[]
    rankingBand: FilterOption[]
    handedness: FilterOption[]
    status: FilterOption[]
  }
  setFilter: <K extends keyof PlayerFiltersState>(
    key: K,
    value: PlayerFiltersState[K],
  ) => void
  hasActiveFilters: boolean
  onReset: () => void
  /** When false, tour classification is unavailable and the control is disabled. */
  tourFilterEnabled: boolean
}

/** Filter toolbar for the player directory. */
export function PlayerFilters({
  filters,
  options,
  setFilter,
  hasActiveFilters,
  onReset,
  tourFilterEnabled,
}: PlayerFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:flex xl:flex-wrap xl:items-center">
      <FilterSelect
        label="Filter by tour"
        value={tourFilterEnabled ? filters.tour : 'ALL'}
        options={
          tourFilterEnabled
            ? options.tour
            : [{ value: 'ALL', label: 'Tour data unavailable' }]
        }
        onValueChange={(value) =>
          setFilter('tour', value as PlayerFiltersState['tour'])
        }
        disabled={!tourFilterEnabled}
        disabledHint="Tour classification hasn't been imported for these players yet."
        className="xl:w-40"
      />
      <FilterSelect
        label="Filter by nationality"
        value={filters.nationality}
        options={options.nationality}
        onValueChange={(value) => setFilter('nationality', value)}
        className="xl:w-48"
      />
      <FilterSelect
        label="Filter by world ranking"
        value={filters.rankingBand}
        options={options.rankingBand}
        onValueChange={(value) =>
          setFilter('rankingBand', value as PlayerFiltersState['rankingBand'])
        }
        className="xl:w-36"
      />
      <FilterSelect
        label="Filter by handedness"
        value={filters.handedness}
        options={options.handedness}
        onValueChange={(value) =>
          setFilter('handedness', value as PlayerFiltersState['handedness'])
        }
        className="xl:w-36"
      />
      <FilterSelect
        label="Filter by status"
        value={filters.status}
        options={options.status}
        onValueChange={(value) =>
          setFilter('status', value as PlayerFiltersState['status'])
        }
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
