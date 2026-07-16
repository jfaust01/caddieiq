import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonCardProps {
  /** Number of lines to show for content (default: 3) */
  lines?: number
  /** Show avatar/icon area (default: true) */
  withIcon?: boolean
  /** Show header section (default: true) */
  withHeader?: boolean
  /** Additional CSS classes */
  className?: string
}

export function SkeletonCard({
  lines = 3,
  withIcon = true,
  withHeader = true,
  className = '',
}: SkeletonCardProps) {
  return (
    <div className={`rounded-lg border p-4 space-y-4 ${className}`}>
      {withHeader && (
        <div className="space-y-2">
          {withIcon && <Skeleton className="h-8 w-8 rounded" />}
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-4/5' : 'w-full'}`} />
        ))}
      </div>
    </div>
  )
}
