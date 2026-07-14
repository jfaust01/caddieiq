import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export function LoadingCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  )
}

export function LoadingCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>
  )
}

export function LoadingTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border p-4">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-full" />
      ))}
    </div>
  )
}

export function LoadingPage({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground',
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-6" />
      <span className="text-sm">{label}...</span>
    </div>
  )
}
