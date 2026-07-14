import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ViewMode } from '@/features/players/types'

interface PlayerSkeletonProps {
  view?: ViewMode
  count?: number
}

function GridCardSkeleton() {
  return (
    <Card className="justify-between">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-7 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

function ListRowSkeleton() {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <Skeleton className="hidden h-4 w-8 sm:block" />
        <Skeleton className="size-8 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="hidden h-6 w-40 lg:block" />
      </CardContent>
    </Card>
  )
}

/** Loading placeholder that mirrors the grid/list layout of the directory. */
export function PlayerSkeleton({ view = 'grid', count = 9 }: PlayerSkeletonProps) {
  const items = Array.from({ length: count })

  if (view === 'list') {
    return (
      <div className="flex flex-col gap-3" aria-hidden>
        {items.map((_, index) => (
          <ListRowSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-hidden
    >
      {items.map((_, index) => (
        <GridCardSkeleton key={index} />
      ))}
    </div>
  )
}
