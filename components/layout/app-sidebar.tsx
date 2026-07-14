'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  primaryNavigation,
  secondaryNavigation,
} from '@/constants/navigation'
import { siteConfig } from '@/constants/site'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  // Better Auth's session user may carry a role; admin-only sections stay
  // hidden unless the signed-in user is explicitly an ADMIN.
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === 'ADMIN'
  const sections = primaryNavigation.filter(
    (section) => !section.adminOnly || isAdmin,
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            CQ
          </span>
          <span className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-none tracking-tight">
              {siteConfig.name}
            </span>
            <span className="mt-1 text-xs leading-none text-muted-foreground">
              Golf Analytics
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isActivePath(pathname, item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        render={
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {secondaryNavigation.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={item.title}
                  className={cn(active && 'font-medium')}
                  render={
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
