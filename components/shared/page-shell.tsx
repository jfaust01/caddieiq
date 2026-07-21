import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PageShellProps {
  children: ReactNode
  className?: string
}

/**
 * Consistent content container used by every route. Centralizes horizontal
 * padding, max width, and vertical rhythm so pages never re-implement layout.
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
