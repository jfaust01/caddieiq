import { headers } from "next/headers"

import { auth } from "@/lib/auth"

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
