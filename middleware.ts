import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware to protect development-only routes from production access.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Protect /setup routes - only allow in development
  if (pathname.startsWith("/setup")) {
    if (process.env.NODE_ENV !== "development") {
      // In production, return 404 to hide the existence of these routes
      return new NextResponse("Not Found", { status: 404 })
    }
  }

  return NextResponse.next()
}

/**
 * Matcher for which routes to run middleware on.
 */
export const config = {
  matcher: ["/setup/:path*", "/api/setup/:path*"],
}
