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
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-200',
              isActive
                ? accent.chipActive
                : 'border-white/[0.09] bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground',
              isDisabled &&
                'cursor-not-allowed opacity-40 hover:border-white/[0.09] hover:text-muted-foreground',
            )}
          >
            <span>{c.label}</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[11px] tabular-nums',
                isActive ? accent.chipCount : 'bg-white/[0.06] text-muted-foreground/80',
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
