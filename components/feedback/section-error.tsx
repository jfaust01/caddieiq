'use client'

import { RotateCcw, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

interface SectionErrorProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function SectionError({
  title = 'Something went wrong',
  description = 'We could not load this section. Please try again.',
  onRetry,
}: SectionErrorProps) {
  return (
    <Empty className="border border-destructive/30 bg-destructive/5">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
          <TriangleAlert />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {onRetry ? (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw data-icon="inline-start" />
            Try again
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
