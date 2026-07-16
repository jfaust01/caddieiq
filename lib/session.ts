import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Returns the current session (user + session) or null.
 * Safe to call from server components, layouts, and route handlers.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

/**
 * Returns the current user id, or throws if unauthenticated.
 * Use inside server actions that read or write user-scoped data. There is no
 * RLS on Neon, so every such query MUST be scoped by this id.
 */
export async function getUserId(): Promise<string> {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

/**
 * Whether the current session belongs to an ADMIN. Returns `false` (never
 * throws) for anonymous or non-admin callers, so it is safe to use both as a
 * gate in server actions and to decide whether to render admin-only controls.
 * The role is always re-read from the database — never trusted from the client.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await getSession()
  if (!session?.user) return false
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  return user?.role === "ADMIN"
}
