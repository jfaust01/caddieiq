import "dotenv/config"
import { defineConfig } from "prisma/config"

/**
 * Prisma CLI configuration (Prisma v7+).
 *
 * The Prisma CLI (migrate / db push / studio) reads its connection string from
 * here. On Neon we prefer a *direct* (unpooled) connection for schema changes,
 * so migrations use `DATABASE_URL_UNPOOLED` when available and fall back to
 * `DATABASE_URL`. The runtime Prisma Client still connects via the pooled
 * `DATABASE_URL` declared in `prisma/schema.prisma`.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
})
