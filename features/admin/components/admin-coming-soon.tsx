import Link from 'next/link'
import { ArrowLeft, Construction } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'

import { AdminBreadcrumbs } from './admin-breadcrumbs'

interface AdminComingSoonProps {
  title: string
  description: string
}

/**
 * Placeholder for admin destinations that are routed but not yet built. Keeps
 * links working (no 404s) and clearly communicates the feature is planned.
 */
export function AdminComingSoon({ title, description }: AdminComingSoonProps) {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Administration"
        title={title}
        description={description}
        breadcrumbs={<AdminBreadcrumbs items={[{ label: title }]} />}
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Construction className="size-6" />
          </span>
          <div className="flex flex-col items-center gap-2">
            <Badge variant="secondary">Coming Soon</Badge>
            <h2 className="text-lg font-medium">{title} is on the way</h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              This area is planned but not yet available. Check back soon — in
              the meantime, everything else in the admin console is ready to use.
            </p>
          </div>
          <Button variant="outline" render={<Link href="/admin">
            <ArrowLeft className="size-4" />
            Back to Admin Dashboard
          </Link>} />
        </CardContent>
      </Card>
    </PageShell>
  )
}
