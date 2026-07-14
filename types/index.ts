import type { LucideIcon } from 'lucide-react'

export type Trend = 'up' | 'down' | 'neutral'

export interface StatMetric {
  id: string
  label: string
  value: string
  delta?: string
  trend?: Trend
  icon?: LucideIcon
  hint?: string
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageMeta {
  title: string
  description: string
}
