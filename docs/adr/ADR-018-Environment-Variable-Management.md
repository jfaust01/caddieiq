# ADR-018: Environment Variable Management

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** DevOps & Infrastructure Team  

---

## Context

CaddieIQ requires environment variables for:
- Database URL (Neon)
- Auth secret (Better Auth)
- Third-party API keys

Challenge: How to manage across dev, staging, production?

---

## Decision

**Use Next.js built-in environment variable support with validation.**

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  
  // Third-party
  STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
})

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV
})

// Type safety
export type Env = typeof env
```

### Usage
```typescript
// lib/db/index.ts
import { env } from '@/lib/env'

const db = drizzle(env.DATABASE_URL)
```

### Environment Files

```bash
# .env.local (local development)
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# .env.production (deployed)
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=https://caddieiq.com

# .env.test (testing)
DATABASE_URL=postgresql://test_db
BETTER_AUTH_SECRET=test_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Conventions

- `NEXT_PUBLIC_*` — Exposed to browser (client-safe only)
- No `NEXT_PUBLIC_*` — Server-only (secrets)
- All variables validated on startup
- Missing variables = crash at build time (good)

---

## Consequences

### ✓ Positive

- Type-safe environment variables
- Validation at startup (fail fast)
- Consistent across environments
- Clear which variables are client-exposed

### ✗ Negative

- Must maintain schema
- Breaking changes if removing variables

---

## Related ADRs

- ADR-009: Neon + Better Auth (uses DATABASE_URL, BETTER_AUTH_SECRET)

