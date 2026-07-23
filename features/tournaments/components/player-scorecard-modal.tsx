'use client'

import { useState, useCallback, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'
import { ScorecardLoader } from './scorecard-loader'
import { ScorecardErrorBoundaryV2 } from './scorecard-error-boundary-v2'
import type { FieldEntrant } from '@/features/tournaments/types'
import { cn } from '@/lib/utils'

interface PlayerScorecardModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedPlayerId: string | null
  onPlayerChange: (playerId: string) => void
  players: FieldEntrant[]
  tournamentId: string
  visiblePlayers: FieldEntrant[]
}

export function PlayerScorecardModal({
  isOpen,
  onOpenChange,
  selectedPlayerId,
  onPlayerChange,
  players,
  tournamentId,
  visiblePlayers,
}: PlayerScorecardModalProps) {
  const [selectedRound, setSelectedRound] = useState<number>(1)

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

  if (!selectedPlayer) {
    return null
  }

  // Early return for testing modal visibility
  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "flex max-h-[92vh] w-[min(96vw,1700px)] max-w-none flex-col overflow-hidden p-0 z-50",
          "bg-black/20 backdrop-blur-xl border border-white/[0.06]",
          "md:rounded-3xl rounded-2xl",
          "shadow-[0_20px_64px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]"
        )}
        showCloseButton={false}
      >
        {/* Premium Modal Header - Sticky */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-md border-b border-white/[0.05] px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Previous Button */}
            <button
              onClick={handlePreviousPlayer}
              disabled={!canGoPrevious}
              className={cn(
                "flex-shrink-0 p-2 rounded-lg transition-colors",
                canGoPrevious
                  ? "hover:bg-white/[0.08] cursor-pointer text-white"
                  : "opacity-30 cursor-not-allowed text-white/50"
              )}
              aria-label="Previous player"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Player Name */}
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold truncate text-white">
                {selectedPlayer.playerName}
              </h2>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextPlayer}
              disabled={!canGoNext}
              className={cn(
                "flex-shrink-0 p-2 rounded-lg transition-colors",
                canGoNext
                  ? "hover:bg-white/[0.08] cursor-pointer text-white"
                  : "opacity-30 cursor-not-allowed text-white/50"
              )}
              aria-label="Next player"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Close Button */}
          <DialogClose className="flex-shrink-0 p-2 rounded-lg hover:bg-white/[0.08] transition-colors ml-2 text-white">
            <X className="h-5 w-5" />
            <span className="sr-only">Close modal</span>
          </DialogClose>
        </div>

        {/* Modal Content with Premium Scrolling */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="p-10 lg:p-10">
            <ScorecardErrorBoundaryV2 playerName={selectedPlayer.playerName}>
              <ScorecardLoader
                playerId={selectedPlayer.playerId}
                playerName={selectedPlayer.playerName}
                tournamentId={tournamentId}
                roundNumber={selectedRound}
              />
            </ScorecardErrorBoundaryV2>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
