'use client'

import { cn } from '@/lib/utils'
import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import type { ColumnDescriptor, TablePhase } from '@/features/tournaments/config/phase-table-config'

interface FantasyTableHeaderProps {
  columns: ColumnDescriptor[]
  fieldSize: number
  phase: TablePhase
}

/**
 * Sticky table header with phase-colored accent line and column definitions.
 * Header sticks to top of page accounting for page header height (94px).
 */
export function FantasyTableHeader({
  columns,
  fieldSize,
  phase,
}: FantasyTableHeaderProps) {
  return (
    <thead
      className={cn(
        'sticky top-[94px] z-30 bg-[#0D1117]/80 backdrop-blur-md border-b border-white/[0.06]',
        'before:content-[\'\'] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:pointer-events-none',
        phase === 'scheduled'
          ? 'before:bg-gradient-to-r before:from-transparent before:via-emerald-400/50 before:to-transparent'
          : phase === 'live'
            ? 'before:bg-gradient-to-r before:from-transparent before:via-amber-400/50 before:to-transparent'
            : 'before:bg-gradient-to-r before:from-transparent before:via-sky-400/50 before:to-transparent',
      )}
    >
      <tr>
        {columns.map((col) => (
          <th
            key={col.id}
            className={cn(
              col.thClassName,
              'relative text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
            )}
            title={col.tooltip}
          >
            {col.headerKind === 'player' ? (
              `Players (${fieldSize})`
            ) : col.headerKind === 'dk' ? (
              <span className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                <DraftKingsMark className="h-3 w-auto" />
                <span>{col.label}</span>
              </span>
            ) : (
              col.label
            )}
          </th>
        ))}
      </tr>
    </thead>
  )
}
