'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { listRankingTypes, getRankingDefinition, type RankingType } from '@/lib/ranking'
import { cn } from '@/lib/utils'

interface RankingTabsProps {
  activeType: RankingType
}

/**
 * Ranking-type navigation. Each tab is a real route (`/rankings/[type]`) so the
 * selected board is linkable and keyboard-navigable. Renders as a scrollable,
 * underline-style tablist.
 */
export function RankingTabs({ activeType }: RankingTabsProps) {
  const types = listRankingTypes()

  return (
    <nav
      aria-label="Ranking types"
      className="-mb-px flex gap-1 overflow-x-auto border-b border-border"
    >
      {types.map((type) => {
        const definition = getRankingDefinition(type)
        const isActive = type === activeType
        return (
          <Link
            key={type}
            href={`/rankings/${type}`}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-t-md focus-visible:outline-2 focus-visible:outline-ring',
              isActive && 'border-primary text-foreground',
            )}
          >
            {definition.label}
            {definition.comingSoon ? (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                Soon
              </Badge>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
