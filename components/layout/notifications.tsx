'use client'

import { Bell, BellOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function Notifications() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
          >
            <Bell />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Empty className="border-0 py-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellOff />
            </EmptyMedia>
            <EmptyTitle>You are all caught up</EmptyTitle>
            <EmptyDescription>
              Alerts about models and events will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
