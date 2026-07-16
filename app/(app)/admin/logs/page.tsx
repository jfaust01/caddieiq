import type { Metadata } from 'next'

import { AdminComingSoon } from '@/features/admin/components/admin-coming-soon'

export const metadata: Metadata = {
  title: 'Logs',
  description: 'System and application logs for debugging and audits.',
}

export default function LogsPage() {
  return (
    <AdminComingSoon
      title="Logs"
      description="System and application logs for debugging and audits."
    />
  )
}
