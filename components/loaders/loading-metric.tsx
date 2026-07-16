import { Skeleton } from '@/components/ui/skeleton'

interface LoadingMetricProps {
  /** Show metric label (default: true) */
  withLabel?: boolean
  /** Show trend indicator (default: true) */
  withTrend?: boolean
  /** Additional CSS classes */
  className?: string
}

export function LoadingMetric({
  withLabel = true,
  withTrend = true,
  className = '',
}: LoadingMetricProps) {
  return (
    <div className={`rounded-lg border p-4 space-y-3 ${className}`}>
      {withLabel && <Skeleton className="h-3 w-1/3" />}
      <div className="flex items-baseline gap-2">
        <Skeleton className="h-8 w-1/2" />
        {withTrend && <Skeleton className="h-4 w-12" />}
      </div>
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}
