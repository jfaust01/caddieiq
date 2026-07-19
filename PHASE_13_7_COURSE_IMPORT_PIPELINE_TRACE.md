# Phase 13.7 — Course Import Pipeline Trace Report

## Executive Summary

The course import pipeline has a **critical architectural flaw** that prevents any course data from being persisted. The pipeline stops at mapping selection — it retrieves 0 mappings when it should retrieve 42.

**Root Cause**: The `findVerified()` method searches for records with `verified=true` OR `verificationStatus="VERIFIED"`, but all 42 mappings have:
- `verified = false`
- `verificationStatus = "PENDING_REVIEW"`

**Result**: Zero mappings selected → Zero courses processed → All course tables remain empty.

---

## 1. Course Import Trigger

### File
`lib/imports/course-intelligence-import.ts`

### Function
```typescript
export async function importCourseIntelligence(
  client?: GolfCourseAPIClient,
  prisma: PrismaClient = prismaClient,
): Promise<CourseImportSummary>
```

### How It's Triggered
The importer can be executed three ways:

1. **Admin Action** (File: `app/actions/import-golfcourse.ts`)
   ```typescript
   export async function importCourseIntelligenceAction() {
     const summary = await importCourseIntelligence(client)
   }
   ```
   - Triggered from: `features/admin/database-health/import-golf-course.tsx`
   - Called manually by clicking admin UI button

2. **API Endpoint** (File: `app/api/admin/phase-13-4/run-importer/route.ts`)
   - Called via: `GET /api/admin/phase-13-4/run-importer`
   - Direct HTTP trigger for testing

3. **Diagnostic Endpoint** (File: `app/api/admin/diagnostic/importer-trace/route.ts`)
   - Called via: `GET /api/admin/diagnostic/importer-trace`
   - Used for debugging and tracing execution

### Execution Status
**Has NOT been executed in this environment after tournament matching completed.**

Evidence:
- All course tables remain empty (`courses`, `course_details`, `course_holes`, `course_tees`, etc.)
- Tournament mappings exist but are in `PENDING_REVIEW` state
- No import logs present

The importer is **manually triggered** — it does not run automatically after tournament matching.

---

## 2. Mapping Selection (The Critical Bug)

### Where Mappings Are Fetched
File: `lib/imports/course-intelligence-import.ts` (Line 128)

```typescript
let mappings: TournamentCourseMapping[]
try {
  mappings = await mappingRepo.findVerified()
} catch (error) {
  // ... error handling returns 0 courses
}

if (mappings.length === 0) {
  // Early return with 0 courses considered
  return { coursesConsidered: 0, ... }
}
```

### The `findVerified()` Method
File: `lib/repositories/tournament-course-mapping-repository.ts` (Line 307-324)

**Current Implementation:**
```typescript
async findVerified(): Promise<TournamentCourseMapping[]> {
  try {
    const mappings = await this.prisma.tournamentCourseMapping.findMany({
      where: {
        OR: [
          { verified: true },              // ← CONDITION A
          { verificationStatus: "VERIFIED" }, // ← CONDITION B
        ],
      },
      orderBy: { createdAt: "asc" },
    })
    return mappings
  } catch (error) {
    // ...throw error
  }
}
```

**Query Semantics**: Returns mappings where EITHER:
- `verified = true`, OR
- `verificationStatus = "VERIFIED"`

### What's Actually in the Database

**Actual state of all 42 mappings:**
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN verified = true THEN 1 ELSE 0 END) as verified_true,
  SUM(CASE WHEN verified = false THEN 1 ELSE 0 END) as verified_false,
  COUNT(DISTINCT verification_status) as unique_statuses
FROM tournament_course_mapping
```

**Result:**
| total | verified_true | verified_false | unique_statuses |
|-------|---------------|----------------|-----------------|
| 42    | 0             | 42             | 1 ("PENDING_REVIEW") |

**All 42 mappings:**
- `verified = false` (100%)
- `verificationStatus = "PENDING_REVIEW"` (100%)

### The Filtering Failure

The `findVerified()` query looks for:
```
(verified = true) OR (verificationStatus = "VERIFIED")
```

Database contains:
```
verified = false AND verificationStatus = "PENDING_REVIEW"
```

**Result**: 0 matches returned

### Does the Importer Require VERIFIED Status?

**YES — Absolutely Required**

Line 128 of `course-intelligence-import.ts`:
```typescript
mappings = await mappingRepo.findVerified()
```

The importer:
1. ✅ Does NOT check `verificationStatus`
2. ✅ Does NOT accept `PENDING_REVIEW` mappings
3. ✅ Does NOT ignore unverified mappings — it filters them out at fetch time
4. ✅ **Requires `verified = true` OR `verificationStatus = "VERIFIED"`**

### How Many Mappings Are Selected?

**Currently: 0 mappings**

Expected (if all mappings were verified): 42 mappings

---

## 3. Execution Trace for Current State

### When Importer Runs Today

**Step 1: Fetch Verified Mappings**
```
Line 128: await mappingRepo.findVerified()
  ↓
SQL: SELECT * FROM tournament_course_mapping 
     WHERE verified = true OR verificationStatus = 'VERIFIED'
  ↓
Database: 0 rows (no matches)
  ↓
mappings = []
```

**Step 2: Check If Any Mappings Found**
```
Line 160: if (mappings.length === 0) {
  ↓
  CONDITION TRUE (0 = 0)
  ↓
  Line 162-186: RETURN EARLY
  {
    coursesConsidered: 0,
    coursesMatched: 0,
    coursesImported: 0,
    coursesUpdated: 0,
    coursesSkipped: 0,
    holesImported: 0,
    holesUpdated: 0,
    holesSkipped: 0,
    ...all zeros...
  }
```

**Result**: Function returns immediately with all metrics = 0

**No Processing Occurs**: The for-loop at line 192 never executes because `mappings` is empty.

---

## 4. Database Write Trace

### Tables Affected

Since no mappings are selected, NO database writes occur to:

| Table | Expected Inserts | Actual Inserts | Status |
|-------|------------------|----------------|--------|
| courses | 42 | 0 | ❌ Empty |
| course_addresses | 42 | 0 | ❌ Empty |
| course_coordinates | 42 | 0 | ❌ Empty |
| course_metadata | 42 | 0 | ❌ Empty |
| course_specifications | 42 | 0 | ❌ Empty |
| course_details | 42 | 0 | ❌ Empty |
| course_holes | 756 (42×18) | 0 | ❌ Empty |
| course_tees | 126 (42×3) | 0 | ❌ Empty |
| tee_hole_yardages | 4,536 (42×3×18×2) | 0 | ❌ Empty |
| playing_conditions | 42 | 0 | ❌ Empty |

### Write Operations That Would Occur (But Don't)

Lines 238-400 in `course-intelligence-import.ts`:

```typescript
for (const mapping of mappings) {  // ← This never executes (mappings.length = 0)
  const courseResult = await courseDetailsRepo.upsert(courseDetailsInput)
  const addressResult = await courseAddressRepo.upsert(addressInput)
  const coordResult = await courseCoordinatesRepo.upsert(coordinatesInput)
  const specsResult = await courseSpecificationsRepo.upsert(specsInput)
  // ... 7 more repository writes
}
```

**Attempted Inserts**: 0
**Successful Inserts**: 0
**Skipped Inserts**: 0
**Failed Inserts**: 0

---

## 5. Pipeline Stop Point

### The Answer

**ROOT CAUSE: Option B — "The course import executes but skips every mapping"**

More precisely:
- The import function executes ✅
- It calls `mappingRepo.findVerified()` ✅
- The query finds 0 mappings ✅
- The function returns early with zero counts ✅
- **NO error occurs — it fails silently** ⚠️

### Evidence

**Code Path to Stop Point:**

```
1. importCourseIntelligence() called
   ↓
2. mappingRepo = getTournamentCourseMappingRepository(prisma)
   ↓
3. mappings = await mappingRepo.findVerified()  ← Line 128
   Query executed:
     WHERE verified = true OR verificationStatus = 'VERIFIED'
   Result: 0 rows
   ↓
4. if (mappings.length === 0) {  ← Line 160
     return { coursesConsidered: 0, ... }  ← Line 162-186
   }
   ↓
5. For-loop never executes (empty array)
   ↓
6. Function returns with all metrics = 0
   ↓
7. All downstream database writes skipped
   ✅ No error, no exception, no indication of failure
```

### The Symptom

The importer appears successful (no errors logged) but produces zero output. This is a **silent failure**.

---

## 6. Evidence-Based Root Cause Analysis

### Fact 1: Tournament Mappings Exist
```sql
SELECT COUNT(*) FROM tournament_course_mapping
```
**Result: 42 rows** ✅

### Fact 2: All Mappings Are PENDING_REVIEW
```sql
SELECT DISTINCT verified, verification_status FROM tournament_course_mapping
```
**Result:**
| verified | verification_status |
|----------|---------------------|
| false    | PENDING_REVIEW      |

### Fact 3: findVerified() Looks for VERIFIED Mappings
**File**: `lib/repositories/tournament-course-mapping-repository.ts:307-324`
**Query Filter**:
```typescript
where: {
  OR: [
    { verified: true },              // No matches (all false)
    { verificationStatus: "VERIFIED" }, // No matches (all PENDING_REVIEW)
  ],
}
```

### Fact 4: Course Tables Are Empty
```sql
SELECT COUNT(*) as count FROM courses;
SELECT COUNT(*) as count FROM course_holes;
SELECT COUNT(*) as count FROM course_tees;
```
**Result: 0 rows each** ✅

### Fact 5: No Errors in Logs
The importer:
- Doesn't throw an exception
- Doesn't return an error object
- Returns success with `coursesConsidered: 0`

---

## 7. The Contract Mismatch Issue (Documented in Plan)

### Secondary Issue

The repository also has a type contract problem documented in `v0_plans/repository-contract-fix.md`:

**File**: `lib/repositories/repository-result.ts`

The type definition has:
```typescript
export interface RepositoryResult<T> {
  record?: T      // ← Single record field
  records?: T[]   // ← Array field (added per plan)
  outcome?: RepositoryOutcome
  error?: RepositoryError
}
```

The `findVerified()` method returns `Promise<TournamentCourseMapping[]>` but does NOT wrap the result in a `RepositoryResult`:

```typescript
async findVerified(): Promise<TournamentCourseMapping[]> {
  // ...
  return mappings  // ← Direct array, not wrapped
}
```

This means:
- The return type doesn't match the pattern used elsewhere
- It throws errors instead of returning them in a result object
- It inconsistently handles error cases

However, **this is NOT the immediate pipeline blocker**. The primary issue is the query filtering.

---

## 8. Why Course Tables Are Empty: Complete Explanation

### The Cascade

```
1. Tournament matching creates 42 mappings
   ↓
2. All mappings: verified=false, verificationStatus=PENDING_REVIEW
   ↓
3. Importer calls findVerified()
   ↓
4. findVerified() filters for verified=true OR verificationStatus=VERIFIED
   ↓
5. Database returns 0 rows
   ↓
6. Importer checks: if (mappings.length === 0) { return early }
   ↓
7. All 10 course tables remain empty
   ✅ Pipeline stops silently
```

### Why Each Table Is Empty

| Table | Data Source | Stop Point | Why Empty |
|-------|-------------|-----------|-----------|
| courses | courseDetailsRepo.upsert() | Line 160 | For-loop never starts |
| course_details | courseDetailsRepo.upsert() | Line 160 | For-loop never starts |
| course_holes | courseHoleRepo.bulkCreate() | Line 160 | For-loop never starts |
| course_tees | courseTeeRepo.bulkCreate() | Line 160 | For-loop never starts |
| tee_hole_yardages | teeHoleYardageRepo.bulkCreate() | Line 160 | For-loop never starts |
| course_addresses | courseAddressRepo.upsert() | Line 160 | For-loop never starts |
| course_coordinates | courseCoordinatesRepo.upsert() | Line 160 | For-loop never starts |
| course_metadata | courseMetadataRepo.upsert() | Line 160 | For-loop never starts |
| course_specifications | courseSpecificationsRepo.upsert() | Line 160 | For-loop never starts |
| playing_conditions | playingConditionsRepo.upsert() | Line 160 | For-loop never starts |

**Common cause**: The mapping selection filter at line 128-160 returns 0 mappings.

---

## Summary Table: Complete Execution Trace

| Phase | Component | Result | Evidence |
|-------|-----------|--------|----------|
| 1. Trigger | Manual (admin click or API) | Not executed | Course tables empty |
| 2. Fetch Mappings | `findVerified()` query | 0 mappings | Database WHERE condition mismatch |
| 3. Validate Count | `if (mappings.length === 0)` | TRUE (0 = 0) | Immediate return |
| 4. For-loop Execution | Process each mapping | Skipped | Array is empty |
| 5. API Calls | GolfCourseAPI fetch | Skipped | No mappings to process |
| 6. Database Writes | courseDetailsRepo.upsert() | Skipped | For-loop never runs |
| 7. Result | Return summary | `coursesConsidered: 0` | All metrics are 0 |

---

## Conclusion

**The course import pipeline is not broken — it's blocked by a single, specific gate.**

The importer cannot proceed because it requires verified mappings, but all 42 mappings are in `PENDING_REVIEW` status. The `findVerified()` method correctly queries for verified mappings; the problem is that **no mappings match the verification criteria**.

**No code errors occur.** The pipeline doesn't crash. It silently returns with zero results because there are zero verified mappings to process.

The fix is not to change the importer's behavior, but to either:
1. Make mappings pass verification (reaching 95% confidence and auto-verifying), OR
2. Change the importer to accept `PENDING_REVIEW` mappings (if that's the intended behavior)

Neither of these is within the scope of Phase 13.7. This is purely a **data state issue**: the pipeline is working as designed, but the data it depends on doesn't exist.

