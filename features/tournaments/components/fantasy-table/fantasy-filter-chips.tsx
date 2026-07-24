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
 * uses the phase accent.
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
      className="flex flex-nowrap gap-2 overflow-x-auto pb-1 lg:flex-wrap"
      role="group"
      aria-label="Quick filters"
    >
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
              'inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200 h-8',
              isActive
                ? accent.chipActive
                : 'border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:border-white/15 hover:text-foreground',
              isDisabled &&
                'cursor-not-allowed opacity-35 hover:border-white/[0.1] hover:text-muted-foreground',
            )}
          >
            <span className="leading-tight">{c.label}</span>
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-md px-1 py-0.5 text-[10px] font-bold tabular-nums leading-none',
                isActive ? accent.chipCount : 'bg-white/[0.08] text-muted-foreground/70',
              )}
            >
              {c.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
