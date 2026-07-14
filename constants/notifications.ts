import type { LucideIcon } from 'lucide-react'
import { CalendarClock, LineChart, Trophy, Users } from 'lucide-react'

export interface AppNotification {
  id: string
  title: string
  description: string
  time: string
  icon: LucideIcon
  unread: boolean
  href?: string
}

/**
 * Placeholder notifications for the shell. These are static mock entries used
 * to design the notification surface; real alerts will replace them once the
 * events pipeline lands.
 */
export const mockNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Model run complete',
    description: 'Your "Ball-Striking Weighted" model finished ranking the RBC field.',
    time: '2m ago',
    icon: LineChart,
    unread: true,
    href: '/models',
  },
  {
    id: 'n2',
    title: 'Tournament field updated',
    description: '12 players were added to the field for the Genesis Invitational.',
    time: '1h ago',
    icon: CalendarClock,
    unread: true,
    href: '/tournaments',
  },
  {
    id: 'n3',
    title: 'Rankings refreshed',
    description: 'World rankings were updated with this week\u2019s results.',
    time: '3h ago',
    icon: Trophy,
    unread: true,
    href: '/rankings',
  },
  {
    id: 'n4',
    title: 'New players imported',
    description: '48 players joined the universe from the latest data sync.',
    time: 'Yesterday',
    icon: Users,
    unread: false,
    href: '/players',
  },
]
