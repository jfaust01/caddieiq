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
}: ScorecardDrawerProps) {
  const [selectedRound, setSelectedRound] = useState<number>(1)
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

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
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 right-0 h-screen z-50 flex flex-col',
          'bg-gradient-to-br from-blue-900/20 via-slate-900/40 to-slate-900/50',
          'border-l border-white/[0.08]',
          'shadow-[-20px_0_40px_rgba(0,0,0,0.5)]',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          // Responsive widths
          'w-full sm:w-[420px] lg:w-[480px]'
        )}
        role="dialog"
        aria-label="Player scorecard"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Header */}
        <div className={cn(
          'flex-shrink-0 sticky top-0 z-10',
          'bg-gradient-to-b from-slate-900/80 to-slate-900/40',
          'backdrop-blur-md',
          'border-b border-white/[0.08]',
          'px-4 lg:px-6 py-4 lg:py-5'
        )}>
          {/* Player Info Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-white truncate">
                  {selectedPlayer.playerName}
                </h2>
                {selectedPlayer.country && (
                  <span className="text-sm text-gray-400 flex-shrink-0">
                    {selectedPlayer.country}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-baseline gap-1">
                  <span className="text-gray-400">Position:</span>
                  <span className="font-bold text-emerald-400">
                    {selectedPlayer.position ? `T${selectedPlayer.position}` : '—'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-gray-400">Score:</span>
                  <span className={cn(
                    'font-bold',
                    selectedPlayer.total && selectedPlayer.total < 0 ? 'text-emerald-400' : 'text-white'
                  )}>
                    {selectedPlayer.total ? `${selectedPlayer.total > 0 ? '+' : ''}${selectedPlayer.total}` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={handlePreviousPlayer}
                disabled={!canGoPrevious}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  canGoPrevious
                    ? 'hover:bg-white/10 text-white'
                    : 'opacity-30 cursor-not-allowed text-white/50'
                )}
                aria-label="Previous player"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextPlayer}
                disabled={!canGoNext}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  canGoNext
                    ? 'hover:bg-white/10 text-white'
                    : 'opacity-30 cursor-not-allowed text-white/50'
                )}
                aria-label="Next player"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white ml-1"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Round Selector */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((round) => (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  selectedRound === round
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/[0.08]'
                )}
              >
                R{round}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="px-4 lg:px-6 py-4 lg:py-6 w-full min-w-0 max-w-full">
            <ScorecardErrorBoundaryV2 playerName={selectedPlayer.playerName}>
              <ScorecardLoader
                playerId={selectedPlayer.playerId}
                playerName={selectedPlayer.playerName}
                tournamentId={tournamentId}
                roundNumber={selectedRound}
                phase={phase}
              />
            </ScorecardErrorBoundaryV2>
          </div>
        </div>
      </div>
    </>
  )
}
