import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { isCurrentUserAdmin } from '@/lib/session'

interface AdminLayoutProps {
  children: ReactNode
}

/**
 * Layout protecting all /admin/* routes with role-based access control.
 * Non-authenticated users are redirected to login.
 * Non-admin authenticated users are shown a friendly access denied page.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = await isCurrentUserAdmin()

  if (!isAdmin) {
    redirect('/admin/access-denied')
  }

  return children
}
