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

// Navigation item styles
const navItemClasses = {
  base: 'group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-150',
  inactive: 'text-muted-foreground hover:bg-white/[0.035] hover:text-foreground',
  active: 'border border-emerald-400/15 bg-emerald-400/[0.10] text-emerald-200 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]',
}

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === 'ADMIN'
  const sections = primaryNavigation.filter(
    (section) => !section.adminOnly || isAdmin,
  )

  return (
    <Sidebar collapsible="icon" className="border-r border-white/[0.07] bg-[#0b1015] shadow-[inset_-1px_0_0_rgba(255,255,255,0.015)]">
      {/* Subtle decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/[0.055] blur-3xl"
      />

      {/* Premium brand header */}
      <SidebarHeader className="relative z-10 border-b border-white/[0.05] px-5 py-6">
        <Link
          href="/"
          className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/85 text-lg font-bold text-[#07120d] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
            CQ
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="text-base font-semibold tracking-tight text-white">
              {siteConfig.name}
            </div>
            <div className="text-xs text-muted-foreground">
              Golf Analytics
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigation content */}
      <SidebarContent className="relative z-10 flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <SidebarGroup key={section.title} className="space-y-0">
            <SidebarGroupLabel className="px-5 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => {
                  const active = isActivePath(pathname, item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          navItemClasses.base,
                          active ? navItemClasses.active : navItemClasses.inactive
                        )}
                        render={
                          <Link href={item.href} className="flex items-center gap-3 w-full">
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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

      {/* Bottom actions with divider */}
      <SidebarFooter className="relative z-10 border-t border-white/[0.06] px-3 py-4">
        <SidebarMenu className="space-y-1">
          {secondaryNavigation.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={item.title}
                  className={cn(
                    navItemClasses.base,
                    active ? navItemClasses.active : navItemClasses.inactive
                  )}
                  render={
                    <Link href={item.href} className="flex items-center gap-3 w-full">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
