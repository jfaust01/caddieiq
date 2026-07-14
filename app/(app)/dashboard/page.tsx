import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { DashboardView } from '@/features/dashboard/dashboard-view'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your command center for models, picks, and performance.',
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  // Load role + current subscription tier. The Better Auth session user does
  // not carry these app-specific fields, so read them from the database.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { tier: true },
      },
    },
  })

  const tier = user?.subscriptions[0]?.tier ?? 'FREE'

  return (
    <DashboardView
      name={user?.name ?? session.user.name ?? 'Golfer'}
      email={user?.email ?? session.user.email}
      tier={tier}
      isAdmin={user?.role === 'ADMIN'}
    />
  )
}
