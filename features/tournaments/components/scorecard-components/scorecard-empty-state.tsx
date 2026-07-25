'use client'

import { cn } from '@/lib/utils'

interface ScorecardEmptyStateProps {
  message: string
  detail?: string
  className?: string
}

/**
 * Premium empty state for missing or unavailable data.
 * Never shows fabricated values; displays honest explanations.
 */
export function ScorecardEmptyState({
  message,
  detail,
  className,
}: ScorecardEmptyStateProps) {
  return (
    <div
      className={cn(
        'px-4 py-6 sm:py-8 rounded-lg bg-white/[0.02] border border-white/[0.08]',
        'text-center',
        className
      )}
    >
      <div className="text-sm sm:text-base font-semibold text-foreground/70 mb-1">
        {message}
      </div>
      {detail && (
        <div className="text-xs sm:text-sm text-foreground/50">
          {detail}
        </div>
      )}
    </div>
  )
}
