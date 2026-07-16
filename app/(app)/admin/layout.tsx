import { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { AdminSidebar } from '@/features/admin/components/admin-sidebar'
import { isCurrentUserAdmin } from '@/lib/session'

interface AdminLayoutProps {
  children: ReactNode
}

/**
 * Layout protecting all /admin/* routes with role-based access control.
 * Non-authenticated users are redirected to login.
 * Non-admin authenticated users are shown a friendly access denied page.
 *
 * Authentication and authorization are intentionally unchanged — this layout
 * only adds the persistent Admin sidebar around the already-protected content.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = await isCurrentUserAdmin()

  if (!isAdmin) {
    redirect('/access-denied')
  }

  return (
    <div className="flex w-full">
      <AdminSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
