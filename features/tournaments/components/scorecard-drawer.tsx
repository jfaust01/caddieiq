'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { ChevronUp, ChevronDown, X } from 'lucide-react'
import { ScorecardLoader } from './scorecard-loader'
import { ScorecardErrorBoundaryV2 } from './scorecard-error-boundary-v2'
import type { FieldEntrant } from '@/features/tournaments/types'
import { cn } from '@/lib/utils'

interface ScorecardDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedPlayerId: string | null
  onPlayerChange: (playerId: string) => void
  players: FieldEntrant[]
  tournamentId: string
  visiblePlayers: FieldEntrant[]
  status?: string | null
  initialRound?: number
}

export function ScorecardDrawer({
  isOpen,
  onOpenChange,
  selectedPlayerId,
  onPlayerChange,
  players,
  tournamentId,
  visiblePlayers,
  status,
  initialRound,
}: ScorecardDrawerProps) {
  const [selectedRound, setSelectedRound] = useState<number>(initialRound || 1)
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Update selected round when initialRound prop changes
  useEffect(() => {
    if (initialRound) {
      setSelectedRound(initialRound)
    }
  }, [initialRound])

  // Determine phase based on tournament status
  const phase = useMemo(() => {
    const normalizedStatus = status?.trim().toUpperCase()
    if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'COMPLETE' || normalizedStatus === 'FINAL') {
      return 'completed'
    }
    if (normalizedStatus === 'ACTIVE' || normalizedStatus === 'LIVE' || normalizedStatus === 'IN_PROGRESS' || normalizedStatus === 'IN-PROGRESS') {
      return 'live'
    }
    return 'scheduled'
  }, [status])

  // Find the selected player
  const selectedPlayer = useMemo(
    () => players.find((p) => p.playerId === selectedPlayerId),
    [selectedPlayerId, players]
  )

  // Find the index in visible players for navigation
  const visibleIndex = useMemo(
    () => visiblePlayers.findIndex((p) => p.playerId === selectedPlayerId),
    [selectedPlayerId, visiblePlayers]
  )

  const canGoPrevious = visibleIndex > 0
  const canGoNext = visibleIndex < visiblePlayers.length - 1

  const handlePreviousPlayer = useCallback(() => {
    if (canGoPrevious) {
      const previousPlayer = visiblePlayers[visibleIndex - 1]
      setSelectedRound(1)
      onPlayerChange(previousPlayer.playerId)
    }
  }, [canGoPrevious, visibleIndex, visiblePlayers, onPlayerChange])

  const handleNextPlayer = useCallback(() => {
    if (canGoNext) {
      const nextPlayer = visiblePlayers[visibleIndex + 1]
      setSelectedRound(1)
      onPlayerChange(nextPlayer.playerId)
    }
  }, [canGoNext, visibleIndex, visiblePlayers, onPlayerChange])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        handlePreviousPlayer()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        handleNextPlayer()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onOpenChange, handlePreviousPlayer, handleNextPlayer])

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus the drawer
      if (drawerRef.current) {
        drawerRef.current.focus()
      }
    } else {
      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  // Handle outside click
  const handleBackdropClick = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  if (!isOpen) return null

  if (!selectedPlayer) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/30 transition-opacity duration-300"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 right-0 h-screen z-[60] flex flex-col',
          'bg-slate-900',
          'border-l border-white/[0.08]',
          'shadow-[-20px_0_40px_rgba(0,0,0,0.5)]',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          // Responsive widths
          'w-full sm:w-[600px] lg:w-[800px]'
        )}
        role="dialog"
        aria-label="Player scorecard"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Header */}
        <div className={cn(
          'flex-shrink-0 sticky top-0 z-10',
          'bg-slate-900',
          'backdrop-blur-md',
          'border-b border-white/[0.08]',
          'px-4 lg:px-6 py-4 lg:py-5'
        )}>
          {/* Top Row: Player Info and Close */}
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Player Avatar and Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-emerald-500/60 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden">
                {selectedPlayer.headshotUrl ? (
                  <img
                    src={selectedPlayer.headshotUrl}
                    alt={selectedPlayer.playerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-sm font-bold text-white">
                    {selectedPlayer.playerName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Player Name and Stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <h2 className="text-sm font-bold text-white truncate">
                    {selectedPlayer.playerName}
                  </h2>
                  {selectedPlayer.countryCode && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {selectedPlayer.countryCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Position Badge */}
                  <div className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                    T{selectedPlayer.position || '—'}
                  </div>
                  {/* Score */}
                  <span className={cn(
                    'text-xs font-bold',
                    selectedPlayer.total && selectedPlayer.total < 0 ? 'text-emerald-400' : 'text-gray-300'
                  )}>
                    {selectedPlayer.total ? `${selectedPlayer.total > 0 ? '+' : ''}${selectedPlayer.total}` : '—'}
                  </span>
                  {/* Total Strokes */}
                  <span className="text-xs text-gray-400">
                    ({selectedPlayer.totalStrokes || 0})
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs Row */}
          <div className="flex items-center gap-6 mb-6 border-b border-white/[0.08] pb-4">
            <button className="text-xs font-semibold text-emerald-400 border-b-2 border-emerald-400 pb-4 -mb-4">
              SCORECARD
            </button>
            <button className="text-xs font-semibold text-gray-400 hover:text-gray-300 transition-colors pb-4 -mb-4">
              STATS
            </button>
            <button className="text-xs font-semibold text-gray-400 hover:text-gray-300 transition-colors pb-4 -mb-4">
              FANTASY
            </button>
          </div>

          {/* Round Selector and Score Display */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                ROUND
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((round) => (
                  <button
                    key={round}
                    onClick={() => setSelectedRound(round)}
                    className={cn(
                      'w-9 h-9 rounded border text-xs font-semibold transition-all',
                      selectedRound === round
                        ? 'bg-emerald-500/30 border-emerald-500/60 text-emerald-400'
                        : 'bg-white/5 border-white/[0.15] text-gray-300 hover:bg-white/10'
                    )}
                  >
                    {round}
                  </button>
                ))}
              </div>
            </div>

            {/* Score Display */}
            <div className="text-right">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                TO PAR
              </div>
              <div className="text-xl font-bold text-emerald-400 mb-2">
                {selectedPlayer.total !== null && selectedPlayer.total !== undefined
                  ? selectedPlayer.total > 0
                    ? `+${selectedPlayer.total}`
                    : selectedPlayer.total === 0
                      ? 'E'
                      : selectedPlayer.total
                  : '—'}
              </div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                TOTAL
              </div>
              <div className="text-xl font-bold text-emerald-400">
                {selectedPlayer.totalStrokes || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-w-0 bg-slate-900">
          <div className="px-4 lg:px-6 py-4 lg:py-6 w-full min-w-0 max-w-full">
            <ScorecardErrorBoundaryV2 playerName={selectedPlayer.playerName}>
              <ScorecardLoader
                playerId={selectedPlayer.playerId}
                playerName={selectedPlayer.playerName}
                tournamentId={tournamentId}
                roundNumber={selectedRound}
                phase={phase}
                isDrawerContext
              />
            </ScorecardErrorBoundaryV2>
          </div>
        </div>
      </div>
    </>
  )
}
