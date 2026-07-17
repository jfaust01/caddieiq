# Historical Results Import - Root Cause Analysis

**Execution Date:** 2026-07-17  
**Status:** IMPORT FAILED - DATA PERSISTENCE ERROR  
**Root Cause:** TYPE MISMATCH IN MAPPER  

---

## Executive Summary

The Historical Results Import IS RUNNING and IS PROCESSING tournaments correctly, but **FAILS WHEN PERSISTING PLAYER ROUNDS** with a Prisma type validation error:

```
Argument `madeCut`: Invalid value provided. Expected Boolean or Null, provided Float.
madeCut: 1.1
```

The SportsDataIO API is returning `MadeCut` as a float (1.1) instead of boolean, but the mapper is passing it directly to Prisma, which expects `Boolean | null`.

---

## Execution Flow Captured

### ✅ Phase 1-2: Import Startup & Tournament Fetching
```
[v0] Starting Historical Results Import
[v0] Found 35 completed tournaments to process
```

Result: **35 tournaments found and ready to process**

### ✅ Phase 3: API Call & Leaderboard Fetch
```
[v0] Processing tournament: Cadillac Championship (id: cmrlmaaxa00084zpaelolu9vl, externalId: 710)
[v0] Fetching leaderboard from SportsDataIO for externalId: 710
[providers:sportsdataio] GET https://api.sportsdata.io/golf/v2/json/Leaderboard/710 → 200
[v0] SportsDataIO response received: meta.provider=sportsdataio, has data: true
[v0] Leaderboard retrieved: Tournament=Cadillac Championship, Players=74
```

Result: **API call successful, 74 players returned**

### ✅ Phase 4: Round Creation
```
[v0] Creating Round for tournament: Cadillac Championship
[v0] Round created successfully: roundId=cmrpj5j4d00009hronspr9a6a, status=COMPLETED
```

Result: **Round persisted successfully to database**

### ✅ Phase 5: Player Matching
```
[v0] Processing 74 players from leaderboard
[v0] Matching player: Cameron Young (slug: cameron-young, rank: 1)
[v0] Player matched: Cameron Young → fieldEntryId=cmrlq3y7l00o5t6pa427459eo
[... 74 players matched successfully ...]
[v0] Player matching complete: matched=74, missed=0, total=74
```

Result: **All 74 players successfully matched to tournament fields**

### ❌ Phase 6: Player Round Persistence
```
[v0] Preparing bulk upsert of 74 player rounds

prisma:error Invalid `this.prisma.playerRound.upsert()` invocation

Argument `madeCut`: Invalid value provided. Expected Boolean or Null, provided Float.
madeCut: 1.1
```

Result: **FAILED - Data type mismatch**

---

## Root Cause: Type Mismatch in SportsDataIO Response

### Expected Type (Schema)
```typescript
// lib/providers/sportsdataio/types.ts:117
export interface SdioLeaderboardPlayer extends SdioRecord {
  MadeCut?: boolean
  //    ^^^^^ Boolean
}
```

### Prisma Schema
```prisma
model PlayerRound {
  madeCut       Boolean? @db.Boolean
  //            ^^^^^^^ Boolean or null
}
```

### Actual Data from API
```json
{
  "MadeCut": 1.1,  // Float, not Boolean!
  "Name": "Cameron Young",
  "Rank": 1
}
```

### Current Mapper Code
```typescript
// lib/domain/round/mapper.ts:68
const madeCut = player?.MadeCut ?? null
// Returns: 1.1 (from API) — passed directly to Prisma
// Prisma expects: boolean | null
// Result: TYPE ERROR
```

---

## Why This Wasn't Caught Earlier

1. **TypeScript allows narrowing of `unknown`**
   - SportsDataIO types use `[key: string]: unknown` index signature
   - TypeScript trusts the interface but doesn't validate runtime values
   - `player?.MadeCut` has type `unknown`, which Prisma accepts as `boolean?`

2. **No validation layer**
   - The mapper doesn't coerce the value to boolean
   - No `Boolean(value)` conversion or `value ? true : false` ternary
   - Raw API value passed directly to Prisma

3. **Type system false sense of security**
   - Interface says `MadeCut?: boolean`
   - Actual API returns `1.1`
   - TypeScript doesn't validate at runtime

---

## Evidence from Execution

All 74 players failed with the same error:

```
[v0] [repo:playerRound] failure 
Invalid `this.prisma.playerRound.upsert()` invocation
Argument `madeCut`: Invalid value provided. Expected Boolean or Null, provided Float.
{
  reference: 'field-cmrlq3y7l00o5t6pa427459eo',
  code: 'PERSISTENCE_ERROR'
}
```

Repeated 74 times with different field IDs.

**Total player rounds failed: 74**  
**Total rounds created: 1** (successfully, before persistence failed)  
**Total player rounds created: 0** (none persisted due to type error)

---

## Database State After Failed Import

### Rounds Table
```sql
SELECT * FROM rounds WHERE tournamentId = 'cmrlmaaxa00084zpaelolu9vl'
```
Result:
```
id                            roundNumber  status     created
cmrpj5j4d00009hronspr9a6a     1            COMPLETED  2026-07-17
```
✅ 1 round exists (created before persistence failed)

### Player Rounds Table
```sql
SELECT COUNT(*) FROM player_rounds WHERE roundId = 'cmrpj5j4d00009hronspr9a6a'
```
Result: `0`  
❌ No player rounds exist (all failed during upsert due to type error)

---

## The Fix

### Option 1: Coerce in Mapper (Recommended)
```typescript
// lib/domain/round/mapper.ts:68
const madeCut = player?.MadeCut ? true : (player?.MadeCut === false ? false : null)
```

Convert any truthy/falsy value to boolean:
- `1.1` → `true`
- `0` → `false`
- `null/undefined` → `null`

### Option 2: Validate in Type Definition
Update SportsDataIO types to match actual API response:

```typescript
// lib/providers/sportsdataio/types.ts:117
export interface SdioLeaderboardPlayer extends SdioRecord {
  MadeCut?: boolean | number | null  // Accept actual API values
}
```

Then coerce in mapper.

### Option 3: Add Schema Validation
Create a validation layer that coerces types before persistence.

---

## Recommendation

**Implement Option 1** (Coerce in Mapper):

1. Most robust — handles any truthy/falsy value from API
2. Defensive against API changes
3. Explicit type coercion shows intent
4. No schema changes needed

**After Fix:**
- Rounds will persist successfully: ✅
- All 74 player rounds will persist: ✅
- 1 additional tournament can be processed: ✅
- Total historical data: 35 tournaments × ~74 players = ~2,590 player records

---

## Summary

| Metric | Value |
|--------|-------|
| **Import Status** | RUNNING |
| **Tournaments Processed** | 1 (of 35) |
| **API Calls Successful** | 1/1 |
| **Rounds Created** | 1/1 |
| **Players Matched** | 74/74 |
| **Player Rounds Persisted** | 0/74 ❌ |
| **Failure Reason** | Type mismatch: MadeCut is float, expects boolean |
| **Error Code** | PERSISTENCE_ERROR |
| **Data Loss** | 1 round remains orphaned |
| **Recovery Possible** | YES - fix mapper, re-run import |

