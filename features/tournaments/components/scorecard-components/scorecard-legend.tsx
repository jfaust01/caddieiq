'use client'

import { cn } from '@/lib/utils'

type ScorecardModalPhase = 'scheduled' | 'live' | 'completed'

interface ScorecardLegendProps {
  phase: ScorecardModalPhase
}

/** Phase-specific legends for score interpretation. */
const legends: Record<ScorecardModalPhase, Array<{ icon: string; label: string; color: string }>> = {
  completed: [
    { icon: '●', label: 'Eagle or better', color: 'text-green-400' },
    { icon: '○', label: 'Birdie', color: 'text-green-400/80' },
    { icon: '○', label: 'Par', color: 'text-white' },
    { icon: '□', label: 'Bogey', color: 'text-red-400/60' },
    { icon: '◆', label: 'Double bogey+', color: 'text-red-400' },
  ],
  live: [
    { icon: '●', label: 'Eagle or better', color: 'text-green-400' },
    { icon: '○', label: 'Birdie', color: 'text-green-400/80' },
    { icon: '○', label: 'Par', color: 'text-white' },
    { icon: '□', label: 'Bogey', color: 'text-red-400/60' },
    { icon: '◆', label: 'Double bogey+', color: 'text-red-400' },
    { icon: '●', label: 'Current hole', color: 'text-amber-400' },
  ],
  scheduled: [
    { icon: '▲', label: 'Better than field avg', color: 'text-green-400' },
    { icon: '○', label: 'Around field avg', color: 'text-white' },
    { icon: '▼', label: 'Worse than field avg', color: 'text-red-400' },
  ],
}

/**
 * Status-specific legend explaining score markers and data visualization.
 */
export function ScorecardLegend({ phase }: ScorecardLegendProps) {
  const items = legends[phase]

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 py-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <span className={cn('font-bold', item.color)}>{item.icon}</span>
          <span className="text-foreground/60">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
