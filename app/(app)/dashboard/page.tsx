import type { Metadata } from 'next'

import { DashboardView } from '@/features/dashboard/dashboard-view'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your command center for models, picks, and performance.',
}

export default function DashboardPage() {
  return <DashboardView />
}
