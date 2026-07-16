'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard } from 'lucide-react'

import { adminNavItems } from '@/constants/admin-navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Persistent Admin sidebar. Lists every admin destination from the single
 * `adminNavItems` source of truth. Unimplemented destinations are shown with a
 * muted "Soon" badge and still link to their placeholder page (never a 404).
 */
export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r border-foreground/10 lg:block">
      <nav aria-label="Admin" className="sticky top-0 flex flex-col gap-1 p-4">
        <Link
          href="/admin"
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/admin'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <LayoutDashboard className="size-4" />
          Overview
        </Link>

        <div className="my-2 h-px bg-foreground/10" />

        {adminNavItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span className="flex items-center gap-2">
                <item.icon className="size-4" />
                {item.title}
              </span>
              {!item.implemented ? (
                <Badge variant="secondary" className="text-[10px]">
                  Soon
                </Badge>
              ) : null}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
