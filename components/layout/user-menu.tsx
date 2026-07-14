'use client'

import { CircleHelp, LogOut, Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

const MENU_ITEMS = [
  { label: 'Account', icon: User, href: '/settings' },
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Help', icon: CircleHelp, href: '/help' },
] as const

export function UserMenu() {
  const router = useRouter()

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
                CQ
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Workspace</span>
            <span className="text-xs font-normal text-muted-foreground">
              Sign in to sync your models
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
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
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <LogOut data-icon="inline-start" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
