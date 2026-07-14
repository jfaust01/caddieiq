'use client'

import * as React from 'react'
import { AlertCircleIcon, BarChart3Icon, RefreshCwIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

/* ─── Chart Card ─────────────────────────────────────────────────────────────── */

interface ChartCardProps {
  title: string
  description?: string
  toolbar?: React.ReactNode
  legend?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function ChartCard({
  title,
  description,
  toolbar,
  legend,
  children,
  className,
  contentClassName,
}: ChartCardProps) {
  return (
    <Card variant="default" className={cn('gap-0', className)}>
      <CardHeader className="flex-row items-start justify-between gap-4 pb-3">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-sm">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        {toolbar && <ChartToolbar>{toolbar}</ChartToolbar>}
      </CardHeader>
      <Separator />
      <CardContent className={cn('pt-4 pb-2', contentClassName)}>
        {children}
      </CardContent>
      {legend && (
        <>
          <Separator />
          <div className="px-4 py-2.5">{legend}</div>
        </>
      )}
    </Card>
  )
}

/* ─── Chart Toolbar ──────────────────────────────────────────────────────────── */

function ChartToolbar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center gap-1.5 shrink-0', className)}
      {...props}
    />
  )
}

/* ─── Chart Legend ───────────────────────────────────────────────────────────── */

interface LegendItem {
  label: string
  color?: string
}

interface ChartLegendProps {
  items: LegendItem[]
  className?: string
}

export function ChartLegend({ items, className }: ChartLegendProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full shrink-0"
            style={{ background: item.color ?? 'var(--chart-1)' }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Empty Chart ────────────────────────────────────────────────────────────── */

interface ChartEmptyProps {
  message?: string
  className?: string
  height?: number
}

export function ChartEmpty({ message = 'No data to display', className, height = 200 }: ChartEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border text-center',
        className,
      )}
      style={{ height }}
    >
      <BarChart3Icon className="size-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

/* ─── Loading Chart ──────────────────────────────────────────────────────────── */

interface ChartLoadingProps {
  className?: string
  height?: number
}

export function ChartLoading({ className, height = 200 }: ChartLoadingProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} style={{ height }}>
      <div className="flex items-end gap-1.5 flex-1 px-2">
        {[60, 85, 45, 70, 90, 55, 75, 40, 80, 65].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex justify-between px-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 w-6 rounded-sm" />
        ))}
      </div>
    </div>
  )
}

/* ─── Error Chart ────────────────────────────────────────────────────────────── */

interface ChartErrorProps {
  message?: string
  onRetry?: () => void
  className?: string
  height?: number
}

export function ChartError({
  message = 'Failed to load chart data',
  onRetry,
  className,
  height = 200,
}: ChartErrorProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 text-center',
        className,
      )}
      style={{ height }}
    >
      <AlertCircleIcon className="size-6 text-destructive/70" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCwIcon data-icon="inline-start" />
          Retry
        </Button>
      )}
    </div>
  )
}

export { ChartToolbar }
