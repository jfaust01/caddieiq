import type { Metadata } from 'next'

import { AdminComingSoon } from '@/features/admin/components/admin-coming-soon'

export const metadata: Metadata = {
  title: 'Providers',
  description: 'Upstream data provider connectivity and rate limits.',
}

export default function ProvidersPage() {
  return (
    <AdminComingSoon
      title="Providers"
      description="Upstream data provider connectivity and rate limits."
    />
  )
}
