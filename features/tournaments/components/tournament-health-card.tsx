'use client'

import { StatusBadge } from './status-badge'
import { cn } from '@/lib/utils'

export interface HealthItem {
  label: string
  status: 'complete' | 'pending' | 'generating' | 'warning' | 'error' | 'not-imported' | 'not-generated' | 'unknown'
  description?: string
}

interface TournamentHealthCardProps {
  items: HealthItem[]
  className?: string
}

/**
 * Tournament Health Card displays the status of all data layers in a clear,
 * organized format. Each layer shows its current state with a color-coded badge.
 */
export function TournamentHealthCard({ items, className }: TournamentHealthCardProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            {item.description ? (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
          <div className="shrink-0">
            <StatusBadge
              variant={item.status}
              label={formatStatusLabel(item.status)}
              showIcon
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'complete': 'Complete',
    'pending': 'Pending',
    'generating': 'Generating',
    'warning': 'Warning',
    'error': 'Failed',
    'not-imported': 'Not Imported',
    'not-generated': 'Not Generated',
    'unknown': 'Unknown',
  }
  return labels[status] || 'Unknown'
}
