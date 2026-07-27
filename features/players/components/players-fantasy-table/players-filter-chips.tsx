'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FilterChip {
  id: string
  label: string
  active: boolean
  disabled?: boolean
  disabledReason?: string
}

interface PlayersFilterChipsProps {
  chips: FilterChip[]
  onChipClick: (chipId: string) => void
  onReset?: () => void
  hasActiveFilters?: boolean
}

/**
 * Filter chips row for fantasy table. Compact 34-36px height with dark
 * charcoal background, cool-gray border, and restrained emerald active state.
 */
export function PlayersFilterChips({
  chips,
  onChipClick,
  onReset,
  hasActiveFilters,
}: PlayersFilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2">
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => !chip.disabled && onChipClick(chip.id)}
          disabled={chip.disabled}
          title={chip.disabledReason}
          className={cn(
            'h-9 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
            'border border-white/[0.12]',
            chip.disabled
              ? 'opacity-50 cursor-not-allowed'
              : chip.active
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                : 'bg-white/[0.06] text-foreground/80 hover:bg-white/[0.1]',
          )}
        >
          {chip.label}
        </button>
      ))}

      {hasActiveFilters && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="ml-auto h-9 px-2 text-xs"
        >
          <X className="h-4 w-4" />
          <span className="ml-1">Reset</span>
        </Button>
      )}
    </div>
  )
}
