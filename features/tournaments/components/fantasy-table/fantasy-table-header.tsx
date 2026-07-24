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
 * Uses dark blue-black background slightly lighter than body rows with subtle
 * vertical column dividers and proper text alignment.
 */
export function FantasyTableHeader({
  columns,
  fieldSize,
  phase,
}: FantasyTableHeaderProps) {
  return (
    <thead
      className={cn(
        'sticky top-[94px] z-30 bg-[#101619]/90 backdrop-blur-sm border-b',
        'before:content-[\'\'] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:pointer-events-none',
        phase === 'scheduled'
          ? 'before:bg-gradient-to-r before:from-transparent before:via-emerald-400/50 before:to-transparent'
          : phase === 'live'
            ? 'before:bg-gradient-to-r before:from-transparent before:via-amber-400/50 before:to-transparent'
            : 'before:bg-gradient-to-r before:from-transparent before:via-sky-400/50 before:to-transparent',
      )}
      style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}
    >
      <tr>
        {columns.map((col, idx) => (
          <th
            key={col.id}
            className={cn(
              col.thClassName,
              'relative text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 border-r',
              'transition-colors duration-150',
            )}
            style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}
            title={col.tooltip}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 h-full">
              {col.headerKind === 'player' ? (
                <span className="text-left flex-1">Players ({fieldSize})</span>
              ) : col.headerKind === 'dk' ? (
                <span className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                  <DraftKingsMark className="h-3 w-auto" />
                  <span>{col.label}</span>
                </span>
              ) : (
                <span>{col.label}</span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  )
}
