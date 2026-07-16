'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface CoursePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function CoursePagination({
  page,
  totalPages,
  onPageChange,
  className,
}: CoursePaginationProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className ?? ''}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="size-4" />
        Previous
      </Button>

      <span className="text-sm text-muted-foreground">
        Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
