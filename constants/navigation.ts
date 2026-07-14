import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CircleHelp,
  Flag,
  LayoutDashboard,
  MapPinned,
  Palette,
  Settings,
  SlidersHorizontal,
  Trophy,
  Users,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  description: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const primaryNavigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Your command center for models and picks.',
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        description: 'Explore performance trends and insights.',
      },
      {
        title: 'Rankings',
        href: '/rankings',
        icon: Trophy,
        description: 'Live leaderboards driven by your models.',
      },
    ],
  },
  {
    title: 'Data',
    items: [
      {
        title: 'Players',
        href: '/players',
        icon: Users,
        description: 'Browse and manage the player universe.',
      },
      {
        title: 'Tournaments',
        href: '/tournaments',
        icon: Flag,
        description: 'Schedule, fields, and event context.',
      },
      {
        title: 'Courses',
        href: '/courses',
        icon: MapPinned,
        description: 'Course profiles and playing conditions.',
      },
    ],
  },
  {
    title: 'Build',
    items: [
      {
        title: 'Models',
        href: '/models',
        icon: SlidersHorizontal,
        description: 'Design, tune, and deploy custom models.',
      },
    ],
  },
]

export const secondaryNavigation: NavItem[] = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Workspace, preferences, and account.',
  },
  {
    title: 'Help',
    href: '/help',
    icon: CircleHelp,
    description: 'Guides, documentation, and support.',
  },
]

export const allNavItems: NavItem[] = [
  ...primaryNavigation.flatMap((section) => section.items),
  ...secondaryNavigation,
]
