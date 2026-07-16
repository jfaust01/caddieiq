import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface TimelineEntry {
  /** Unique identifier. */
  id: string
  /** Event or milestone label. */
  label: string
  /** Finish position or status (e.g., "1st", "T5", "CUT", "WD"). */
  finish: string
  /** Optional metric (e.g., "-2" for strokes gained). */
  metric?: string
  /** Date ISO string for accessibility. */
  date: string
  /** Date display format (e.g., "Jan 15"). */
  dateDisplay: string
  /** Optional trend or status color. */
  status?: 'success' | 'neutral' | 'warning' | 'danger'
}

export interface TimelineProps {
  title: string
  entries: TimelineEntry[]
  /** Optional subtitle. */
  subtitle?: string
  /** Additional CSS classes. */
  className?: string
}

const statusColor = {
  success: 'bg-success/10 text-success border-success/30',
  neutral: 'bg-muted text-muted-foreground border-border',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  danger: 'bg-destructive/10 text-destructive border-destructive/30',
}

/**
 * Reusable timeline component for recent tournaments and milestones.
 * Displays entries vertically with date, label, finish, and optional metrics.
 */
export function Timeline({
  title,
  entries,
  subtitle,
  className,
}: TimelineProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && (
          <p className="text-sm text-muted-foreground pt-1">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry, idx) => (
            <div key={entry.id} className="flex gap-4">
              {/* Timeline marker */}
              <div className="flex flex-col items-center">
                <div className="size-3 rounded-full bg-muted-foreground ring-2 ring-background" />
                {idx < entries.length - 1 && (
                  <div className="h-8 w-0.5 bg-muted mt-1" />
                )}
              </div>

              {/* Entry content */}
              <div className="flex-1 pb-2">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium leading-tight">
                    {entry.label}
                  </span>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {entry.dateDisplay}
                  </time>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-semibold',
                      statusColor[entry.status || 'neutral'],
                    )}
                  >
                    {entry.finish}
                  </Badge>
                  {entry.metric && (
                    <Badge variant="secondary" className="text-xs">
                      {entry.metric}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              No recent tournaments
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
