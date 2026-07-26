'use client'

import { cn } from '@/lib/utils'
import { DraftKingsMark } from '@/features/tournaments/components/draftkings-mark'
import type { ColumnDescriptor, TablePhase } from '@/features/tournaments/config/phase-table-config'

interface FantasyTableHeaderProps {
  columns: ColumnDescriptor[]
  fieldSize: number
  phase: TablePhase
  selectedRound?: number
  onRoundChange?: (round: number) => void
  availableRounds?: number[]
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
  selectedRound,
  onRoundChange,
  availableRounds = [1, 2, 3, 4],
}: FantasyTableHeaderProps) {
  return (
    <thead
      className={cn(
        'sticky top-0 z-40 bg-[#101619] border-b',
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
              'text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80 border-r',
            )}
            style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}
            title={col.tooltip}
          >
            <div className="flex flex-col items-center justify-center gap-0.5 h-full">
              {col.headerKind === 'player' ? (
                <span className="text-left flex-1">Players ({fieldSize})</span>
              ) : col.headerKind === 'dk' ? (
                <span className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                  <DraftKingsMark className="h-3 w-auto" />
                  <span>{col.label}</span>
                </span>
              ) : col.id === 'roundDna' ? (
                <div className="flex flex-col items-center justify-center gap-1.5 h-full">
                  <span className="text-[11px] sm:text-[12px] font-semibold text-emerald-400">{col.label}</span>
                </div>
              ) : (
                <>
                  <span className="text-[11px] sm:text-[12px] font-semibold">{col.label}</span>
                  {col.subtitle && (
                    <span className="text-[9px] sm:text-[10px] font-normal text-muted-foreground/60 tracking-wider">
                      {col.subtitle}
                    </span>
                  )}
                </>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  )
}
