import { PrismaNeon } from "@prisma/adapter-neon"

import { PrismaClient } from "./generated/prisma/client"

/**
 * Prisma Client singleton.
 *
 * Prisma v7 requires a driver adapter at runtime (the connection URL is no
 * longer read from `schema.prisma`). We use the Neon serverless adapter, which
 * connects over Neon's pooled `DATABASE_URL` and works in both Node and edge
 * runtimes.
 *
 * In development Next.js clears the module cache on every request, which would
 * otherwise create a new `PrismaClient` (and a new connection pool) on each
 * reload. We cache the instance on `globalThis` to avoid exhausting database
 * connections. In production a single instance is created per server process.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to your environment (see .env.example).")
  }

  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient()
    }
    const client = globalForPrisma.prisma
    const value = Reflect.get(client, prop)
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
})

if (process.env.NODE_ENV !== "production") {
  // Don't initialize here; let the proxy handle it
}

export default prisma
