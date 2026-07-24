'use client'

import { cn } from '@/lib/utils'

interface ScorecardSegmentedControlProps {
  rounds: string[]
  activeRound: string
  onRoundChange: (round: string) => void
  className?: string
}

export function ScorecardSegmentedControl({
  rounds,
  activeRound,
  onRoundChange,
  className,
}: ScorecardSegmentedControlProps) {
  return (
    <div
      className={cn(
        'w-full grid grid-cols-4 gap-1',
        'rounded-xl',
        'border border-white/[0.08]',
        'bg-white/[0.025]',
        'backdrop-blur-sm',
        'p-1',
        className
      )}
    >
      {rounds.map(round => (
        <button
          key={round}
          onClick={() => onRoundChange(round)}
          className={cn(
            'min-h-11 px-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
            'uppercase tracking-wider',
            'flex items-center justify-center',
            activeRound === round
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-[0_2px_8px_rgba(16,185,129,0.2)]'
              : 'text-white/60 hover:text-white/80'
          )}
        >
          {round}
        </button>
      ))}
    </div>
  )
}
