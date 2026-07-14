# caddieiq-application-foundation

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_L1kgf2Q10A773kp9JJOmhARrcdQI)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Database (Prisma + PostgreSQL)

CaddieIQ uses [Prisma](https://www.prisma.io) as its ORM against a PostgreSQL
database (Neon-compatible).

1. Copy the environment template and fill in your connection strings:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — pooled connection string (used by the app at runtime).
   - `DATABASE_URL_UNPOOLED` — direct/unpooled connection string (used by the
     Prisma CLI for migrations). Optional; falls back to `DATABASE_URL`.

2. Generate the Prisma Client and apply migrations:

   ```bash
   pnpm db:generate        # generate the typed client into lib/generated/prisma
   pnpm db:migrate          # create/apply migrations in development
   ```

   Other helpers: `pnpm db:migrate:deploy` (apply migrations in production),
   `pnpm db:push` (push schema without a migration), `pnpm db:studio`
   (open Prisma Studio).

The schema lives in `prisma/schema.prisma` and the singleton client is exported
from `lib/prisma.ts` (backed by the Neon serverless driver adapter).

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
