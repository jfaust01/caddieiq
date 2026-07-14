'use client'

import type { LucideIcon } from 'lucide-react'
import { Flag, Plus, SlidersHorizontal, Trophy, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Kbd } from '@/components/shared/kbd'
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

interface QuickAction {
  label: string
  href: string
  icon: LucideIcon
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'New model', href: '/models', icon: SlidersHorizontal },
  { label: 'Browse players', href: '/players', icon: Users },
  { label: 'View tournaments', href: '/tournaments', icon: Flag },
  { label: 'Open rankings', href: '/rankings', icon: Trophy },
]

export function QuickActions() {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            aria-label="Quick actions"
          >
            <Plus className="size-4" />
            <span className="hidden lg:inline">Create</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            Quick actions
            <Kbd>C</Kbd>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {QUICK_ACTIONS.map((action) => (
            <DropdownMenuItem
              key={action.label}
              onClick={() => router.push(action.href)}
            >
              <action.icon data-icon="inline-start" />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
