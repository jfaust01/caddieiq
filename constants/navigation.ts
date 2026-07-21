import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BarChart3,
  CircleHelp,
  Database,
  Flag,
  History,
  LayoutDashboard,
  MapPinned,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
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
        title: 'AI Caddie',
        href: '/caddie',
        icon: Sparkles,
        description: 'Ask about cash plays, course fit, form, odds, and weather.',
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
    title: 'Historical Intelligence',
    items: [
      {
        title: 'Tournaments',
        href: '/historical/tournaments',
        icon: History,
        description: 'Browse complete historical tournament data and replay.',
      },
      {
        title: 'Players',
        href: '/historical/players',
        icon: Users,
        description: 'Historical player statistics and performance trends.',
      },
      {
        title: 'Replay',
        href: '/historical/replay',
        icon: Flag,
        description: 'Reconstruct tournaments with historical context.',
      },
      {
        title: 'Trends',
        href: '/historical/trends',
        icon: TrendingUp,
        description: 'Analyze historical patterns and correlations.',
      },
    ],
  },
  {
    title: 'Model Lab',
    items: [
      {
        title: 'Models',
        href: '/model-lab',
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
        title: 'Admin Dashboard',
        href: '/admin',
        icon: ShieldCheck,
        description: 'Administration entry point for platform operations.',
      },
      {
        title: 'Database Health',
        href: '/admin/database-health',
        icon: Database,
        description: 'Live database health, table populations, and import pipelines.',
      },
      {
        title: 'System Health',
        href: '/admin/system-health',
        icon: Activity,
        description: 'Weather ingestion and background system diagnostics.',
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
