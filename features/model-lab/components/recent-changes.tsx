'use client'

import { History } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { ModelChange } from '../types'
import { formatRelativeTime } from '../utils/helpers'

interface RecentChangesProps {
  changes: ModelChange[]
  className?: string
}

/**
 * Right-panel activity feed of the most recent edits to the active model.
 * Client-only session history for v1.
 */
export function RecentChanges({ changes, className }: RecentChangesProps) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="size-4 text-muted-foreground" aria-hidden />
          Recent changes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {changes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No changes yet. Tune a metric to start a history.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {changes.map((change) => (
              <li key={change.id} className="flex gap-3">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-sm font-medium leading-snug">
                    {change.label}
                  </p>
                  {change.detail ? (
                    <p className="text-xs text-muted-foreground">
                      {change.detail}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(change.at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
