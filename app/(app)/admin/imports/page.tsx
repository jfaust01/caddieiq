import type { Metadata } from 'next'

import { AdminComingSoon } from '@/features/admin/components/admin-coming-soon'

export const metadata: Metadata = {
  title: 'Imports',
  description: 'Recent import runs, records processed, and failures.',
}

export default function ImportsPage() {
  return (
    <AdminComingSoon
      title="Imports"
      description="Recent import runs, records processed, and failures."
    />
  )
}
