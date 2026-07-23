'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MobilePlayerNavigationProps {
  currentIndex: number
  players: Array<{
    id: string
    playerName: string
  }>
  onPreviousClick: () => void
  onNextClick: () => void
}

export function MobilePlayerNavigation({
  currentIndex,
  players,
  onPreviousClick,
  onNextClick,
}: MobilePlayerNavigationProps) {
  const currentPlayer = players[currentIndex]
  const previousPlayer = currentIndex > 0 ? players[currentIndex - 1] : null
  const nextPlayer = currentIndex < players.length - 1 ? players[currentIndex + 1] : null

  const handleClick = (e: React.MouseEvent, callback: () => void) => {
    e.stopPropagation()
    callback()
  }

  return (
    <div className="border-t border-[#343944] px-4 py-3 flex items-center justify-between text-sm">
      {/* Previous */}
      <button
        onClick={(e) => handleClick(e, onPreviousClick)}
        disabled={!previousPlayer}
        className="flex items-center gap-2 p-2 hover:bg-[#222836] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-xs text-[#9EA5B1]">
          {previousPlayer ? previousPlayer.playerName : ''}
        </span>
      </button>

      {/* Current */}
      <div className="text-center text-xs text-[#9EA5B1]">
        {currentIndex + 1} of {players.length}
      </div>

      {/* Next */}
      <button
        onClick={(e) => handleClick(e, onNextClick)}
        disabled={!nextPlayer}
        className="flex items-center gap-2 p-2 hover:bg-[#222836] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="text-xs text-[#9EA5B1]">
          {nextPlayer ? nextPlayer.playerName : ''}
        </span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
