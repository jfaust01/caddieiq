'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

interface AdminGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Client-side component to conditionally render content based on admin status.
 * Checks session role from Better Auth (client-side convenience).
 * For server-side protection, use isCurrentUserAdmin() from lib/session.ts
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { data: session } = useSession()
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === 'ADMIN'

  if (!isAdmin) {
    return fallback || null
  }

  return children
}
