'use client'

import { LayoutGrid, List } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ViewMode } from '@/features/players/types'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  className?: string
}

/** Grid/list layout switch for the player directory. */
export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Toggle layout"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5',
        className,
      )}
    >
      <Button
        variant={view === 'grid' ? 'outline' : 'ghost'}
        size="icon-sm"
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        onClick={() => onViewChange('grid')}
      >
        <LayoutGrid />
      </Button>
      <Button
        variant={view === 'list' ? 'outline' : 'ghost'}
        size="icon-sm"
        aria-label="List view"
        aria-pressed={view === 'list'}
        onClick={() => onViewChange('list')}
      >
        <List />
      </Button>
    </div>
  )
}
