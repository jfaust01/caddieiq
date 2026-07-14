'use client'

import { useEffect } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'

import { PageShell } from '@/components/shared/page-shell'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.log('[v0] App route error:', error.message)
  }, [error])

  return (
    <PageShell>
      <Empty className="min-h-[60vh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert />
          </EmptyMedia>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription>
            An unexpected error occurred while loading this page. You can try again, and if the
            problem persists, reach out to support.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reset}>
            <RotateCcw data-icon="inline-start" />
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    </PageShell>
  )
}
