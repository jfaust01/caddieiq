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
        'w-[90vw] mx-auto',
        maxWidth,
        'rounded-3xl',
        'border border-white/[0.06]',
        'bg-gradient-to-br from-white/[0.04] to-white/[0.01]',
        'backdrop-blur-xl',
        'shadow-[0_20px_64px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]',
        'p-6 sm:p-8',
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
