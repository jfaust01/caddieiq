import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { adminNavItems } from '@/constants/admin-navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import { cn } from '@/lib/utils'

import { AdminBreadcrumbs } from '../components/admin-breadcrumbs'

/**
 * Admin landing page. Serves as the entry point to every administration
 * feature via a grid of cards. Implemented destinations link to their route;
 * not-yet-built destinations render a non-interactive "Coming Soon" card so no
 * link ever resolves to a 404.
 */
export function AdminDashboardView() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Administration"
        title="Admin Dashboard"
        description="Operational entry point for CaddieIQ. Monitor platform health, data pipelines, and manage the system."
        breadcrumbs={<AdminBreadcrumbs />}
      />

      <section aria-label="Admin features">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const card = (
              <Card
                className={cn(
                  'h-full transition-colors',
                  item.implemented
                    ? 'hover:ring-primary/40 group-focus-visible/card-link:ring-primary/40'
                    : 'opacity-80',
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'flex size-9 items-center justify-center rounded-lg',
                        item.implemented
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    {item.implemented ? (
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover/card:translate-x-0.5" />
                    ) : (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-3">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            )

            return (
              <li key={item.href}>
                {item.implemented ? (
                  <Link
                    href={item.href}
                    className="group/card-link group/card block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {card}
                  </Link>
                ) : (
                  <div
                    className="group/card block cursor-not-allowed"
                    aria-disabled="true"
                  >
                    {card}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </PageShell>
  )
}
