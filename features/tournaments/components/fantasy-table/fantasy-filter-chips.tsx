import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PhaseAccent } from '@/features/tournaments/config/phase-table-config'

export interface FilterChip {
  id: string
  label: string
  count: number
}

/**
 * Status-aware quick-filter chips. Chips are supplied already-filtered for
 * availability by the parent (chips whose backing data is absent are omitted).
 * A supported chip with zero current matches renders disabled. The active chip
 * uses the phase accent. Chips scroll horizontally on smaller screens and wrap
 * on desktop. The Filters button appears at the far right on desktop.
 */
export function FantasyFilterChips({
  chips,
  active,
  onSelect,
  accent,
}: {
  chips: FilterChip[]
  active: string
  onSelect: (id: string) => void
  accent: PhaseAccent
}) {
  return (
    <div
      className="flex flex-nowrap items-center gap-2 overflow-x-auto lg:flex-wrap"
      role="group"
      aria-label="Quick filters"
    >
      {/* Chips container */}
      <div className="flex flex-nowrap gap-2 lg:flex-wrap">
        {chips.map((c) => {
          const isActive = active === c.id
          const isDisabled = c.id !== 'all' && c.count === 0
          return (
            <button
              key={c.id}
              type="button"
              disabled={isDisabled}
              aria-pressed={isActive}
              onClick={() => onSelect(c.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-xs font-semibold transition-all duration-200 h-9',
                isActive
                  ? cn(
                      'border-transparent bg-gradient-to-b from-emerald-500/90 to-emerald-600/90 text-white shadow-sm',
                      'from-emerald-400/95 to-emerald-500/85'
                    )
                  : 'border-white/[0.12] bg-[#111418] text-muted-foreground hover:border-white/20 hover:bg-white/[0.06]',
                isDisabled && 'cursor-not-allowed opacity-40 hover:border-white/[0.12] hover:bg-[#111418]',
              )}
            >
              <span className="leading-tight">{c.label}</span>
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none',
                  isActive ? 'bg-white/[0.2] text-white' : 'bg-white/[0.08] text-muted-foreground/70',
                )}
              >
                {c.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters button at far right on desktop, appears after chips on mobile */}
      <button
        type="button"
        aria-label="Open advanced filters"
        className="hidden lg:inline-flex shrink-0 items-center gap-2 rounded-[12px] border border-white/[0.12] bg-[#111418] px-3 h-9 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]"
      >
        <Filter className="h-3.5 w-3.5" />
        <span>Filters</span>
      </button>
    </div>
  )
}
