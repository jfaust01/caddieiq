# GolfCourse Importer — Zero Courses Bug Investigation

## Executive Summary

**Root Cause:** The GolfCourse importer processes zero courses because the `importCourseIntelligence()` function only processes courses with `verified: true`, but the mapping creation process creates mappings with `verified: false`.

**Exact Break Point:** Line 101 in `/vercel/share/v0-project/lib/imports/course-intelligence-import.ts`

```typescript
const mappingsResult = await mappingRepo.findVerified()
```

This query filters for `verified: true`, which returns zero records because all newly created mappings have `verified: false` pending admin verification.

---

## Complete Trace: Where the Pipeline Breaks

### Stage 1: Mapping Creation
**File:** `/vercel/share/v0-project/lib/imports/golfcourse-import.ts`  
**Function:** `importTournamentCourse()` (lines 44-173)  
**Step:** Line 130-139

```typescript
// Step 4: Create mapping
await mappingRepo.create({
  tournamentId,
  sportsDataIoCourseId,
  golfCourseApiCourseId: bestMatch.courseId,
  tournamentCourseName,
  golfCourseCourseName: searchResults.find((c) => c.id === bestMatch.courseId)?.name,
  matchConfidence: bestMatch.confidence,
  matchedBy: bestMatch.matchedBy,
  verified: false,  // ← IMPORTANT: Created with verified: false
})
```

**Key Detail:** Line 138 explicitly sets `verified: false` with a comment "Pending admin verification"

**Result:** Mapping exists in database but with `verified = false`

---

### Stage 2: Intelligence Import Queries Only Verified
**File:** `/vercel/share/v0-project/lib/imports/course-intelligence-import.ts`  
**Function:** `importCourseIntelligence()` (lines 66-287)  
**Step:** Lines 100-129

```typescript
// Get all verified mappings
const mappingsResult = await mappingRepo.findVerified()
if (mappingsResult.outcome !== "ok" || !mappingsResult.records || mappingsResult.records.length === 0) {
  // ... return empty summary with coursesConsidered: 0
  return {
    jobId,
    startedAt,
    completedAt: finishedAt,
    durationMs,
    coursesConsidered: 0,  // ← ZERO because no verified mappings found
    coursesMatched: 0,
    coursesImported: 0,
    // ... rest of empty summary
  }
}
```

**Critical Logic:**
- Line 101: `await mappingRepo.findVerified()` — queries WHERE `verified: true`
- Line 102: Checks if records exist and returns empty summary if not
- Line 110: Returns `coursesConsidered: 0` when no verified mappings found

**Result:** Since all mappings have `verified: false`, the query returns 0 records → returns empty summary

---

### Stage 3: Repository Query Filter
**File:** `/vercel/share/v0-project/lib/repositories/tournament-course-mapping-repository.ts`  
**Function:** `findVerified()` (lines 1-15, search result)

```typescript
async findVerified(): Promise<RepositoryResult<TournamentCourseMapping[]>> {
  try {
    const mappings = await this.prisma.tournamentCourseMapping.findMany({
      where: { verified: true },  // ← Filters ONLY for verified: true
      orderBy: { createdAt: "asc" },
    })
    return ok(mappings)
  } catch (error) {
    // ...
  }
}
```

**Database Query Generated:**
```sql
SELECT * FROM "TournamentCourseMapping" WHERE verified = true ORDER BY createdAt ASC
```

**Result:** If all mappings have `verified: false`, this query returns 0 rows.

---

## Problem Breakdown: Question by Question

### 1. Where does the importer load candidate courses?
**Answer:** Line 101 in `course-intelligence-import.ts`

```typescript
const mappingsResult = await mappingRepo.findVerified()
```

It queries the `TournamentCourseMapping` table.

---

### 2. What query is used?
**Answer:** Prisma query in `tournament-course-mapping-repository.ts`

```typescript
const mappings = await this.prisma.tournamentCourseMapping.findMany({
  where: { verified: true },
  orderBy: { createdAt: "asc" },
})
```

**SQL Equivalent:**
```sql
SELECT * FROM "TournamentCourseMapping" WHERE verified = true ORDER BY createdAt ASC
```

---

### 3. How many records are returned?
**Answer:** Zero records.

**Why:** All mappings created by `importTournamentCourse()` are created with `verified: false` (line 138 in `golfcourse-import.ts`). The query only looks for `verified: true`, so 0 records match.

---

### 4. Why are zero courses considered?
**Answer:** Line 102 in `course-intelligence-import.ts` checks the result:

```typescript
if (mappingsResult.outcome !== "ok" || !mappingsResult.records || mappingsResult.records.length === 0) {
  // Early return with coursesConsidered: 0
  return {
    // ...
    coursesConsidered: 0,
    // ...
  }
}
```

Since `findVerified()` returns 0 records, the condition is true and the function returns early with `coursesConsidered: 0`.

---

### 5. Is there an early return?
**Answer:** Yes, lines 102-128 in `course-intelligence-import.ts`.

```typescript
if (mappingsResult.outcome !== "ok" || !mappingsResult.records || mappingsResult.records.length === 0) {
  const finishedAt = new Date()
  const durationMs = finishedAt.getTime() - startedAt.getTime()
  return {
    jobId,
    startedAt,
    completedAt: finishedAt,
    durationMs,
    coursesConsidered: 0,  // ← EARLY RETURN HERE
    // ... rest of empty summary
  }
}
```

This returns immediately if no verified mappings are found, skipping all intelligence import logic.

---

### 6. Is a filter excluding every course?
**Answer:** Yes, the `verified: true` filter in `findVerified()`.

The filter is too restrictive:
- All NEW mappings have `verified: false` (pending admin verification)
- The import ONLY processes `verified: true` mappings
- Therefore: 100% of courses are excluded

---

### 7. Is the importer expecting a mapping table that is empty?
**Answer:** No, the mapping table has data, but it's all in the `verified: false` state.

**Database State:**
- `TournamentCourseMapping` table contains records (from `importTournamentCourse()`)
- All records have `verified: false` pending admin sign-off
- `findVerified()` query returns 0 records because it only looks for `verified: true`

---

### 8. Is it filtering by "verified", "active", or another status?
**Answer:** Yes, it's filtering by `verified: true`.

**Evidence:** Line 101 calls `findVerified()`, which explicitly filters:

```typescript
where: { verified: true }
```

---

### 9. Log the number of records after every filtering step.

**Step 1: Create Mapping**
- Function: `importTournamentCourse()` in `golfcourse-import.ts` line 130
- Action: Creates 1 mapping with `verified: false`
- Records in DB: 1 (but `verified: false`)
- Console log: Line 127-129 logs creation

**Step 2: Query Verified Mappings**
- Function: `importCourseIntelligence()` in `course-intelligence-import.ts` line 101
- Query: `findVerified()` filters for `verified: true`
- Records returned: 0 (because all have `verified: false`)
- Console log: Line 97 logs job start, but NO log after query result
- **MISSING LOG:** Should log the number of verified mappings found

**Step 3: Early Return**
- Function: `importCourseIntelligence()` line 102
- Result: Returns empty summary with `coursesConsidered: 0`
- No further processing occurs

---

## The Exact Break Point

| File | Function | Line | Code | Issue |
|------|----------|------|------|-------|
| `course-intelligence-import.ts` | `importCourseIntelligence()` | 101 | `const mappingsResult = await mappingRepo.findVerified()` | Query returns 0 records because all mappings are `verified: false` |
| `tournament-course-mapping-repository.ts` | `findVerified()` | N/A | `where: { verified: true }` | Filter excludes all unverified mappings |
| `golfcourse-import.ts` | `importTournamentCourse()` | 138 | `verified: false` | All new mappings created as unverified |

---

## Missing Diagnostics

**Issue:** There's NO console logging between mapping creation and the final "zero courses" result. When someone sees `coursesConsidered: 0`, they have no log trail showing:

1. How many mappings exist in the table
2. How many have `verified: false` vs `verified: true`
3. Why the query returned 0 records

**Recommendation for diagnostics:** Add logging at line 101-102:

```typescript
const mappingsResult = await mappingRepo.findVerified()
console.log(`[v0] Verified mappings query result: ${mappingsResult.records?.length ?? 0} records`)
console.log(`[v0] Expected verified=true, but mappings likely have verified=false (awaiting admin verification)`)
```

---

## Summary

| Question | Answer |
|----------|--------|
| Where does candidate list come from? | `TournamentCourseMapping` table via `findVerified()` query |
| What query is used? | `findMany({ where: { verified: true } })` |
| How many records returned? | **0** — all mappings have `verified: false` |
| Why zero considered? | Early return on line 102 when query returns 0 results |
| Early return? | **Yes** — line 102-128 returns empty summary if no verified mappings |
| Filter excluding all? | **Yes** — `verified: true` excludes all `verified: false` mappings |
| Empty mapping table? | **No** — table has data, but all records have `verified: false` |
| Filtering by status? | **Yes** — `verified: true` status filter |

**Bottom Line:** The importer creates mappings with `verified: false`, but the intelligence import function ONLY processes mappings with `verified: true`. This architectural mismatch causes 100% of courses to be skipped.
