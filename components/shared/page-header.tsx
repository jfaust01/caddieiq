import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** Primary action, rendered last and emphasized. */
  actions?: ReactNode
  /** Secondary actions, rendered before the primary action. */
  secondaryActions?: ReactNode
  /** Optional breadcrumb trail rendered above the title. */
  breadcrumbs?: ReactNode
  eyebrow?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  secondaryActions,
  breadcrumbs,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4', className)}>
      {breadcrumbs ? <div>{breadcrumbs}</div> : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <span className="text-xs font-medium tracking-widest text-primary uppercase">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions || secondaryActions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {secondaryActions}
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}
