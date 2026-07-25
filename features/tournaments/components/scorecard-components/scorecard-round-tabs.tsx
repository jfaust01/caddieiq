'use client'

import { cn } from '@/lib/utils'

type ScorecardModalPhase = 'scheduled' | 'live' | 'completed'

interface RoundTabsProps {
  selectedRound: number
  onSelectRound: (round: number) => void
  phase: ScorecardModalPhase
  roundScores?: Record<number, number | null>
  currentRound?: number
  isLoading?: boolean
}

/** Phase-specific accent color classes. */
const phaseAccents: Record<ScorecardModalPhase, string> = {
  completed: 'border-sky-400 text-sky-400',
  live: 'border-amber-400 text-amber-400',
  scheduled: 'border-emerald-400 text-emerald-400',
}

const phaseBg: Record<ScorecardModalPhase, string> = {
  completed: 'bg-sky-400/10 hover:bg-sky-400/15',
  live: 'bg-amber-400/10 hover:bg-amber-400/15',
  scheduled: 'bg-emerald-400/10 hover:bg-emerald-400/15',
}

/**
 * Status-aware round tabs for scorecard navigation.
 * 
 * Completed: R1, R2, R3, R4 with scores
 * Live: Completed rounds + R2 LIVE for current, future rounds muted
 * Scheduled: R1 PREVIEW, R2, R3, R4 (future muted)
 */
export function ScorecardRoundTabs({
  selectedRound,
  onSelectRound,
  phase,
  roundScores,
  currentRound,
  isLoading = false,
}: RoundTabsProps) {
  const rounds = [1, 2, 3, 4]
  const accentClass = phaseAccents[phase]
  const bgClass = phaseBg[phase]

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
      {rounds.map((round) => {
        const isSelected = selectedRound === round
        const isLive = phase === 'live' && round === currentRound
        const score = roundScores?.[round]
        const isFuture = phase === 'live' && round > (currentRound || 0)
        const isPreview = phase === 'scheduled' && round === 1
        const isScheduledFuture = phase === 'scheduled' && round > 1

        // Determine label
        let label = `R${round}`
        if (isLive) label = `R${round} LIVE`
        if (isPreview) label = 'R1 PREVIEW'

        return (
          <button
            key={round}
            onClick={() => onSelectRound(round)}
            disabled={isFuture || isScheduledFuture || isLoading}
            className={cn(
              // Base
              'px-3 sm:px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
              'text-sm sm:text-base whitespace-nowrap shrink-0',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              // Selected state
              isSelected && 'border-2',
              isSelected && accentClass,
              isSelected && bgClass,
              // Unselected state
              !isSelected && 'border border-white/[0.12] text-foreground/70 hover:text-foreground hover:bg-white/5',
              // Live indicator
              isLive && 'animate-pulse'
            )}
          >
            <span className="flex items-center gap-2">
              {label}
              {score !== null && score !== undefined && (
                <span className={cn('text-xs font-mono', isSelected && accentClass)}>
                  {score < 0 ? `−${Math.abs(score)}` : `+${score}`}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
