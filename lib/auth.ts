import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"

import { prisma } from "@/lib/prisma"

/**
 * Resolve the base URL for Better Auth across every environment:
 * - explicit BETTER_AUTH_URL (custom domains)
 * - Vercel production domain
 * - the current Vercel deployment
 * - the v0 preview runtime
 */
function resolveBaseURL(): string | undefined {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.V0_RUNTIME_URL) return process.env.V0_RUNTIME_URL
  return undefined
}

/**
 * Accumulate every origin Better Auth should trust. Cookies from origins not
 * in this list are rejected, which would silently break auth in previews.
 */
function resolveTrustedOrigins(): string[] {
  const origins = new Set<string>()
  if (process.env.V0_RUNTIME_URL) origins.add(process.env.V0_RUNTIME_URL)
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  if (process.env.BETTER_AUTH_URL) origins.add(process.env.BETTER_AUTH_URL)

  // In development the app is served from localhost (or the preview proxies to
  // it), so the browser's request origin is http://localhost:<port>. Trust it
  // explicitly, otherwise Better Auth rejects requests with "Invalid origin".
  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT ?? "3000"
    origins.add(`http://localhost:${port}`)
    origins.add(`http://127.0.0.1:${port}`)
  }

  return Array.from(origins)
}

const isDev = process.env.NODE_ENV === "development"

export const auth = betterAuth({
  baseURL: resolveBaseURL(),
  trustedOrigins: resolveTrustedOrigins(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  // The v0 preview renders inside a cross-site iframe. Without these
  // attributes the browser silently drops the session cookie in dev.
  advanced: isDev
    ? {
        defaultCookieAttributes: {
          sameSite: "none",
          secure: true,
        },
      }
    : undefined,
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
