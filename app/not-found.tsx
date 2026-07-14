import Link from 'next/link'
import { Compass, Home } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Compass />
          </EmptyMedia>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>
            The page you are looking for does not exist or may have moved. Let&apos;s get you back on
            course.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/" />}>
            <Home data-icon="inline-start" />
            Back to home
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
