import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ComingSoonCardProps {
  icon: LucideIcon
  title: string
  /** One-line explanation of the insight this card will surface. */
  description: string
  /** Optional preview metric label shown as a large muted placeholder. */
  metricLabel?: string
  /** Short pill copy; defaults to "Coming soon". */
  badgeLabel?: string
  className?: string
}

/**
 * Tasteful placeholder for an analytics surface whose data has not been
 * imported yet. Communicates intent (what will live here) rather than showing a
 * broken or empty panel, so the page reads as a finished destination awaiting
 * future data feeds.
 */
export function ComingSoonCard({
  icon: Icon,
  title,
  description,
  metricLabel,
  badgeLabel = 'Coming soon',
  className,
}: ComingSoonCardProps) {
  return (
    <Card className={cn('h-full border-dashed bg-card/60', className)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4.5" aria-hidden />
          </span>
          <Badge
            variant="secondary"
            className="bg-muted text-[11px] font-medium text-muted-foreground"
          >
            {badgeLabel}
          </Badge>
        </div>
        <CardTitle className="mt-3">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {metricLabel ? (
          <span className="text-2xl font-semibold tracking-tight text-muted-foreground/50">
            {metricLabel}
          </span>
        ) : null}
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
