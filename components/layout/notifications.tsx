'use client'

import { Bell, BellOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { mockNotifications } from '@/constants/notifications'
import { cn } from '@/lib/utils'

export function Notifications() {
  const router = useRouter()
  const notifications = mockNotifications
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
          >
            <Bell />
            {unreadCount > 0 ? (
              <span
                className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold leading-none text-primary-foreground"
                aria-hidden="true"
              >
                {unreadCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-88 p-0">
        <DropdownMenuGroup>
          <div className="flex items-center justify-between px-3 py-2.5">
            <DropdownMenuLabel className="p-0 text-sm font-semibold">
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {unreadCount} new
              </span>
            ) : null}
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-0" />

        {notifications.length === 0 ? (
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
        ) : (
          <ScrollArea className="h-72">
            <div className="py-1">
              {notifications.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="items-start gap-3 px-3 py-2.5"
                  onClick={() => item.href && router.push(item.href)}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <item.icon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'truncate text-sm',
                          item.unread ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        {item.title}
                      </span>
                      {item.unread ? (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      ) : null}
                    </span>
                    <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </span>
                    <span className="text-xs text-muted-foreground/80">
                      {item.time}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </ScrollArea>
        )}

        <DropdownMenuSeparator className="my-0" />
        <div className="p-1">
          <DropdownMenuItem
            className="justify-center text-sm font-medium text-primary"
            onClick={() => router.push('/settings')}
          >
            Notification settings
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
