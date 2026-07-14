import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
  as: Heading = 'h2',
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <Heading className="text-xl font-semibold tracking-tight text-balance">
          {title}
        </Heading>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
