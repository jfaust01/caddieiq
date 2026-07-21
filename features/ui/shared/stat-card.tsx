import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
  trend?: {
    direction: 'up' | 'down'
    value: number
    label?: string
  }
  variant?: 'default' | 'positive' | 'negative' | 'neutral'
  onClick?: () => void
  className?: string
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  trend,
  variant = 'default',
  onClick,
  className = '',
}: StatCardProps) {
  const variantClass = {
    default: 'bg-card border-border/50',
    positive: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50',
    negative: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50',
    neutral: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50',
  }

  const trendClass = trend?.direction === 'up' ? 'text-green-600' : 'text-red-600'
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : TrendingDown

  return (
    <div
      className={`rounded-lg border p-4 ${variantClass[variant]} ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Header with icon */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="text-primary">{icon}</div>}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold">{value}</p>
        {unit && <p className="text-sm text-muted-foreground">{unit}</p>}
      </div>

      {/* Trend */}
      {trend && (
        <div className={`mt-3 flex items-center gap-1 text-sm ${trendClass}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="font-medium">{trend.value}%</span>
          {trend.label && (
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  )
}
