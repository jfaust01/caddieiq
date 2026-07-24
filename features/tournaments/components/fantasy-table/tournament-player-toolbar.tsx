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
 * Compact CaddieIQ Input style: 44px height, 14–16px radius, thin border,
 * dark glass, subtle focus glow. `!` utilities override Select primitive
 * defaults.
 */
const compactTriggerClass = cn(
  '!h-11 w-full !rounded-[15px] !border-white/[0.12] !bg-[#111418] !px-4 !text-sm !font-semibold !text-white',
  'relative overflow-hidden transition-all duration-200',
  'hover:!border-white/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
  'data-[popup-open]:!border-emerald-400/50 data-[popup-open]:shadow-[0_0_0_2px_rgba(52,209,122,0.1),0_8px_16px_rgba(0,0,0,0.2)]',
  '[&>svg]:!size-4 [&>svg]:text-muted-foreground',
)

const compactContentClass = cn(
  '!rounded-[15px] border border-white/[0.1] !bg-[#0D1318]/95 p-1.5 !shadow-[0_12px_32px_rgba(0,0,0,0.3)] ring-0 backdrop-blur-xl',
)

const compactItemClass = cn(
  'rounded-[12px] px-2.5 py-1.5 text-xs font-medium text-foreground/85',
  'data-[highlighted]:!bg-emerald-500/20 data-[highlighted]:!text-emerald-100',
  'data-[selected]:!bg-emerald-500/15 data-[selected]:!text-emerald-300',
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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
      {/* Search input — desktop fills, mobile full width */}
      <div className="group relative h-11 w-full overflow-hidden rounded-[15px] border border-white/[0.12] bg-[#111418] transition-all duration-200 hover:border-white/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] focus-within:border-emerald-400/50 focus-within:shadow-[0_0_0_2px_rgba(52,209,122,0.1),0_8px_16px_rgba(0,0,0,0.2)] lg:flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-emerald-400"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search players..."
          aria-label="Search players by name"
          className="relative h-full w-full bg-transparent pl-10 pr-3.5 text-sm font-medium text-white outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter dropdowns — desktop row, mobile two columns */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3 lg:gap-4">
        <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as FieldEntryStatus | 'ALL')}>
          <SelectTrigger aria-label="Filter by status" className={compactTriggerClass}>
            <SelectValue>
              {() => statusOptions.find((o) => o.value === statusFilter)?.label ?? 'Status'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className={compactContentClass}>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className={compactItemClass}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => onSortChange(value as SortKey)}>
          <SelectTrigger aria-label="Sort players" className={compactTriggerClass}>
            <SelectValue>{() => sortOptions.find((o) => o.value === sort)?.label ?? 'Sort'}</SelectValue>
          </SelectTrigger>
          <SelectContent className={compactContentClass}>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className={compactItemClass}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
