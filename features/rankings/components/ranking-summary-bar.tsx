import { CalendarDays, ListOrdered, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { RankingSummary } from '../types'

interface SummaryItemProps {
  icon: LucideIcon
  label: string
  value: string
}

function SummaryItem({ icon: Icon, label, value }: SummaryItemProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="flex flex-col">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
    </div>
  )
}

interface RankingSummaryBarProps {
  summary: RankingSummary
  className?: string
}

/**
 * Top summary bar for the live directory: the active ranking type, the season
 * the board was normalized against, and how many players are ranked. Every
 * value is real engine output — there is no placeholder tournament, fabricated
 * "last updated" time, or export stub.
 */
export function RankingSummaryBar({ summary, className }: RankingSummaryBarProps) {
  return (
    <Card
      className={cn(
        'flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:gap-8',
        className,
      )}
    >
      <SummaryItem icon={ListOrdered} label="Ranking type" value={summary.typeLabel} />
      <SummaryItem icon={CalendarDays} label="Season" value={summary.seasonLabel} />
      <SummaryItem icon={Users} label="Players ranked" value={`${summary.playersRanked}`} />
    </Card>
  )
}
