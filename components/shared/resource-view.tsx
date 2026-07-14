import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import { SearchBar } from '@/components/shared/search-bar'

export interface ResourceViewProps {
  eyebrow: string
  title: string
  description: string
  searchPlaceholder: string
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  actions?: ReactNode
  emptyAction?: ReactNode
}

/**
 * Shared scaffold for data-backed list routes (players, tournaments, courses,
 * rankings). Renders a consistent header, toolbar, and empty state until the
 * corresponding data layer is connected in a later phase.
 */
export function ResourceView({
  eyebrow,
  title,
  description,
  searchPlaceholder,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  actions,
  emptyAction,
}: ResourceViewProps) {
  return (
    <PageShell>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar placeholder={searchPlaceholder} className="sm:max-w-sm" />
        </div>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    </PageShell>
  )
}
