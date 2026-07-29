'use client'

import { cn } from '@/lib/utils'

interface ScorecardRoundSelectorProps {
  currentRound: number
  phase: 'scheduled' | 'live' | 'completed'
  onRoundSelect?: (round: number) => void
}

/**
 * Interactive round selector for scorecard.
 * Allows switching between rounds and shows which round is currently being viewed.
 */
export function ScorecardRoundSelector({
  currentRound,
  phase,
  onRoundSelect,
}: ScorecardRoundSelectorProps) {
  const rounds = [1, 2, 3, 4]
  
  // Color based on phase
  const accentColor = phase === 'completed' ? 'sky' : phase === 'live' ? 'amber' : 'emerald'

  return (
    <div className="flex gap-2">
      {rounds.map((round) => (
        <button
          key={round}
          onClick={() => onRoundSelect?.(round)}
          className={cn(
            'px-3 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer',
            round === currentRound
              ? `border-2 bg-${accentColor}-500/15 border-${accentColor}-300 text-${accentColor}-300`
              : 'border border-white/[0.12] text-white/40 hover:text-white/60 hover:border-white/[0.2]'
          )}
        >
          R{round}
        </button>
      ))}
    </div>
  )
}
