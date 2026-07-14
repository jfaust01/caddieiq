import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Kbd({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <kbd
      className={cn(
        'pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
