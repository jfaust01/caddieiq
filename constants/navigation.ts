import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CircleHelp,
  Database,
  Flag,
  LayoutDashboard,
  MapPinned,
  Settings,
  ShieldCheck,
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
  /** Only rendered for users with the ADMIN role. */
  adminOnly?: boolean
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
    ],
  },
  {
    title: 'Golf Intelligence',
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
      {
        title: 'Rankings',
        href: '/rankings',
        icon: Trophy,
        description: 'Live leaderboards driven by your models.',
      },
    ],
  },
  {
    title: 'Model Lab',
    items: [
      {
        title: 'Models',
        href: '/models',
        icon: SlidersHorizontal,
        description: 'Design, tune, and deploy custom models.',
      },
    ],
  },
  {
    title: 'Operations',
    adminOnly: true,
    items: [
      {
        title: 'Data Sources',
        href: '/operations/data-sources',
        icon: Database,
        description: 'Provider health and import monitoring.',
      },
      {
        title: 'Administration',
        href: '/operations/admin',
        icon: ShieldCheck,
        description: 'Users, subscriptions, and data quality.',
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
