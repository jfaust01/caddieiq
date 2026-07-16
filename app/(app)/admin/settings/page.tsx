import type { Metadata } from 'next'

import { AdminComingSoon } from '@/features/admin/components/admin-coming-soon'

export const metadata: Metadata = {
  title: 'Admin Settings',
  description: 'Platform-wide configuration and operational toggles.',
}

export default function AdminSettingsPage() {
  return (
    <AdminComingSoon
      title="Settings"
      description="Platform-wide configuration and operational toggles."
    />
  )
}
