import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

/**
 * Routes that require an authenticated session. Add future authenticated
 * route prefixes here as they are built.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/admin"]

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /setup routes - only allow in development
  if (pathname.startsWith("/setup")) {
    if (process.env.NODE_ENV !== "development") {
      // In production, return 404 to hide the existence of these routes
      return new NextResponse("Not Found", { status: 404 })
    }
    // In development, allow /setup routes without authentication
    return NextResponse.next()
  }

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
  matcher: ["/dashboard/:path*", "/admin/:path*", "/setup/:path*"],
}
