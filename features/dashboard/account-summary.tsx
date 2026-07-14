import {
  ArrowUpRight,
  Flag,
  MapPinned,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface QuickLink {
  title: string
  href: string
  description: string
  icon: typeof Users
  disabled?: boolean
  badge?: string
  adminOnly?: boolean
}

const QUICK_LINKS: QuickLink[] = [
  {
    title: 'Model Lab',
    href: '/models',
    description: 'Design, tune, and deploy custom models.',
    icon: SlidersHorizontal,
    disabled: true,
    badge: 'Coming Soon',
  },
  {
    title: 'Players',
    href: '/players',
    description: 'Browse and manage the player universe.',
    icon: Users,
  },
  {
    title: 'Tournaments',
    href: '/tournaments',
    description: 'Schedule, fields, and event context.',
    icon: Flag,
  },
  {
    title: 'Courses',
    href: '/courses',
    description: 'Course profiles and playing conditions.',
    icon: MapPinned,
  },
  {
    title: 'Admin',
    href: '/admin',
    description: 'Manage users, data, and platform settings.',
    icon: ShieldCheck,
    adminOnly: true,
  },
]

interface AccountSummaryProps {
  name: string
  email: string
  tier: string
  isAdmin: boolean
}

export function AccountSummary({
  name,
  email,
  tier,
  isAdmin,
}: AccountSummaryProps) {
  const links = QUICK_LINKS.filter((link) => !link.adminOnly || isAdmin)

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {name}</CardTitle>
          <CardDescription>Signed in to your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{email}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Subscription</span>
            <Badge variant="secondary">{tier}</Badge>
          </div>
          {isAdmin ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="outline">
                <ShieldCheck data-icon="inline-start" />
                Admin
              </Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
          <CardDescription>Jump into your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {links.map((link) => {
              const content = (
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <link.icon className="size-4.5" />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {link.title}
                      {link.badge ? (
                        <Badge variant="outline" className="text-[10px]">
                          {link.badge}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {link.description}
                    </span>
                  </div>
                  {!link.disabled ? (
                    <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
                  ) : null}
                </div>
              )

              const baseClass =
                'rounded-lg border border-border p-3 transition-colors'

              if (link.disabled) {
                return (
                  <div
                    key={link.title}
                    aria-disabled
                    className={cn(baseClass, 'cursor-not-allowed opacity-60')}
                  >
                    {content}
                  </div>
                )
              }

              return (
                <Link
                  key={link.title}
                  href={link.href}
                  className={cn(
                    baseClass,
                    'outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                  )}
                >
                  {content}
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
