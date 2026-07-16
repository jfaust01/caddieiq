import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Access Denied',
  description: 'You do not have permission to access this page.',
}

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          You do not have permission to access this page. Only administrators
          can view admin pages.
        </p>
      </div>
      <div className="flex gap-3 pt-4">
        <Link href="/">
          <Button variant="outline">Go Home</Button>
        </Link>
        <Link href="/settings">
          <Button>View Settings</Button>
        </Link>
      </div>
    </div>
  )
}
