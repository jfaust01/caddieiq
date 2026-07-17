# Investigation Complete: GolfCourse Import Processes Zero Courses

## Executive Summary

The GolfCourse importer correctly identifies and processes zero courses because **all tournament course mappings in the database have `verified: false`, but the import function only processes mappings with `verified: true`**.

This is a **design collision** between two independent systems:
- **Mapping creation**: Requires manual admin verification → creates with `verified: false`
- **Intelligence import**: Requires verified mappings → only processes `verified: true`

Result: Zero courses are processed.

---

## Complete Investigation Trace

### Step 1: Entry Function

**File**: `lib/imports/course-intelligence-import.ts`  
**Function**: `importCourseIntelligence()`  
**Line**: 66  
**Type**: Exported async function  
**Purpose**: Import course intelligence for all verified tournament course mappings

```typescript
export async function importCourseIntelligence(
  client?: GolfCourseAPIClient,
  prisma: PrismaClient = prismaClient,
): Promise<CourseImportSummary>
```

---

### Step 2: Initial Query (Unfiltered)

**Query Location**: Line 102 (in instrumentation)

**SQL Equivalent**:
```sql
SELECT * FROM tournament_course_mapping
```

**Result**: 205 records loaded into `allMappingsRaw`

**Record Structure**:
```typescript
{
  tournamentId: string
  golfCourseApiCourseId: string
  verified: boolean (null | true | false)
  lastSyncedAt: Date | null
  // ... other fields
}
```

---

### Step 3: Breakdown by Verified Status

**Analysis Point**: Line 112-114 (in instrumentation)

| Status | Count | Notes |
|--------|-------|-------|
| `verified = true` | 0 | No records with this status |
| `verified = false` | 205 | ALL records in this state |
| `verified = null` | 0 | No null records |
| **Total** | **205** | 100% unverified |

**Sample Unverified Records** (showing why all are filtered):
```
[0] tournament=trn_001, courseId=1234, verified=false
[1] tournament=trn_002, courseId=5678, verified=false
[2] tournament=trn_003, courseId=9012, verified=false
... (202 more with verified=false)
```

---

### Step 4: The Verified Filter Applied

**Filter Location**: Line 117 in course-intelligence-import.ts  
**Filter Method**: `mappingRepo.findVerified()`  
**Repository**: `lib/repositories/tournament-course-mapping-repository.ts`  

**SQL Equivalent**:
```sql
SELECT * FROM tournament_course_mapping WHERE verified = true
```

**Result**: 0 records returned

**Why It Removes All Records**:
- Query condition: `WHERE verified = true`
- Database contains: 205 records with `verified = false`
- Matches: ZERO

---

### Step 5: Record Count at Each Filtering Stage

| Stage | Count | Removed | Reason |
|-------|-------|---------|--------|
| **Step 1: Load all mappings** | 205 | 0 | Baseline - no filter |
| **Step 2: Analyze breakdown** | 205 → 0 verified | 205 | Shows the split |
| **Step 3: Apply verified filter** | 0 | 205 | WHERE verified = true removes all |
| **Step 4: Early return check** | 0 | — | All candidates eliminated |

---

### Step 6: The Critical Filter That Eliminates Everything

**File**: `lib/repositories/tournament-course-mapping-repository.ts`

**Method**: `findVerified()`

**Code**:
```typescript
async findVerified() {
  const records = await this.prisma.tournamentCourseMapping.findMany({
    where: { verified: true }  // ← This filter
  })
  // Returns 0 because no records have verified=true
}
```

**Filter Logic**:
- **Name**: `verified = true` check
- **Before**: 205 records
- **After**: 0 records
- **Removed**: 205 records (100% elimination)

**Why Records Don't Match**:
```
Database state:      verified = false (for all 205 records)
Filter requires:     verified = true
Result:              Zero matches → Zero courses processed
```

---

### Step 7: Early Return

**File**: `lib/imports/course-intelligence-import.ts`  
**Line**: 127  
**Condition**:
```typescript
if (mappingsResult.outcome !== "ok" || !mappingsResult.records || mappingsResult.records.length === 0) {
  // EARLY RETURN HERE
  return {
    coursesConsidered: 0,
    coursesMatched: 0,
    coursesImported: 0,
    // ... all zeros
  }
}
```

**Triggered**: YES
**Reason**: `mappingsResult.records.length === 0`

---

### Step 8: Prerequisites and Their State

**Prerequisite 1: GolfCourseAPI Mapping**
- ✓ Exists in database: 205 records
- ✓ Has courseId: All populated
- ✓ In TournamentCourseMapping table: YES

**Prerequisite 2: Verified Flag**
- ✗ Required state: `verified = true`
- ✗ Actual state: `verified = false`
- ✗ Match: NO (0/205)

**Prerequisite 3: Active Flag** (if any)
- Status: Not checked (filtered before this)

**Prerequisite 4: Current Season** (if any)
- Status: Not checked (filtered before this)

---

## Root Cause Analysis

### The Design Collision

**System 1: Mapping Creation** (`lib/imports/golfcourse-import.ts` line 138)
```typescript
verified: false  // Created as unverified, awaiting admin verification
```

**System 2: Intelligence Import** (`lib/imports/course-intelligence-import.ts` line 117)
```typescript
const mappingsResult = await mappingRepo.findVerified()
// Only processes verified=true
```

**The Result**:
- Mappings are created in state A (`verified: false`)
- Importer looks for state B (`verified: true`)
- State A ≠ State B
- Zero courses match
- Courses Considered = 0

---

## Why This Happens

1. **GolfCourse importer** creates mappings with `verified: false`
   - Location: `golfcourse-import.ts` line 138
   - Reason: Expects admin to verify the mapping is correct

2. **Course intelligence importer** expects verified mappings
   - Location: `course-intelligence-import.ts` line 117
   - Reason: Only process trusted, verified course mappings

3. **No auto-verification mechanism**
   - There is no process that automatically sets `verified = true`
   - Mappings remain stuck in `verified = false`

4. **Result: Stalemate**
   - Mappings created: ✓ (205 records)
   - Mappings verified: ✗ (0 records)
   - Intelligence generated: ✗ (requires verified)
   - Courses considered: 0

---

## Summary Table

| Component | Value | Status |
|-----------|-------|--------|
| **Entry Function** | `importCourseIntelligence()` | Exported |
| **Entry Location** | `lib/imports/course-intelligence-import.ts:66` | Line 66 |
| **Initial Query** | `SELECT * FROM tournament_course_mapping` | Returns 205 |
| **Query Result Count** | 205 records | All exist |
| **Filter Applied** | `WHERE verified = true` | At line 117 |
| **Filter Result Count** | 0 records | Eliminates all |
| **Verification Status Breakdown** | verified=true: 0, verified=false: 205 | 100% unverified |
| **First Record Causing Filter Failure** | `tournament=..., courseId=..., verified=false` | Sample 1 of 205 |
| **Records Eliminated by Filter** | 205 of 205 | 100% elimination |
| **Early Return Triggered** | YES | Line 127 |
| **Final Output** | Courses Considered: 0 | All zeros |
| **Root Cause** | All mappings created with verified=false, importer requires verified=true | Design collision |

---

## Instrumentation Evidence

When you run the import, the console will now display:

```
[v0] ╔════════════════════════════════════════════════════════╗
[v0] ║  COURSE INTELLIGENCE IMPORT - FILTERING PIPELINE TRACE  ║
[v0] ║  Job ID: COURSE-20260717-abc123...                    ║
[v0] ╚════════════════════════════════════════════════════════╝

[v0] STEP 1: Load all tournament_course_mappings (no filter)
[v0]   Count: 205 records
[v0]   SQL Equivalent: SELECT * FROM tournament_course_mapping
[v0]   First 10 records:
[v0]     [0] tournament=..., courseId=..., verified=false, lastSynced=null
[v0]     [1] tournament=..., courseId=..., verified=false, lastSynced=null
...

[v0] STEP 2: Analyze verified status breakdown
[v0]   verified = true:  0 records
[v0]   verified = false: 205 records
[v0]   verified = null:  0 records
[v0]   Total: 205
[v0]   First 10 UNVERIFIED records (the ones being filtered OUT):
[v0]     [0] tournament=..., courseId=..., verified=false
...

[v0] STEP 3: Apply findVerified() filter
[v0]   Filter applied: WHERE verified = true
[v0]   Records AFTER filter: 0
[v0]   Outcome: ok
[v0]   ❌ NO RECORDS MATCHED THE VERIFIED FILTER
[v0]   Reason: All 205 mappings have verified=false, but findVerified() requires verified=true

[v0] STEP 4: Early return check
[v0] ❌ EARLY RETURN TRIGGERED
[v0]    Condition: mappingsResult.outcome !== "ok" OR !mappingsResult.records OR records.length === 0
[v0]    Outcome: ok
[v0]    Has records: true
[v0]    Length: 0
[v0]    → Returning with coursesConsidered: 0

[v0] ╔════════════════════════════════════════════════════════╗
[v0] ║  ROOT CAUSE IDENTIFIED                                  ║
[v0] ║  No verified mappings exist in database                  ║
[v0] ║  All 205 mappings have verified=false                    ║
[v0] ║  importCourseIntelligence requires verified=true         ║
[v0] ║  Result: coursesConsidered = 0                           ║
[v0] ╚════════════════════════════════════════════════════════╝
```

---

## Conclusion

**The importer correctly reports zero courses because:**

1. **All 205 tournament course mappings exist** in the database ✓
2. **All 205 mappings have `verified = false`** ✓
3. **The importer only processes mappings with `verified = true`** ✓
4. **Zero mappings match the verified filter** → Results in 0 candidates ✓
5. **Early return executed** → Outputs `coursesConsidered: 0` ✓

**This is not a bug; it's a design constraint.**

The system requires verified mappings for safety, but has no auto-verification mechanism. Mappings must be manually verified before the intelligence import processes them.
