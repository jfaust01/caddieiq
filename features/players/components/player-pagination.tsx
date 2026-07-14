'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlayerPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

/**
 * Compact, state-driven pagination for the directory. Renders a windowed set of
 * page numbers with previous/next controls.
 */
export function PlayerPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PlayerPaginationProps) {
  if (totalPages <= 1) return null

  // Window of up to 5 page numbers centered on the current page.
  const windowSize = 5
  const start = Math.max(1, Math.min(page - 2, totalPages - windowSize + 1))
  const end = Math.min(totalPages, start + windowSize - 1)
  const pages: number[] = []
  for (let i = start; i <= end; i += 1) pages.push(i)

  return (
    <nav
      aria-label="Player directory pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft />
      </Button>
      {start > 1 ? (
        <span className="px-1 text-sm text-muted-foreground" aria-hidden>
          …
        </span>
      ) : null}
      {pages.map((pageNumber) => (
        <Button
          key={pageNumber}
          variant={pageNumber === page ? 'outline' : 'ghost'}
          size="icon-sm"
          aria-label={`Page ${pageNumber}`}
          aria-current={pageNumber === page ? 'page' : undefined}
          className="tabular-nums"
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </Button>
      ))}
      {end < totalPages ? (
        <span className="px-1 text-sm text-muted-foreground" aria-hidden>
          …
        </span>
      ) : null}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight />
      </Button>
    </nav>
  )
}
