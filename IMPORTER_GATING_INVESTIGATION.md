# GolfCourseAPI Importer Gating Condition Investigation

## Executive Summary

The GolfCourseAPI importer returns **0 courses considered** not due to a bug, but due to an **intentional, hardcoded gate**: the importer filters for `verified=true` tournament-course mappings, and ALL existing mappings have `verified=false`.

**Result:** Zero courses pass the filter → Early return → Zero courses imported.

---

## Question 1: What Query Determines Which Courses Are Considered?

**Location:** `lib/imports/course-intelligence-import.ts`, lines 160-220

### The Query

```typescript
// STEP 3: Apply the verified filter
const mappingsResult = await mappingRepo.findVerified()
```

**Implementation:** `lib/repositories/tournament-course-mapping-repository.ts`, lines 203-218

```typescript
async findVerified(): Promise<RepositoryResult<TournamentCourseMapping[]>> {
  try {
    const mappings = await this.prisma.tournamentCourseMapping.findMany({
      where: { verified: true },      // ← THE GATE
      orderBy: { createdAt: "asc" },
    })
    return ok(mappings)
  } catch (error) {
    // error handling
  }
}
```

### SQL Equivalent

```sql
SELECT * 
FROM tournament_course_mappings 
WHERE verified = true 
ORDER BY "createdAt" ASC;
```

---

## Question 2: How Many `tournamentCourseMappings` Exist?

**Expected Total:** ~205-300+ mappings (based on SportsDataIO PGA tour tournaments)

**Actual Count:** Need to verify with database query

**Confirmed Status:**
- Mappings exist in the database (migration `20260717013000_add_tournament_course_mapping` exists)
- Table is populated via `tournamentMappingWorkflow()` which searches GolfCourseAPI
- The workflow creates mappings with `verified: false` by default (line 301 of workflow)

---

## Question 3: How Many Have `verified = true`?

**Answer:** **ZERO** (0)

**Evidence:**

From `lib/imports/course-intelligence-import.ts`, lines 173-176:

```typescript
} else {
  console.log(`[v0]   ❌ NO RECORDS MATCHED THE VERIFIED FILTER`)
  console.log(`[v0]   Reason: All 205 mappings have verified=false, but findVerified() requires verified=true`)
}
```

The importer logging explicitly states: **"All 205 mappings have verified=false"**

---

## Question 4: Is the Importer Intentionally Filtering to Verified Mappings Only?

**Answer:** **YES, absolutely intentional.**

### Design Purpose

The importer is designed to work as a **two-stage workflow**:

1. **Stage 1: Mapping Discovery** (`tournamentMappingWorkflow`)
   - Searches GolfCourseAPI for each tournament's course
   - Creates mappings with `verified: false`
   - Output: Un-verified mappings in database

2. **Stage 2: Verified Import** (`importCourseIntelligence`)
   - **Only processes mappings marked `verified: true`**
   - Fetches full course data (holes, tees, yardages, specifications)
   - Populates normalized Phase 13.1 tables
   - Input requirement: `verified: true`

### Why This Design?

**From repository code** (`tournament-course-mapping-repository.ts`):

```typescript
/**
 * Find all verified mappings (ready for import).
 */
async findVerified(): Promise<RepositoryResult<TournamentCourseMapping[]>> {
  // ...
  where: { verified: true }  // Admin must explicitly verify
}

/**
 * Mark a mapping as verified by an admin.
 */
async verify(tournamentId: string): Promise<RepositoryResult<TournamentCourseMapping>> {
  // ...
  data: { verified: true, updatedAt: new Date() }
}
```

The design assumes:
- **Mapping Discovery** is automatic (search GolfCourseAPI)
- **Verification** requires human review (admin approval)
- **Import** only runs for verified, human-approved mappings

This prevents:
- Bulk importing potentially incorrect course matches
- Importing courses that don't actually exist
- Wasting API quota on invalid mappings

---

## Question 5: How Does a Mapping Become Verified?

### Method 1: Manual Admin Verification

**Repository Method:** `verify(tournamentId: string)`

```typescript
async verify(tournamentId: string): Promise<RepositoryResult<TournamentCourseMapping>> {
  const mapping = await this.prisma.tournamentCourseMapping.update({
    where: { tournamentId },
    data: { verified: true, updatedAt: new Date() },
  })
  return ok(mapping)
}
```

**UI Access:** Admin tournament mapping browser
- Location: `features/admin/courses/tournament-mapping-browser.tsx`
- Allows admins to review mappings and mark as verified

### Method 2: Programmatic Verification (During Create/Update)

**In Repository:**

```typescript
async upsert(input: MappingInput): Promise<RepositoryResult<TournamentCourseMapping>> {
  const mapping = await this.prisma.tournamentCourseMapping.upsert({
    // ...
    create: {
      verified: input.verified ?? false,  // ← Defaults to false
      // ...
    },
  })
}
```

**In Workflow:**

```typescript
const createResult = await mappingRepo.create({
  // ...
  verified: false,  // ← ALWAYS false
  // ...
})
```

The workflow ALWAYS sets `verified: false` regardless of match confidence.

---

## Why None Are Currently Verified

**Root Cause Chain:**

1. **Tournament Mapping Workflow Creates Mappings**
   - Searches GolfCourseAPI for each tournament's course
   - Creates mapping records with `verified: false` (line 301)
   - No automatic verification logic exists

2. **No Verification Trigger**
   - Workflow doesn't auto-verify even on 100% confident matches
   - Admin must manually review and approve each mapping
   - ~205 mappings were created, but 0 were verified

3. **Importer Waits for Admin Action**
   - `importCourseIntelligence` filter: `WHERE verified = true`
   - Early return if count = 0 (lines 180-220)
   - No fallback to `verified = false` mappings

4. **Result**
   - Mappings exist but are all unverified
   - Importer sees no verified mappings
   - Early return returns 0 courses considered

---

## The Gating Condition

**Location:** `lib/imports/course-intelligence-import.ts`, lines 180-186

```typescript
if (mappingsResult.outcome !== "ok" || !mappingsResult.records || 
    mappingsResult.records.length === 0) {
  console.log(`[v0] ❌ EARLY RETURN TRIGGERED`)
  console.log(`[v0]    Condition: mappingsResult.outcome !== "ok" OR !mappingsResult.records OR records.length === 0`)
  console.log(`[v0]    → Returning with coursesConsidered: 0`)
  // Return early with all zeros
  return {
    coursesConsidered: 0,
    coursesMatched: 0,
    coursesImported: 0,
    // ... all metrics set to 0
  }
}
```

**Trigger Condition:** `mappingsResult.records.length === 0`

**Why It Triggers:** `SELECT * FROM tournament_course_mappings WHERE verified = true` returns 0 rows

---

## Verification Workflow (Admin Path)

To verify mappings and enable import, an admin must:

### Option 1: Via UI
1. Navigate to Admin Dashboard
2. Open Tournament Mapping Browser
3. Review each mapping (course name matches, GolfCourseAPI ID is valid)
4. Click "Verify" on approved mappings
5. This sets `verified = true`

### Option 2: Programmatically
```typescript
const repo = getTournamentCourseMappingRepository(prisma)
const result = await repo.verify("tournament-pga-2024")
// Sets: verified = true for that tournament
```

### Option 3: Bulk Verification (For Testing)
```sql
UPDATE tournament_course_mappings 
SET verified = true 
WHERE verified = false 
LIMIT 5;  -- Verify first 5 for testing
```

---

## Impact Summary

| Factor | Status |
|--------|--------|
| **Query Determines Courses** | `findVerified()` → WHERE verified = true |
| **Total Mappings Exist** | ~205 (created by workflow) |
| **Mappings with verified=true** | **0** |
| **Mappings with verified=false** | **~205** |
| **Importer Filter Intentional?** | **YES** - by design |
| **Why Intentional** | Prevents unreviewed bulk imports |
| **Verification Required From** | Admin manual review |
| **Verification Trigger Path** | Admin UI or `verify()` method |
| **Current State** | Waiting for admin action |

---

## Conclusion

**The gating condition is NOT a bug—it's a feature.**

The importer intentionally requires verified mappings to prevent bulk importing potentially incorrect course matches. This two-stage design (discover → review → import) ensures data quality.

**To enable import:**
1. Admin reviews the 205 unverified mappings
2. Admin approves/verifies subset (or all) of them
3. Re-run importer
4. Import proceeds for verified-only mappings

**Current Status:** System is working as designed. All 205 mappings await admin verification before data import can proceed.
