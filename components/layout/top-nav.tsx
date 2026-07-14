import { Breadcrumbs } from '@/components/navigation/breadcrumbs'
import { CommandPalette } from '@/components/navigation/command-palette'
import { Notifications } from '@/components/layout/notifications'
import { QuickActions } from '@/components/layout/quick-actions'
import { UserMenu } from '@/components/layout/user-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-5" />
      <div className="hidden md:block">
        <Breadcrumbs />
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden sm:block">
          <CommandPalette />
        </div>
        <div className="hidden sm:block">
          <QuickActions />
        </div>
        <Notifications />
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <UserMenu />
      </div>
    </header>
  )
}
