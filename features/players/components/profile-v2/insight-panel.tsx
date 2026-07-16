'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InsightPanelProps {
  title: string
  /** Main content or description. Can be text or ReactNode. */
  children?: React.ReactNode
  /** Optional subtitle or metadata. */
  subtitle?: string
  /** Status: 'placeholder', 'loading', or 'ready'. */
  status?: 'placeholder' | 'loading' | 'ready'
  /** Additional CSS classes. */
  className?: string
  /** Full height for large panels. */
  fullHeight?: boolean
}

/**
 * Reusable panel for large analytics sections like AI Summary and Decision Trace.
 * Can render placeholder, loading, or actual content states.
 */
export function InsightPanel({
  title,
  children,
  subtitle,
  status = 'placeholder',
  className,
  fullHeight,
}: InsightPanelProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden',
        fullHeight && 'min-h-96',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1">
          <CardTitle className="text-base flex items-center gap-2">
            {status === 'ready' && <Sparkles className="size-4 text-amber-500" />}
            {status === 'loading' && <div className="size-4 rounded-full border-2 border-muted-foreground border-t-foreground animate-spin" />}
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground pt-1">{subtitle}</p>
          )}
        </div>
        {status === 'placeholder' && (
          <Badge variant="outline" className="text-xs ml-2">
            <Lock className="size-3 mr-1" />
            Future release
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {status === 'placeholder' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              {children || 'This section will be available in a future release as we complete our analytics engines.'}
            </p>
          </div>
        ) : status === 'loading' ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block size-8 rounded-full border-2 border-muted-foreground border-t-foreground animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading insights...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
