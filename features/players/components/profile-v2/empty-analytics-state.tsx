import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface EmptyAnalyticsStateProps {
  title: string
  /** Description or explanation. */
  description: string
  /** Optional "coming soon" flag for styling. */
  comingSoon?: boolean
  /** Additional CSS classes. */
  className?: string
}

/**
 * Placeholder state for unavailable or future analytics sections.
 * Renders a polished empty state with icon and messaging.
 */
export function EmptyAnalyticsState({
  title,
  description,
  comingSoon,
  className,
}: EmptyAnalyticsStateProps) {
  const Icon = comingSoon ? Database : AlertCircle

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="size-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-base font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          {description}
        </p>
        {comingSoon && (
          <Badge variant="outline" className="text-xs">
            Coming soon
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
