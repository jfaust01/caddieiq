import type { Metadata } from 'next'

import { AdminComingSoon } from '@/features/admin/components/admin-coming-soon'

export const metadata: Metadata = {
  title: 'Users',
  description: 'Manage accounts, roles, and access.',
}

export default function UsersPage() {
  return (
    <AdminComingSoon
      title="Users"
      description="Manage accounts, roles, and access."
    />
  )
}
