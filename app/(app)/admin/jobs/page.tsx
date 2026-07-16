import type { Metadata } from 'next'

import { AdminComingSoon } from '@/features/admin/components/admin-coming-soon'

export const metadata: Metadata = {
  title: 'Jobs',
  description: 'Scheduled and background jobs, schedules, and outcomes.',
}

export default function JobsPage() {
  return (
    <AdminComingSoon
      title="Jobs"
      description="Scheduled and background jobs, schedules, and outcomes."
    />
  )
}
