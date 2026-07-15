import Link from 'next/link'

import { cn } from '@/lib/utils'

import { RANKING_TYPE_OPTIONS } from '../categories'

interface RankingTabsProps {
  /** Slug of the active ranking type. */
  activeSlug: string
}

/**
 * Ranking-type navigation for the live directory. Each tab is a real route
 * (`/rankings/[type]`) so the selected board is linkable and keyboard
 * navigable. Every tab corresponds to a real engine category (no "coming soon"
 * placeholders) — the options come straight from the engine's category catalog.
 */
export function RankingTabs({ activeSlug }: RankingTabsProps) {
  return (
    <nav
      aria-label="Ranking types"
      className="-mb-px flex gap-1 overflow-x-auto border-b border-border"
    >
      {RANKING_TYPE_OPTIONS.map((option) => {
        const isActive = option.slug === activeSlug
        return (
          <Link
            key={option.slug}
            href={`/rankings/${option.slug}`}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-t-md focus-visible:outline-2 focus-visible:outline-ring',
              isActive && 'border-primary text-foreground',
            )}
          >
            {option.label}
          </Link>
        )
      })}
    </nav>
  )
}
