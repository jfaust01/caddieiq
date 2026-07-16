import type { Metadata } from 'next'

import { AdminDashboardView } from '@/features/admin/dashboard/admin-dashboard-view'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Administration entry point: platform health, data pipelines, and system management.',
}

/**
 * Admin landing page. Access control is enforced by the parent
 * `app/(app)/admin/layout.tsx`, which is intentionally left unchanged.
 */
export default function AdminPage() {
  return <AdminDashboardView />
}
