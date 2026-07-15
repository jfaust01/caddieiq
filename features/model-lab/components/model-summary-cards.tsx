'use client'

import { Activity, Gauge, Layers, ListChecks } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { ModelSummary } from '../types'

interface ModelSummaryCardsProps {
  summary: ModelSummary
}

interface Cell {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone?: 'default' | 'warning' | 'success'
}

const CONFIDENCE_LABEL: Record<ModelSummary['confidence'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export function ModelSummaryCards({ summary }: ModelSummaryCardsProps) {
  const cells: Cell[] = [
    {
      label: 'Total Metrics',
      value: `${summary.totalMetrics}`,
      hint: 'Available metric groups',
      icon: Layers,
    },
    {
      label: 'Active Metrics',
      value: `${summary.activeMetrics}`,
      hint: 'Contributing to the model',
      icon: ListChecks,
    },
    {
      label: 'Weight Distribution',
      value: `${summary.totalWeight}%`,
      hint: summary.overweight ? 'Over 100% — normalize' : 'Sum of active weights',
      icon: Gauge,
      tone: summary.overweight
        ? 'warning'
        : summary.totalWeight === 100
          ? 'success'
          : 'default',
    },
    {
      label: 'Ranking Confidence',
      value: CONFIDENCE_LABEL[summary.confidence],
      hint: 'Estimated (placeholder)',
      icon: Activity,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {cells.map((cell) => {
        const Icon = cell.icon
        return (
          <div
            key={cell.label}
            className="flex flex-col gap-1.5 rounded-lg border bg-card px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {cell.label}
              </span>
              <Icon className="size-3.5 text-muted-foreground" />
            </div>
            <span
              className={cn(
                'text-lg font-semibold tracking-tight tabular-nums',
                cell.tone === 'warning' && 'text-destructive',
                cell.tone === 'success' && 'text-success',
              )}
            >
              {cell.value}
            </span>
            <span className="text-[0.7rem] leading-tight text-muted-foreground">
              {cell.hint}
            </span>
          </div>
        )
      })}
    </div>
  )
}
