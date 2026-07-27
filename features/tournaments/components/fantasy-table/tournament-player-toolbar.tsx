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
 * Compact toolbar control styles: 38-40px height, 8-10px radius,
 * dark inset inputs, subtle cool-gray border.
 */
const compactTriggerClass = cn(
  '!h-10 !rounded-[10px] !border-white/[0.12] !bg-[#111418] !px-3 !py-2.5 !text-xs !font-semibold !text-foreground',
  'relative overflow-hidden transition-all duration-200',
  'hover:!border-white/20 hover:!bg-white/[0.05]',
  'data-[state=open]:!border-white/20 data-[state=open]:!bg-white/[0.06]',
  '[&>svg]:!size-3.5 [&>svg]:text-muted-foreground',
)

const compactContentClass = cn(
  '!rounded-[10px] border border-white/[0.12] !bg-[#0D1318]/95 p-1 !shadow-[0_12px_32px_rgba(0,0,0,0.3)] ring-0 backdrop-blur-xl',
)

const compactItemClass = cn(
  'rounded-[8px] px-2 py-1.5 text-xs font-medium text-foreground/85',
  'data-[highlighted]:!bg-emerald-500/20 data-[highlighted]:!text-emerald-100',
  'data-[selected]:!bg-emerald-500/15 data-[selected]:!text-emerald-300',
)

export interface StatusOption {
  value: FieldEntryStatus | 'ALL'
  label: string
}

/**
 * Table toolbar inside the table shell. Desktop ordering: search (flex-1),
 * position/status dropdown, results dropdown, sort dropdown, spacer, columns.
 * Compact 38-40px controls with minimal spacing. Purely presentational — the
 * parent owns filter/sort state and option lists.
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
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3 px-4 py-3">
      {/* Search input — takes most width on desktop */}
      <div className="group relative h-10 w-full overflow-hidden rounded-[10px] border border-white/[0.12] bg-[#111418] transition-all duration-200 hover:border-white/20 focus-within:border-white/20 focus-within:bg-white/[0.05] lg:w-64">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors duration-200"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search players..."
          aria-label="Search players by name"
          className="relative h-full w-full bg-transparent pl-9 pr-3 text-xs font-medium text-white outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter controls — desktop row, mobile two columns */}
      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
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

        {/* Spacer on desktop */}
        <div className="hidden lg:flex-1 lg:block" />
      </div>
    </div>
  )
}
