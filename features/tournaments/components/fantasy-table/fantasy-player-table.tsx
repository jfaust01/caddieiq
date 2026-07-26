'use client'

import React from 'react'

import { useDragScroll } from '@/features/tournaments/hooks/use-drag-scroll'
import { usePlayerColumnWidth } from '@/features/tournaments/hooks/use-player-column-width'
import { buildPositionCountMap } from '@/features/tournaments/utils/format-position'
import type { FieldEntrant } from '@/features/tournaments/types'
import { type TablePhase, phaseTableConfig } from '@/features/tournaments/config/phase-table-config'
import type { DfsValueResult } from '@/lib/dfs-value'
import { cn } from '@/lib/utils'

import { FantasyTableScrollArea } from './fantasy-table-scroll-area'
import { FantasyTableHeader } from './fantasy-table-header'
import { FantasyTableBody } from './fantasy-table-body'
import { FantasyTableFooter } from './fantasy-table-footer'
import { PaginationFooter } from './pagination-footer'
import styles from '../tournament-field.module.css'

export interface FantasyPlayerTableProps {
  phase: TablePhase
  /** Already filtered + sorted entrants to render as rows. */
  entrants: FieldEntrant[]
  /** Full field, used for tie detection and the player-column autosizing. */
  allEntrants: FieldEntrant[]
  /** Total field size, shown in the Players header. */
  fieldSize: number
  /** DFS Value Model lookups for the scheduled fantasy columns. */
  dfsByPlayer: Map<string, DfsValueResult>
  /** Opens the scorecard modal for a player row. */
  onRowClick: (playerId: string) => void
  /** Opens scorecard with a specific round selected. */
  onRoundSelect?: (playerId: string, round: number) => void
  /** Optional: table toolbar component to render inside the shell. */
  toolbar?: React.ReactNode
  /** Pagination props */
  currentPage?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  totalItems?: number
}

/**
 * The single, shared, status-aware fantasy table using a structured component tree.
 * Phase config drives accent, columns, and footnote; phase selects the row renderer.
 * Scheduled / Live / Completed are configurations of this one component.
 *
 * Component tree:
 * - FantasyPlayerTable
 *   ├── FantasyTableScrollArea
 *   │   └── FantasyTableHeader
 *   └── FantasyTableBody
 *       └── FantasyPlayerRow (per entrant)
 * - FantasyTableFooter
 */
export function FantasyPlayerTable({
  phase,
  entrants,
  allEntrants,
  fieldSize,
  dfsByPlayer,
  onRowClick,
  onRoundSelect,
  toolbar,
  currentPage = 1,
  onPageChange,
  pageSize = 25,
  onPageSizeChange,
  totalItems,
}: FantasyPlayerTableProps) {
  const config = phaseTableConfig[phase]
  const { columns, footnote } = config
  const scrollContainerRef = useDragScroll({ dragThreshold: 5 })
  const playerColumnWidth = usePlayerColumnWidth(allEntrants, '.tournament-table-container')
  const positionCountMap = buildPositionCountMap(allEntrants)

  const [hasScrolled, setHasScrolled] = React.useState(false)
  
  // Determine default round based on tournament status and data
  const getDefaultRound = React.useMemo(() => {
    if (phase === 'live') {
      // For live tournaments, default to current round or latest completed
      return 4 // This will be updated based on API feedback
    }
    
    // For completed tournaments, default to R4 or latest played
    for (let round = 4; round >= 1; round--) {
      const hasData = entrants.some((e) => {
        const relToPar = e[`round${round}RelToPar` as keyof typeof e]
        return relToPar !== null && relToPar !== undefined
      })
      if (hasData) return round
    }
    
    return 1
  }, [phase, entrants])
  
  const [selectedRound, setSelectedRound] = React.useState(getDefaultRound)

  const handleTableScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      if (target.scrollLeft > 0 && !hasScrolled) {
        setHasScrolled(true)
      }
    },
    [hasScrolled],
  )

  return (
    <div
      className="w-full min-w-0 tournament-table-container"
      style={{ '--player-column-width': playerColumnWidth || '220px' } as React.CSSProperties}
    >
      <div 
        className="relative overflow-hidden rounded-[16px] border bg-[#0D1117]"
        style={{
          borderColor: 'rgba(120, 150, 165, 0.12)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.025)',
        }}
      >
        {/* Subtle inset highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[16px] bg-gradient-to-r from-transparent via-white/5 to-transparent"
        />

        <div className="relative z-10 flex flex-col min-h-0">
          {/* Toolbar inside table shell */}
          {toolbar && (
            <>
              {toolbar}
              <div className="border-t" style={{ borderColor: 'rgba(120, 150, 165, 0.12)' }} />
            </>
          )}

          {/* Round Selector Control */}
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(120, 150, 165, 0.12)' }}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground">ROUND:</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((round) => (
                  <button
                    key={`round-selector-${round}`}
                    onClick={() => setSelectedRound(round)}
                    className={cn(
                      'px-3 py-1.5 rounded font-semibold text-sm transition-all',
                      selectedRound === round
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10'
                    )}
                  >
                    R{round}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs text-muted-foreground/70">Showing hole-by-hole breakdown</span>
          </div>

          {/* Table scroll area — sticky header needs to be here */}
          <FantasyTableScrollArea hasScrolled={hasScrolled} onScroll={handleTableScroll} scrollContainerRef={scrollContainerRef}>
            <table className="border-collapse min-w-max">
              <colgroup>
                {columns.map((col) => (
                  <col key={col.id} className={col.colClassName} />
                ))}
              </colgroup>
              <FantasyTableHeader 
                columns={columns} 
                fieldSize={fieldSize} 
                phase={phase}
                selectedRound={selectedRound}
                onRoundChange={setSelectedRound}
              />
              <FantasyTableBody 
                entrants={entrants} 
                phase={phase} 
                dfsByPlayer={dfsByPlayer} 
                positionCountMap={positionCountMap} 
                onRowClick={onRowClick} 
                onRoundSelect={onRoundSelect}
                selectedRound={selectedRound}
              />
            </table>
          </FantasyTableScrollArea>

          {/* Footer separator */}
          <div className="border-t" style={{ borderColor: 'rgba(120, 150, 165, 0.12)' }} />
        </div>
      </div>

      {/* Pagination footer */}
      {onPageChange && onPageSizeChange && totalItems !== undefined && (
        <PaginationFooter
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}

      {/* Table footnote */}
      <div className="px-4 py-3">
        <FantasyTableFooter footnote={footnote} />
      </div>
    </div>
  )
}
