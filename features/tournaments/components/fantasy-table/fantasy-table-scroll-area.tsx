'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import tourStyles from '../tournament-field.module.css'

interface FantasyTableScrollAreaProps {
  children: React.ReactNode
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
  hasScrolled?: boolean
  scrollContainerRef?: React.RefObject<HTMLDivElement>
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
  scrollContainerRef,
}: FantasyTableScrollAreaProps) {
  return (
    <>
      {/* Mobile scroll hint — hidden after first scroll */}
      {!hasScrolled && (
        <div className="sm:hidden text-xs text-muted-foreground py-3 flex items-center gap-1 px-4 transition-opacity duration-300">
          <span>Scroll for more →</span>
        </div>
      )}
      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
        className={cn('overflow-x-auto select-none flex-1 min-w-0', tourStyles.scrollContainer)}
        style={{ userSelect: 'none' }}
      >
        {children}
      </div>
    </>
  )
}
