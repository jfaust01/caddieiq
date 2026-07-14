import { PrismaClient } from "./generated/prisma/client"

/**
 * Prisma Client singleton.
 *
 * In development Next.js clears the module cache on every request, which would
 * otherwise create a new `PrismaClient` (and a new connection pool) on each
 * reload. We cache the instance on `globalThis` to avoid exhausting database
 * connections. In production a single instance is created per server process.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma
