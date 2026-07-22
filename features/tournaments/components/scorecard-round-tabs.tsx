'use client'

interface ScorecardRoundTabsProps {
  selectedRound: number
  onRoundChange: (round: number) => void
}

export function ScorecardRoundTabs({
  selectedRound,
  onRoundChange,
}: ScorecardRoundTabsProps) {
  const handleTabClick = (round: number) => (e: React.MouseEvent) => {
    e.stopPropagation()
    onRoundChange(round)
  }

  return (
    <div className="flex border-b border-[#343944]">
      {[1, 2, 3, 4].map((round) => (
        <button
          key={round}
          onClick={handleTabClick(round)}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
            selectedRound === round
              ? 'text-white'
              : 'text-[#9EA5B1] hover:text-white'
          }`}
        >
          R{round}
          {selectedRound === round && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#22C55E]"></div>
          )}
        </button>
      ))}
    </div>
  )
}
