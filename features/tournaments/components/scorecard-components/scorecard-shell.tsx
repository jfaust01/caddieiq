'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ScorecardModalPhase = 'scheduled' | 'live' | 'completed'

interface ScorecardShellProps {
  children: React.ReactNode
  phase: ScorecardModalPhase
  onClose: () => void
  headerControls?: React.ReactNode
}

/** Accent color configuration for each tournament phase. */
const phaseAccents: Record<ScorecardModalPhase, { text: string; border: string; bg: string }> = {
  completed: {
    text: 'text-sky-400',
    border: 'border-sky-400/20',
    bg: 'bg-sky-400/[0.06]',
  },
  live: {
    text: 'text-amber-400',
    border: 'border-amber-400/20',
    bg: 'bg-amber-400/[0.06]',
  },
  scheduled: {
    text: 'text-emerald-400',
    border: 'border-emerald-400/20',
    bg: 'bg-emerald-400/[0.06]',
  },
}

/**
 * Premium modal shell for player scorecards.
 * Provides responsive container with phase-aware accent colors.
 * 
 * Desktop: 1580px max, 92vh max height, centered
 * Mobile: 8px margins, full viewport height
 */
export function ScorecardShell({ children, phase, onClose, headerControls }: ScorecardShellProps) {
  const accents = phaseAccents[phase]

  return (
    <div
      className={cn(
        // Base
        'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4',
        // Backdrop
        'bg-black/40'
      )}
      onClick={onClose}
      role="presentation"
    >
      {/* Modal container */}
      <div
        className={cn(
          // Layout
          'flex flex-col h-[calc(100vh-16px)] sm:h-[calc(100vh-32px)]',
          'w-full max-w-full',
          'lg:h-[min(92vh,980px)]',
          'lg:max-w-[min(94vw,1580px)]',
          // Styling
          'rounded-[22px] lg:rounded-[24px]',
          'border',
          'bg-[#0a0f14]/98',
          'shadow-[0_28px_90px_rgba(0,0,0,0.58)]',
          'overflow-hidden'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent top edge */}
        <div
          className={cn(
            'absolute top-0 inset-x-0 h-0.5 pointer-events-none',
            accents.bg
          )}
          aria-hidden="true"
        />

        {/* Glow effect in top-right */}
        <div
          className={cn(
            'absolute -top-32 -right-32 size-64 rounded-full blur-3xl pointer-events-none opacity-40',
            accents.bg
          )}
          aria-hidden="true"
        />

        {/* Header row */}
        <div className={cn(
          'flex-shrink-0 sticky top-0 z-20',
          'bg-gradient-to-b from-black/40 to-transparent',
          'backdrop-blur-md',
          'border-b',
          accents.border,
          'flex items-center justify-between',
          'h-14 sm:h-16 px-4 sm:px-6 py-3'
        )}>
          <div className="flex-1" />
          {headerControls && (
            <div className="flex items-center gap-2">
              {headerControls}
            </div>
          )}
          <button
            onClick={onClose}
            className={cn(
              'ml-2 p-2 rounded-lg transition-colors',
              'hover:bg-white/5 text-foreground/60 hover:text-foreground'
            )}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-w-0 min-h-0">
          <div className="w-full min-w-0 max-w-full p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
