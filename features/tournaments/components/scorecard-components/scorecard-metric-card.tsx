'use client'

import { cn } from '@/lib/utils'

type ScorecardModalPhase = 'scheduled' | 'live' | 'completed'

interface ScorecardMetricCardProps {
  label: string
  value: string | number | null
  detail?: string
  icon?: React.ComponentType<{ className?: string }>
  emphasis?: boolean
  phase: ScorecardModalPhase
  isLoading?: boolean
}

/** Phase-specific accent color classes. */
const phaseAccents: Record<ScorecardModalPhase, string> = {
  completed: 'text-sky-400',
  live: 'text-amber-400',
  scheduled: 'text-emerald-400',
}

/**
 * Reusable metric card for displaying single or grouped metrics.
 * Shows label, value, optional detail text, and optional icon.
 * Accent color adapts to tournament phase.
 */
export function ScorecardMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  emphasis = false,
  phase,
  isLoading = false,
}: ScorecardMetricCardProps) {
  const accentClass = phaseAccents[phase]
  const displayValue = value ?? '—'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[16px]',
        'border border-white/[0.08]',
        'bg-[#0c1318]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]',
        'p-4 sm:p-5'
      )}
    >
      {/* Accent top edge */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-0.5 pointer-events-none',
          emphasis ? accentClass : 'bg-white/[0.06]'
        )}
        aria-hidden="true"
      />

      {/* Glow in top-right when emphasized */}
      {emphasis && (
        <div
          className={cn(
            'absolute -top-8 -right-8 size-20 rounded-full blur-xl pointer-events-none opacity-20',
            accentClass === 'text-sky-400' ? 'bg-sky-400' : 
            accentClass === 'text-amber-400' ? 'bg-amber-400' : 
            'bg-emerald-400'
          )}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-2">
        {/* Label row */}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
          {Icon && <Icon className="size-4 opacity-70" />}
          <span>{label}</span>
        </div>

        {/* Value */}
        <div className={cn(
          'text-2xl sm:text-3xl font-bold tracking-tight',
          emphasis ? accentClass : 'text-white',
          isLoading && 'opacity-50'
        )}>
          {displayValue}
        </div>

        {/* Detail text */}
        {detail && (
          <div className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
            {detail}
          </div>
        )}
      </div>
    </div>
  )
}
