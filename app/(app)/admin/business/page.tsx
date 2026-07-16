import type { Metadata } from 'next'

import { AdminComingSoon } from '@/features/admin/components/admin-coming-soon'

export const metadata: Metadata = {
  title: 'Business Dashboard',
  description: 'Subscriptions, revenue, and user growth at a glance.',
}

export default function BusinessDashboardPage() {
  return (
    <AdminComingSoon
      title="Business Dashboard"
      description="Subscriptions, revenue, and user growth at a glance."
    />
  )
}
