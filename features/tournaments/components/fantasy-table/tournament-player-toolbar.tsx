import { Search } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FieldEntryStatus } from '@/features/tournaments/types'
import type { SortKey, SortOption } from '@/features/tournaments/config/phase-table-config'
import { cn } from '@/lib/utils'

/**
 * Premium filter-dropdown styling (visual only) matching the Tournament
 * Winner / Scorecard / Analytics card design language. Scoped here — shared
 * Select primitives are untouched. `!` utilities override the primitive's
 * conflicting height/radius/bg/text defaults.
 */
const premiumTriggerClass = cn(
  '!h-[60px] w-full !rounded-[22px] !border-[#2A2F36] !bg-[#111418] !px-[22px] !text-lg !font-semibold !text-white',
  'relative overflow-hidden transition-all duration-[250ms]',
  'hover:-translate-y-px hover:!border-white/25 hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)]',
  'data-[popup-open]:!border-[#34D17A] data-[popup-open]:shadow-[0_0_0_3px_rgba(52,209,122,0.15),0_10px_30px_rgba(16,185,129,0.12)]',
  '[&>svg]:!size-5 [&>svg]:text-muted-foreground',
  'lg:w-[240px]',
)

const premiumContentClass = cn(
  '!rounded-[22px] border border-white/[0.08] !bg-[#0D1318]/95 p-2 !shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-0 backdrop-blur-xl',
)

const premiumItemClass = cn(
  'rounded-[14px] px-3 py-2.5 text-base font-medium text-foreground/90',
  'data-[highlighted]:!bg-emerald-500/15 data-[highlighted]:!text-emerald-50',
  'data-[selected]:!bg-emerald-500/10 data-[selected]:!text-emerald-400',
)

export interface StatusOption {
  value: FieldEntryStatus | 'ALL'
  label: string
}

/**
 * Shared search + status + sort toolbar for the status-aware fantasy tables.
 * Purely presentational — the parent owns filter/sort state and the option
 * lists (which come from the phase config).
 */
export function TournamentPlayerToolbar({
  query,
  onQueryChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  sort,
  onSortChange,
  sortOptions,
}: {
  query: string
  onQueryChange: (value: string) => void
  statusFilter: FieldEntryStatus | 'ALL'
  onStatusChange: (value: FieldEntryStatus | 'ALL') => void
  statusOptions: StatusOption[]
  sort: SortKey
  onSortChange: (value: SortKey) => void
  sortOptions: SortOption[]
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
      {/* Search input */}
      <div className="group relative h-[60px] w-full overflow-hidden rounded-[22px] border border-[#2B3138] bg-[#111418] transition-all duration-[250ms] hover:-translate-y-px hover:border-white/20 hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] focus-within:-translate-y-px focus-within:border-[#34D17A] focus-within:shadow-[0_0_0_3px_rgba(52,209,122,0.15),0_10px_30px_rgba(16,185,129,0.12)] lg:flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/[0.05] opacity-0 blur-3xl transition-opacity duration-[250ms] group-hover:opacity-100 group-focus-within:opacity-100"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_90%_-10%,rgba(16,185,129,0.04),transparent_60%)]"
        />
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-6 top-1/2 size-[22px] -translate-y-1/2 text-muted-foreground transition-colors duration-[250ms] group-focus-within:text-emerald-400"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search players by name..."
          aria-label="Search players by name"
          className="relative h-full w-full bg-transparent pl-[3.75rem] pr-6 text-xl font-semibold text-white outline-none placeholder:font-normal placeholder:text-[#7D848D]"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:gap-5">
        <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as FieldEntryStatus | 'ALL')}>
          <SelectTrigger aria-label="Filter by status" className={premiumTriggerClass}>
            <SelectValue>
              {() => statusOptions.find((o) => o.value === statusFilter)?.label ?? 'All statuses'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className={premiumContentClass}>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className={premiumItemClass}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => onSortChange(value as SortKey)}>
          <SelectTrigger aria-label="Sort players" className={premiumTriggerClass}>
            <SelectValue>{() => sortOptions.find((o) => o.value === sort)?.label ?? ''}</SelectValue>
          </SelectTrigger>
          <SelectContent className={premiumContentClass}>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className={premiumItemClass}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
