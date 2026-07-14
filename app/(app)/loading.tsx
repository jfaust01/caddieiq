import { PageShell } from '@/components/shared/page-shell'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <PageShell>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </PageShell>
  )
}
