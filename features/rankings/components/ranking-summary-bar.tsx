'use client'

import { Clock, Download, ListOrdered, Trophy, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import type { RankingSummary } from '../types'

interface SummaryItemProps {
  icon: typeof Trophy
  label: string
  value: string
  isLoading?: boolean
}

function SummaryItem({ icon: Icon, label, value, isLoading }: SummaryItemProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="flex flex-col">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {isLoading ? (
          <Skeleton className="mt-1 h-4 w-24" />
        ) : (
          <span className="text-sm font-semibold text-foreground">{value}</span>
        )}
      </div>
    </div>
  )
}

interface RankingSummaryBarProps {
  summary: RankingSummary
  isLoading?: boolean
  className?: string
}

/**
 * Top summary bar: current tournament, ranking type, players ranked, last
 * updated (placeholder), and a disabled Export action.
 */
export function RankingSummaryBar({
  summary,
  isLoading = false,
  className,
}: RankingSummaryBarProps) {
  return (
    <Card
      className={cn(
        'flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-center lg:gap-8">
        <SummaryItem
          icon={Trophy}
          label="Tournament"
          value={summary.tournamentLabel}
        />
        <SummaryItem
          icon={ListOrdered}
          label="Ranking type"
          value={summary.typeLabel}
        />
        <SummaryItem
          icon={Users}
          label="Players ranked"
          value={`${summary.playersRanked}`}
          isLoading={isLoading}
        />
        <SummaryItem
          icon={Clock}
          label="Last updated"
          value={summary.lastUpdatedLabel}
          isLoading={isLoading}
        />
      </div>

      {/* TODO(export): enable once ranking export is implemented. */}
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex w-fit" />}>
          <Button variant="outline" size="sm" disabled aria-disabled>
            <Download data-icon="inline-start" />
            Export
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export is coming soon</TooltipContent>
      </Tooltip>
    </Card>
  )
}
