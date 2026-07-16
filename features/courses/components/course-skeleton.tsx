'use client'

import { Skeleton } from '@/components/ui/skeleton'

export interface CourseSkeletonProps {
  count?: number
}

export function CourseSkeleton({ count = 9 }: CourseSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
