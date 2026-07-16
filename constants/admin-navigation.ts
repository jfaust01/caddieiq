import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Building2,
  Database,
  DownloadCloud,
  FileText,
  HeartPulse,
  ListChecks,
  Settings,
  Users,
} from 'lucide-react'

export interface AdminNavItem {
  /** Card / nav label. */
  title: string
  /** Canonical route. */
  href: string
  icon: LucideIcon
  /** Short description shown on the dashboard card. */
  description: string
  /**
   * When true, the destination is implemented and links normally. When false,
   * the card renders a non-interactive "Coming Soon" state instead of a link
   * to a route that would 404.
   */
  implemented: boolean
}

/**
 * The complete Admin sitemap. This single source of truth drives:
 *  - the Admin Dashboard cards (`/admin`)
 *  - the Admin sidebar
 *  - which routes exist as real pages vs. placeholders
 *
 * Every entry points at a route that resolves (either a full feature page or a
 * placeholder page), so there are no broken links anywhere in the admin area.
 */
export const adminNavItems: AdminNavItem[] = [
  {
    title: 'Database Health',
    href: '/admin/database-health',
    icon: Database,
    description: 'Table populations, row counts, and live import pipeline status.',
    implemented: true,
  },
  {
    title: 'System Health',
    href: '/admin/system-health',
    icon: HeartPulse,
    description: 'Weather ingestion and diagnostics for background systems.',
    implemented: true,
  },
  {
    title: 'Business Dashboard',
    href: '/admin/business',
    icon: Building2,
    description: 'Subscriptions, revenue, and user growth at a glance.',
    implemented: false,
  },
  {
    title: 'Imports',
    href: '/admin/imports',
    icon: DownloadCloud,
    description: 'Recent import runs, records processed, and failures.',
    implemented: false,
  },
  {
    title: 'Providers',
    href: '/admin/providers',
    icon: Activity,
    description: 'Upstream data provider connectivity and rate limits.',
    implemented: false,
  },
  {
    title: 'Jobs',
    href: '/admin/jobs',
    icon: ListChecks,
    description: 'Scheduled and background jobs, schedules, and outcomes.',
    implemented: false,
  },
  {
    title: 'Logs',
    href: '/admin/logs',
    icon: FileText,
    description: 'System and application logs for debugging and audits.',
    implemented: false,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage accounts, roles, and access.',
    implemented: false,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Platform-wide configuration and operational toggles.',
    implemented: false,
  },
]

/** Routes that must have a real placeholder page so links never 404. */
export const adminPlaceholderRoutes = adminNavItems
  .filter((item) => !item.implemented)
  .map((item) => item.href)
