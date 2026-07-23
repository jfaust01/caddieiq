'use client'

import { cn } from '@/lib/utils'

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
    <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02] inline-flex">
      {[1, 2, 3, 4].map((round, index) => (
        <button
          key={round}
          onClick={handleTabClick(round)}
          className={cn(
            'flex-1 py-3 px-6 text-lg font-semibold transition-all',
            'border-r border-white/[0.05] last:border-r-0',
            selectedRound === round
              ? 'bg-teal-900/40 text-emerald-300'
              : 'text-gray-400 hover:text-gray-300'
          )}
        >
          R{round}
        </button>
      ))}
    </div>
  )
}
