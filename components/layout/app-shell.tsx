import type { ReactNode } from 'react'

import { AppFooter } from '@/components/layout/app-footer'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { TopNav } from '@/components/layout/top-nav'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-svh flex-col">
        <TopNav />
        <main className="flex-1">{children}</main>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  )
}
