'use client'

import { cn } from '@/lib/utils'

interface SidebarItem {
  label: string
  value: string | number | null
  unit?: string
  highlight?: boolean
}

interface ScorecardSidebarProps {
  items: SidebarItem[]
  className?: string
}

function formatValue(value: string | number | null, unit?: string): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') {
    const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1)
    return unit ? `${formatted}${unit}` : formatted
  }
  return String(value)
}

export function ScorecardSidebar({ items, className }: ScorecardSidebarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        'rounded-2xl',
        'border border-white/[0.06]',
        'bg-gradient-to-br from-white/[0.05] to-white/[0.02]',
        'backdrop-blur-sm',
        'p-5',
        'shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]',
        className
      )}
    >
      {/* Accent line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent rounded-t-2xl"
      />

      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center justify-between p-2.5',
            'rounded-lg',
            'border border-white/[0.04]',
            'bg-white/[0.02]',
            item.highlight && 'border-emerald-500/30 bg-emerald-500/[0.08]'
          )}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">
            {item.label}
          </span>
          <span
            className={cn(
              'text-sm font-bold text-white tabular-nums',
              item.highlight && 'text-emerald-400'
            )}
          >
            {formatValue(item.value, item.unit)}
          </span>
        </div>
      ))}
    </div>
  )
}
