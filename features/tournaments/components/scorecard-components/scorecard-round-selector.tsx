'use client'

import { cn } from '@/lib/utils'

interface ScorecardRoundSelectorProps {
  currentRound: number
  phase: 'scheduled' | 'live' | 'completed'
}

/**
 * Display-only round indicator for scorecard.
 * Shows which round is currently being viewed.
 */
export function ScorecardRoundSelector({
  currentRound,
  phase,
}: ScorecardRoundSelectorProps) {
  const rounds = [1, 2, 3, 4]
  
  // Color based on phase
  const accentColor = phase === 'completed' ? 'text-sky-300' : phase === 'live' ? 'text-amber-300' : 'text-emerald-300'

  return (
    <div className="flex gap-2">
      {rounds.map((round) => (
        <div
          key={round}
          className={cn(
            'px-3 py-2 rounded-lg font-semibold text-sm',
            round === currentRound
              ? cn('border-2 bg-white/[0.08]', accentColor.replace('text-', 'border-'))
              : 'border border-white/[0.12] text-white/40'
          )}
        >
          R{round}
        </div>
      ))}
    </div>
  )
}
