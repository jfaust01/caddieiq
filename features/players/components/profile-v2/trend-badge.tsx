import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface TrendBadgeProps {
  /** Trend direction: 'up', 'down', or 'flat'. */
  direction: 'up' | 'down' | 'flat'
  /** Value to display (e.g., "+2.3%", "-0.5"). */
  value: string
  /** Optional label (e.g., "vs avg"). */
  label?: string
  /** Optional tooltip title. */
  title?: string
  /** Additional CSS classes. */
  className?: string
}

/**
 * Reusable badge showing a trend with direction and value.
 * Used in cards, tables, and inline within text.
 */
export function TrendBadge({
  direction,
  value,
  label,
  title,
  className,
}: TrendBadgeProps) {
  const TrendIcon =
    direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 font-semibold',
        direction === 'up' && 'text-success border-success/30 bg-success/5',
        direction === 'down' && 'text-destructive border-destructive/30 bg-destructive/5',
        direction === 'flat' && 'text-muted-foreground border-border',
        className,
      )}
      title={title}
    >
      <TrendIcon className="size-3" />
      <span>{value}</span>
      {label && <span className="text-xs opacity-75">{label}</span>}
    </Badge>
  )
}
