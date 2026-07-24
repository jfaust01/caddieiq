'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import styles from '../tournament-field.module.css'

interface FantasyTableScrollAreaProps {
  children: React.ReactNode
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
  hasScrolled?: boolean
}

/**
 * Scrollable container for the fantasy table with mobile scroll hint.
 * Provides drag-to-scroll functionality, tracks scroll state, and maintains
 * proper stacking context for sticky table headers.
 */
export function FantasyTableScrollArea({
  children,
  onScroll,
  hasScrolled = false,
}: FantasyTableScrollAreaProps) {
  return (
    <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
      {/* Mobile scroll hint — hidden after first scroll */}
      {!hasScrolled && (
        <div className="sm:hidden text-xs text-muted-foreground py-3 flex items-center gap-1 px-4 transition-opacity duration-300">
          <span>Scroll for more →</span>
        </div>
      )}
      <div
        onScroll={onScroll}
        className={cn('overflow-x-auto sm:overflow-x-visible select-none flex-1', styles.scrollContainer)}
        style={{ userSelect: 'none', maxWidth: '100%' }}
      >
        {children}
      </div>
    </div>
  )
}
