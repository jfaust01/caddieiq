'use client'

import { cn } from '@/lib/utils'

interface ToolbarFilterChip {
  id: string
  label: string
  isActive: boolean
}

interface PlayersTableToolbarProps {
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  filterChips?: ToolbarFilterChip[]
  onFilterChip?: (chipId: string) => void
  className?: string
}

/**
 * Toolbar for players table with search input, status/position filters, and responsive layout.
 * Matches reference design with proper spacing, typography, and filter chip styling.
 */
export function PlayersTableToolbar({
  searchPlaceholder = 'Search players...',
  onSearch,
  filterChips = [],
  onFilterChip,
  className,
}: PlayersTableToolbarProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:gap-6', className)}>
      {/* Search and dropdown filters row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
        {/* Search input */}
        <div className="w-full sm:w-auto sm:flex-1 max-w-sm">
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border bg-[#0D1117] text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}
          />
        </div>

        {/* Dropdown filters (AI Players, Elite Plays, Value Plays, etc.) */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button className="px-3 py-2 rounded-lg text-xs font-medium border bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20">
            All Players
          </button>
          <button className="px-3 py-2 rounded-lg text-xs font-medium border text-muted-foreground hover:bg-[#0F1419]" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
            Elite Plays
          </button>
          <button className="px-3 py-2 rounded-lg text-xs font-medium border text-muted-foreground hover:bg-[#0F1419]" style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}>
            Value Plays
          </button>
        </div>
      </div>

      {/* Filter chips row (AI Rating, Elite, Safe, Value, Form, etc.) */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onFilterChip?.(chip.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                chip.isActive
                  ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                  : 'bg-transparent text-muted-foreground/80 border border-muted-foreground/20 hover:border-muted-foreground/40'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
