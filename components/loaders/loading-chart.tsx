import { Skeleton } from '@/components/ui/skeleton'

interface LoadingChartProps {
  /** Chart height (default: 'h-80') */
  height?: string
  /** Show legend (default: true) */
  withLegend?: boolean
  /** Show title (default: true) */
  withTitle?: boolean
  /** Additional CSS classes */
  className?: string
}

export function LoadingChart({
  height = 'h-80',
  withLegend = true,
  withTitle = true,
  className = '',
}: LoadingChartProps) {
  return (
    <div className={`rounded-lg border p-4 space-y-4 ${className}`}>
      {withTitle && (
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      <div className={`bg-muted rounded ${height} flex flex-col justify-between p-4`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`bar-${i}`} className="h-1 w-full" />
        ))}
      </div>
      {withLegend && (
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`legend-${i}`} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
