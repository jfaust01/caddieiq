import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { DashboardViewNew } from '@/features/dashboard/dashboard-view-new'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Premium DFS Command Center for tournament analytics and lineup optimization.',
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  return <DashboardViewNew session={session} />
}
