# ADR-004: Deterministic UTC Formatting is Required

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Architecture Team, Data Team  

---

## Context

Timestamps are used throughout CaddieIQ:
- Tournament start/end dates
- Player round timestamps
- Weather forecast times
- Build timestamps

The challenge: How to ensure timestamps are consistent across all systems, APIs, databases, and timezones?

---

## Decision

**All timestamps must be:**
1. **UTC** — Always stored in UTC timezone
2. **ISO 8601 format** — `2026-07-20T14:30:00Z`
3. **Deterministic** — Same input always produces same format
4. **Never local** — Never use client's local timezone

---

## Rationale

### ✓ Advantages of UTC-Only

1. **Global Consistency**
   - Tournament in Hawaii same time as user in New York
   - No timezone confusion
   - Comparisons work correctly

2. **Database Reliability**
   - All databases store same values
   - No conversion errors
   - Easy replication across regions

3. **API Consistency**
   - All API responses consistent format
   - Clients can parse with standard library
   - No format surprises

4. **Determinism**
   - Same tournament always displays same time
   - No daylight saving issues
   - Reproducible bugs

5. **Historical Accuracy**
   - Past events always have correct time
   - No "lost hour" issues
   - Reliable event history

### ✗ Problems with Local Time

```typescript
// ❌ WRONG: Using local time
const start = new Date()  // Uses client timezone!

// ❌ WRONG: Storing in database as local
await prisma.tournament.create({
  startDate: new Date()  // Stored as local time
})

// ❌ WRONG: Inconsistent formatting
const dates = [
  '07/20/2026',      // US format
  '20/07/2026',      // EU format
  '2026-07-20',      // ISO date
  '14:30 EDT'        // Local timezone
]
```

---

## Implementation Rules

### ✓ Correct Patterns

```typescript
// 1. Store in UTC
const tournament = await prisma.tournament.create({
  name: 'Cadillac Championship',
  startDate: new Date('2026-07-20T14:30:00Z')  // UTC
})

// 2. Return ISO 8601
const response = {
  startDate: tournament.startDate.toISOString()  // "2026-07-20T14:30:00Z"
}

// 3. Parse with timezone handling
const userTime = new Date('2026-07-20T14:30:00Z')
// Let client convert to local with libraries like date-fns

// 4. Compare using UTC
if (tournament.startDate > new Date()) {
  // Tournament hasn't started
}

// 5. Format in service, not repository
export function formatTournamentTime(date: Date): string {
  if (!date) return 'TBD'
  return date.toISOString()  // ISO 8601 UTC
}
```

### ❌ Anti-Patterns

```typescript
// ❌ WRONG: Local time assumption
new Date('07/20/2026')  // Parsed as local time!

// ❌ WRONG: Timezone conversion in storage
await prisma.tournament.create({
  startDate: moment.tz(time, 'America/New_York').toDate()
})

// ❌ WRONG: Custom formatting
date.toLocaleDateString()  // Not deterministic!
date.toString()  // Includes timezone

// ❌ WRONG: Storing as string
{ startDate: "July 20" }  // Not comparable!

// ❌ WRONG: Assuming client timezone
const userStart = new Date() // Client timezone
api.send({ startDate: userStart })
```

---

## Timezone Handling

### Client Side
```typescript
'use client'

export function TournamentTime({ tournamentDate }: Props) {
  // Parse ISO 8601 UTC
  const date = new Date(tournamentDate)  // "2026-07-20T14:30:00Z"
  
  // Format for user's local timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  return <div>{formatter.format(date)}</div>
}
```

### Server Side
```typescript
// ✓ Always work in UTC
const tournament = await db.tournament.findById(id)
const now = new Date()  // UTC

if (tournament.startDate > now) {
  // Not started (works in any timezone)
}

// Return ISO 8601 UTC to client
return { startDate: tournament.startDate.toISOString() }
```

---

## Database Rules

### Prisma Schema
```prisma
model Tournament {
  id        String   @id
  startDate DateTime @db.Timestamptz  // Store as UTC with timezone
  endDate   DateTime @db.Timestamptz
  
  createdAt DateTime @default(now()) @db.Timestamptz
  updatedAt DateTime @updatedAt @db.Timestamptz
}
```

### Why Timestamptz?
- Stores UTC with timezone info
- PostgreSQL handles conversion
- Always returns UTC
- Safe for comparisons

---

## Related ADRs

- ADR-007: Builders are pure functions (determinism required)
- ADR-001: Feature-based architecture across timezones

---

## Validation Checklist

- [ ] All dates stored in UTC (Timestamptz)
- [ ] All dates returned as ISO 8601
- [ ] No local time assumptions
- [ ] Client converts to local for display
- [ ] Tests use UTC timestamps
- [ ] No timezone-dependent logic
- [ ] Comparisons work in any timezone

