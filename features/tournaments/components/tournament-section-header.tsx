'use client'

import { cn } from '@/lib/utils'

interface TournamentSectionHeaderProps {
  /** Section title: "Live", "Upcoming", "Recently Completed", "Historical" */
  title: string
  /** Number of tournaments in this section */
  count: number
  /** Optional accent color class */
  accentColor?: string
  className?: string
}

/**
 * Compact section header for status-aware tournament grouping.
 */
export function TournamentSectionHeader({
  title,
  count,
  accentColor = 'text-muted-foreground',
  className,
}: TournamentSectionHeaderProps) {
  return (
    <div className={cn('flex items-baseline gap-3', className)}>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">
        {title}
      </h2>
      <span className={cn('text-sm font-medium tabular-nums', accentColor)}>{count}</span>
    </div>
  )
}
