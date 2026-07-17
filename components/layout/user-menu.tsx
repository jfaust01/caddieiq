'use client'

import { useEffect, useState } from 'react'
import { CircleHelp, LogOut, Settings, User, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut, useSession } from '@/lib/auth-client'

const MENU_ITEMS = [
  { label: 'Account', icon: User, href: '/settings' },
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Help', icon: CircleHelp, href: '/help' },
] as const

const ADMIN_MENU_ITEMS = [
  { label: 'Admin', icon: ShieldCheck, href: '/admin/database-health' },
] as const

function initialsFromName(name?: string | null): string {
  if (!name) return 'CQ'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const initials = parts.map((part) => part[0]).join('')
  return initials.toUpperCase() || 'CQ'
}

export function UserMenu() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const user = session?.user
  const isAdmin =
    (user as { role?: string } | undefined)?.role === 'ADMIN'
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Open user menu"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {isMounted ? initialsFromName(user?.name) : 'CQ'}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {user?.name ?? 'Workspace'}
                </span>
                {isAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    Admin
                  </Badge>
                )}
              </div>
              <span className="text-xs font-normal text-muted-foreground">
                {user?.email ?? 'Sign in to sync your models'}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuGroup>
            {ADMIN_MENU_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item.label}
                onClick={() => router.push(item.href)}
              >
                <item.icon data-icon="inline-start" />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        <DropdownMenuGroup>
          {MENU_ITEMS.map((item) => (
            <DropdownMenuItem
              key={item.label}
              onClick={() => router.push(item.href)}
            >
              <item.icon data-icon="inline-start" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {isAdmin && <DropdownMenuSeparator />}
        <DropdownMenuGroup>
          {user ? (
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut data-icon="inline-start" />
              Sign out
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => router.push('/login')}
            >
              <LogOut data-icon="inline-start" />
              Sign in
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
