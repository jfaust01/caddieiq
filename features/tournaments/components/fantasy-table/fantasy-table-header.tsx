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
                <span className="flex items-center justify-center gap-1 flex-1 text-[11px] sm:text-[12px] font-semibold">Players ({fieldSize})</span>
              ) : col.headerKind === 'dk' ? (
                <span className="inline-flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] font-semibold">
                  <DraftKingsMark className="h-3 w-auto" />
                  <span>{col.label}</span>
                </span>
              ) : col.id === 'toPar' ? (
                <span className="text-[11px] sm:text-[12px] font-semibold">Round #</span>
              ) : col.label === `R1` ? (
                <span className="text-[11px] sm:text-[12px] font-semibold">R{selectedRound || 1}</span>
              ) : col.id === 'roundScore' ? (
                <span className="text-[11px] sm:text-[12px] font-semibold">{col.label}</span>
              ) : col.id === 'tournamentForm' ? (
                <div className="flex flex-col gap-1 h-full mt-[5px]">
                  <div className="flex flex-col items-center justify-center gap-1 mt-[5px]">
                    <span className="text-[11px] sm:text-[12px] font-semibold text-muted-foreground/70">{col.label}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4].map((round) => (
                        <button
                          key={`header-round-${round}`}
                          onClick={() => onRoundChange?.(round)}
                          className={cn(
                            'w-8 py-0.5 rounded text-[9px] font-semibold transition-all',
                            selectedRound === round
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white/5 border border-white/10 text-muted-foreground/70 hover:bg-white/10'
                          )}
                        >
                          R{round}
                        </button>
                      ))}
                    </div>
                  </div>
                  <svg className="w-full" height="20" viewBox="0 0 400 20" preserveAspectRatio="none">
                    {Array.from({ length: 18 }).map((_, i) => {
                      const holeNum = i + 1
                      const PADDING = 8
                      const DOT_GAP = 5
                      const USABLE_WIDTH = 400 - 2 * PADDING
                      const STEP_X = (USABLE_WIDTH - DOT_GAP * 17) / 17 + DOT_GAP
                      const xPos = PADDING + i * STEP_X
                      return (
                        <text
                          key={`hole-${holeNum}`}
                          x={xPos}
                          y={16}
                          textAnchor="middle"
                          fontSize="11"
                          fill="rgb(107, 114, 128)"
                          fontWeight="500"
                        >
                          {holeNum}
                        </text>
                      )
                    })}
                  </svg>
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
