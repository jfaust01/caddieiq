import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Zap, AlertCircle, XCircle, HelpCircle, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatusVariant = 'complete' | 'pending' | 'generating' | 'warning' | 'error' | 'unknown' | 'not-imported' | 'not-generated'

interface StatusBadgeProps {
  variant: StatusVariant
  label: string
  className?: string
  showIcon?: boolean
}

const VARIANT_CONFIG: Record<StatusVariant, { bg: string; text: string; icon: React.ReactNode }> = {
  complete: {
    bg: 'bg-success/15',
    text: 'text-success',
    icon: <CheckCircle2 className="size-3" />,
  },
  pending: {
    bg: 'bg-warning/15',
    text: 'text-warning',
    icon: <Clock className="size-3" />,
  },
  generating: {
    bg: 'bg-info/15',
    text: 'text-info',
    icon: <Zap className="size-3" />,
  },
  warning: {
    bg: 'bg-warning/15',
    text: 'text-warning',
    icon: <AlertCircle className="size-3" />,
  },
  error: {
    bg: 'bg-destructive/15',
    text: 'text-destructive',
    icon: <XCircle className="size-3" />,
  },
  unknown: {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    icon: <HelpCircle className="size-3" />,
  },
  'not-imported': {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    icon: <Package className="size-3" />,
  },
  'not-generated': {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    icon: <HelpCircle className="size-3" />,
  },
}

/**
 * Reusable status badge component supporting multiple state variants.
 * Used throughout Tournament Hub to communicate data layer status.
 */
export function StatusBadge({ variant, label, className, showIcon = true }: StatusBadgeProps) {
  const config = VARIANT_CONFIG[variant]

  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1.5 font-medium',
        config.bg,
        config.text,
        className,
      )}
    >
      {showIcon ? (
        <span className="flex items-center" aria-hidden>
          {config.icon}
        </span>
      ) : null}
      <span>{label}</span>
    </Badge>
  )
}
