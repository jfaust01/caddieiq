import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

/**
 * Routes that require an authenticated session. Add future authenticated
 * route prefixes here as they are built.
 */
const PROTECTED_PREFIXES = ["/dashboard"]

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtected(pathname)) {
    return NextResponse.next()
  }

  // Edge-safe presence check of the session cookie. Full session validation
  // still happens in server components/actions via auth.api.getSession().
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
