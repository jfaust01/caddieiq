# ADR-009: Neon + Better Auth Stack

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Infrastructure Team  

---

## Context

CaddieIQ requires:
- Persistent relational data storage (tournaments, courses, players, rounds)
- User authentication and session management
- Multi-region scalability
- Developer experience (migrations, seeding, introspection)

Multiple stacks were evaluated for production database + auth layer.

---

## Decision

**Use Neon Postgres + Better Auth** as the primary database and authentication layer.

```typescript
// auth.config.ts
import { betterAuth } from "better-auth"
import { neonAdapter } from "@better-auth/adapter-drizzle"

export const auth = betterAuth({
  database: neonAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    autoSignUpNewUsers: false
  }
})
```

---

## Rationale

### ✓ Why Neon + Better Auth

**Neon Strengths:**
1. **Serverless Postgres** — Cold start optimized, autoscaling
2. **Branching** — Clone databases for testing/staging
3. **Smart driver** — Connection pooling at edge
4. **Migration-friendly** — Uses Drizzle ORM migrations
5. **Cost-effective** — Pay per compute, not per connection

**Better Auth Strengths:**
1. **Modern Framework** — Built for Next.js 16
2. **Type-safe** — Full TypeScript support, generated types
3. **Flexible** — Email/password, OAuth, magic links, passkeys
4. **Server Actions Ready** — Native RSC/Server Action support
5. **Multi-backend** — Works with any Postgres database
6. **Lightweight** — Minimal dependencies, no bloat

**Together They:**
1. **Zero Lock-in** — Better Auth works with any Postgres
2. **Edge-Ready** — Neon serverless + RSC = optimal
3. **Developer Experience** — Migrations, seeding, introspection
4. **Production-Ready** — Both have mature APIs and ecosystem
5. **Cost-Effective** — Serverless pricing fits CaddieIQ scale

---

## Alternatives Considered

### Alternative 1: Supabase (Firebase alternative)
```typescript
// Pros: Full platform (auth + DB + storage)
// Cons: 
//   - Vendor lock-in (can't move auth easily)
//   - RLS required for security (more complex)
//   - More expensive at scale
//   - Overkill for CaddieIQ needs
```
**Rejected:** Vendor lock-in, unnecessary features, higher cost.

### Alternative 2: Railway Postgres + Auth.js
```typescript
// Pros: Simple, open standards
// Cons:
//   - Railway less scalable than Neon
//   - Auth.js more complex for simple password auth
//   - Not serverless (no cold start optimization)
```
**Rejected:** Less scalable, more complex auth setup.

### Alternative 3: PlanetScale MySQL + Lucia Auth
```typescript
// Pros: MySQL familiar, Lucia lightweight
// Cons:
//   - MySQL ecosystem less rich for this use case
//   - Harder to migrate away from PlanetScale
//   - Less active development
```
**Rejected:** Weaker ecosystem, less scalable.

---

## Implementation

### Database Setup
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Neon expects: postgresql://user:password@host:port/db
// For local dev: postgresql://postgres:password@localhost:5432/caddieiq
```

### Authentication Setup
```typescript
// lib/auth/auth.config.ts
import { betterAuth } from "better-auth"
import { neonAdapter } from "@better-auth/adapter-drizzle"
import { db } from "@/lib/db"

export const auth = betterAuth({
  database: neonAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET!,
  
  emailAndPassword: {
    enabled: true,
    autoSignUpNewUsers: false,
    password: {
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    }
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // Update every day
  },
  
  user: {
    // Custom fields for CaddieIQ
    additionalFields: {
      golfHandicap: {
        type: "string",
        required: false
      },
      favoriteGolfCourse: {
        type: "string",
        required: false
      }
    }
  }
})
```

### Environment Setup
```bash
# .env.local
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
```

---

## Consequences

### ✓ Positive

- Serverless scaling without complexity
- Type-safe authentication
- Migrations built-in
- Better Auth works with any Postgres (not locked in)
- Cold start optimized
- Excellent DX for teams
- Cost-effective at CaddieIQ scale

### ✗ Negative

- Neon cold starts (mitigated by keep-alive)
- Requires understanding Postgres (not beginner-friendly)
- Better Auth relatively new (though production-ready)
- Need BETTER_AUTH_SECRET in environment

---

## Migration Path

If ever needed:
- **Neon → Self-hosted Postgres:** Just change DATABASE_URL
- **Neon → PlanetScale:** Rewrite migrations, same Better Auth
- **Better Auth → Supabase Auth:** Export users, recreate in Supabase
- **Better Auth → Auth.js:** Migrate session tables manually

---

## Monitoring & Operations

```typescript
// Neon health check
export async function checkNeonConnection() {
  try {
    await db.query`SELECT 1`
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

// Auth health check
export async function checkAuthSetup() {
  if (!process.env.BETTER_AUTH_SECRET) {
    return { ok: false, error: 'BETTER_AUTH_SECRET not set' }
  }
  return { ok: true }
}
```

---

## Related ADRs

- ADR-005: Result<T> error handling for auth operations
- ADR-010: Database query patterns with Neon
- ADR-004: UTC timestamps for auth events

