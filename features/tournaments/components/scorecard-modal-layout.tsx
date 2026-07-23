'use client'

import { cn } from '@/lib/utils'

interface ScorecardModalLayoutProps {
  children: React.ReactNode
  maxWidth?: string
  className?: string
}

/**
 * Premium modal layout wrapper for player scorecard.
 * Handles responsive sizing and padding:
 * - Desktop: 90vw max-w-6xl (max 1400px)
 * - Mobile: full width with side padding
 */
export function ScorecardModalLayout({
  children,
  maxWidth = 'max-w-6xl',
  className,
}: ScorecardModalLayoutProps) {
  return (
    <div
      className={cn(
        'relative w-full min-w-0 max-w-full',
        'rounded-3xl',
        'border border-white/[0.06]',
        'bg-gradient-to-br from-white/[0.04] to-white/[0.01]',
        'p-4 sm:p-6 lg:p-8',
        className
      )}
    >
      {/* Accent line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent rounded-t-3xl"
      />

      {/* Glow effect */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-emerald-500/[0.08] blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
