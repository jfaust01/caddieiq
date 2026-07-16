import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonTableProps {
  /** Number of rows to show (default: 5) */
  rows?: number
  /** Number of columns (default: 4) */
  columns?: number
  /** Show header row (default: true) */
  withHeader?: boolean
  /** Additional CSS classes */
  className?: string
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  withHeader = true,
  className = '',
}: SkeletonTableProps) {
  const columnWidths = Array.from({ length: columns }, (_, i) => {
    // Vary widths to look more natural
    const bases = [3, 4, 2, 3, 5];
    return `${bases[i % bases.length]}/5`;
  });

  return (
    <div className={`rounded-lg border overflow-hidden ${className}`}>
      {withHeader && (
        <div className="flex gap-4 border-b bg-muted p-4">
          {columnWidths.map((width, i) => (
            <Skeleton key={`header-${i}`} className={`h-4 w-${width}`} />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className="flex gap-4 border-b p-4 last:border-b-0">
          {columnWidths.map((width, colIdx) => (
            <Skeleton key={`cell-${rowIdx}-${colIdx}`} className={`h-4 w-${width}`} />
          ))}
        </div>
      ))}
    </div>
  )
}
