# Coding Conventions

**Phase:** 15.3C — Platform Engineering Standards

---

## Naming

- Functions: camelCase (`getTournament`)
- Classes: PascalCase (`TournamentService`)
- Constants: UPPER_SNAKE_CASE (`MAX_RESULTS`)
- Booleans: start with `is` or `has` (`isActive`, `hasChildren`)

---

## File Organization

```
lib/
  domain/
    <domain>/
      index.ts          # Exports
      types.ts          # Type definitions
      constants.ts      # Constants
      mapper.ts         # Data mapping
      
  <domain>/
    service.ts          # Business logic
    builder.ts          # Intelligence engines
    types.ts            # Domain types
    
  repositories/
    <entity>-repository.ts
```

---

## Imports

```typescript
// Group imports logically
import 'server-only'  // Server-only marker

// Third-party
import { cache } from 'react'
import { z } from 'zod'

// Internal types
import type { Player, Tournament } from '@/lib/types'

// Internal implementations
import { playerRepository } from '@/lib/repositories'
import { logger } from '@/lib/logger'
```

---

## Comments

Comment **why**, not what:

```typescript
// ✓ CORRECT: Explains why
// Batch load players to avoid N+1 queries
const players = await playerRepository.findMany({ ids: playerIds })

// ❌ WRONG: Obvious from code
// Set players array
const players = []
```

---

## Error Messages

Make error messages helpful:

```typescript
// ✓ CORRECT
throw new Error(
  `Tournament ${id} not found. ` +
  `Please check the ID and try again.`
)

// ❌ WRONG
throw new Error('Not found')
```

