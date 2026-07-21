# ADR-020: Monitoring and Error Tracking

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Operations Team  

---

## Context

CaddieIQ needs visibility into:
- Application errors
- Performance issues
- User behavior
- System health

---

## Decision

**Use structured logging and error tracking:**

1. **Console logging** — Development
2. **Structured logs** — Production (JSON)
3. **Error tracking** — Sentry (optional, for paid tier)

---

## Implementation

### Structured Logging
```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export function log(
  level: LogLevel,
  message: string,
  context?: Record<string, any>
) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
    environment: process.env.NODE_ENV
  }
  
  if (process.env.NODE_ENV === 'production') {
    // Structured JSON for log aggregation
    console.log(JSON.stringify(logEntry))
  } else {
    // Pretty print for development
    console.log(`[${level.toUpperCase()}] ${message}`, context)
  }
}

export const logger = {
  debug: (msg: string, ctx?: any) => log('debug', msg, ctx),
  info: (msg: string, ctx?: any) => log('info', msg, ctx),
  warn: (msg: string, ctx?: any) => log('warn', msg, ctx),
  error: (msg: string, ctx?: any) => log('error', msg, ctx)
}
```

### Usage
```typescript
// lib/tournament/service.ts
export class TournamentService {
  async create(input: TournamentInput) {
    logger.info('Creating tournament', { input })
    
    try {
      const result = await this.repository.create(input)
      
      logger.info('Tournament created', {
        tournamentId: result.id,
        name: input.name
      })
      
      return { ok: true, data: result }
    } catch (error) {
      logger.error('Failed to create tournament', {
        input,
        error: error.message,
        stack: error.stack
      })
      
      return {
        ok: false,
        error: new Error('Failed to create tournament')
      }
    }
  }
}
```

### Error Tracking (Optional)
```typescript
// lib/sentry.ts (if enabled)
import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        new Sentry.Integrations.ContextLines({ frameContext: 5 })
      ]
    })
  }
}

// In error scenarios
export function captureException(error: Error, context?: any) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context })
  }
}
```

---

## Consequences

### ✓ Positive

- Track production issues
- Understand performance
- Debug with logs
- Detect patterns

### ✗ Negative

- Performance overhead (minimal)
- Requires log aggregation
- Sensitive data in logs (must redact)

---

## Related ADRs

- ADR-018: Environment variable management (SENTRY_DSN)

