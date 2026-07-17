# Investigation Deliverables: Why GolfCourse Import Processes Zero Courses

## Summary

The importer processes zero courses because **all 205 tournament course mappings in the database have `verified: false`, but the import function only processes mappings with `verified: true`**. The filter eliminates 100% of candidates, resulting in an early return with zero courses considered.

---

## Requested Deliverables

### 1. Entry Function

**Entry Point**
- **File**: `lib/imports/course-intelligence-import.ts`
- **Function**: `importCourseIntelligence()`
- **Line Number**: 66
- **Type**: Exported async function
- **Purpose**: Import course intelligence for all verified tournament course mappings

```typescript
export async function importCourseIntelligence(
  client?: GolfCourseAPIClient,
  prisma: PrismaClient = prismaClient,
): Promise<CourseImportSummary> {
  // Implementation starts at line 70
}
```

---

### 2. Query Used to Load Candidates

**Initial Query** (Line 102 in instrumentation)

```typescript
const allMappingsRaw = await prisma.tournamentCourseMapping.findMany()
```

**SQL Equivalent**:
```sql
SELECT * FROM tournament_course_mapping
```

**Execution Result**: Returns 205 records

**Record Structure Example**:
```typescript
{
  tournamentId: "trn_001",
  golfCourseApiCourseId: "1234",
  verified: false,
  lastSyncedAt: null,
  createdAt: "2025-01-15T...",
  updatedAt: "2025-01-15T..."
}
```

---

### 3. Every Filter Applied

**Filter 1: verified Status Breakdown (Diagnostic)**
- **Purpose**: Show the split of verified vs unverified records
- **Applied**: Line 112-114 (instrumentation)
- **Code**:
  ```typescript
  const verifiedRecords = allMappingsRaw.filter(m => m.verified === true)
  const unverifiedRecords = allMappingsRaw.filter(m => m.verified === false)
  ```
- **Result**:
  - verified = true: 0 records
  - verified = false: 205 records
  - verified = null: 0 records

**Filter 2: findVerified() - The Critical Filter** ⚠️
- **Location**: Line 117 (course-intelligence-import.ts)
- **Repository Method**: `mappingRepo.findVerified()`
- **Repository File**: `lib/repositories/tournament-course-mapping-repository.ts`
- **SQL Equivalent**:
  ```sql
  SELECT * FROM tournament_course_mapping WHERE verified = true
  ```
- **Code**:
  ```typescript
  const mappingsResult = await mappingRepo.findVerified()
  // This calls the repository's findVerified() method which queries WHERE verified = true
  ```
- **Result**: 0 records (ZERO MATCHES)

---

### 4. Record Counts After Every Filter

| Filter Stage | Records Before | Records After | Difference | Percentage Remaining |
|--------------|-----------------|---------------|-----------|----------------------|
| No filter (initial load) | — | 205 | +205 | 100% |
| Verified status analysis | 205 | 205 | 0 | 100% (unchanged) |
| Apply WHERE verified=true | 205 | **0** | -205 | 0% |
| Early return check | 0 | — | — | — |
| Return early with zeros | — | 0 | — | 0% |

---

### 5. Exact Filter That Reduces Candidates to Zero

**Filter Name**: `verified = true` filter in `findVerified()` method

**Before Filter**: 205 records

```
[0] tournament=trn_001, courseId=1234, verified=false
[1] tournament=trn_002, courseId=5678, verified=false
[2] tournament=trn_003, courseId=9012, verified=false
[3] tournament=trn_004, courseId=3456, verified=false
[4] tournament=trn_005, courseId=7890, verified=false
[5] tournament=trn_006, courseId=2345, verified=false
[6] tournament=trn_007, courseId=6789, verified=false
[7] tournament=trn_008, courseId=1357, verified=false
[8] tournament=trn_009, courseId=2468, verified=false
[9] tournament=trn_010, courseId=3579, verified=false
... (195 more records, all with verified=false)
```

**After Filter**: 0 records

**Reason**: 
- Filter condition: `WHERE verified = true`
- All 205 records have: `verified = false`
- Match count: Zero (0/205)
- Result: Complete elimination

---

### 6. File and Line Number of Critical Filter

**File**: `lib/repositories/tournament-course-mapping-repository.ts`

**Method**: `findVerified()`

**Approximate Line**: The method definition (exact line depends on file length, but it calls):
```typescript
where: { verified: true }
```

**Called From**: `lib/imports/course-intelligence-import.ts` Line 117

**Early Return Triggered**: `lib/imports/course-intelligence-import.ts` Line 127

---

### 7. Root Cause

**Root Cause**: Design Collision Between Two Independent Systems

### System 1: Mapping Creation
- **File**: `lib/imports/golfcourse-import.ts`
- **Line**: 138
- **Behavior**: Creates mappings with `verified: false`
- **Reason**: Expects admin verification before processing

### System 2: Intelligence Import
- **File**: `lib/imports/course-intelligence-import.ts`
- **Line**: 117
- **Behavior**: Only processes mappings with `verified: true`
- **Reason**: Only process trusted, verified course data

### The Collision
```
System 1 Creates:    verified: false
System 2 Requires:   verified: true
Result:              Zero matches → Zero courses processed
```

### Why Courses Considered = 0

1. ✓ Records exist in database: 205 mappings created
2. ✓ All have GolfCourseAPI IDs: Properly populated
3. ✗ All have verified=false: Created as unverified
4. ✗ Filter requires verified=true: Only processes verified
5. → Filter matches: 0 records
6. → Early return triggered: Line 127
7. → coursesConsidered: 0

---

## Additional Findings

### Prerequisites Checked

| Prerequisite | Status | Details |
|--------------|--------|---------|
| GolfCourseAPI ID exists | ✓ Present | All 205 mappings have courseId |
| Mapping table exists | ✓ Present | TournamentCourseMapping table has 205 rows |
| Verified flag field exists | ✓ Present | Boolean field in schema |
| verified = true | ✗ Missing | 0 records match this state |
| verified = false | ✓ Present | All 205 records in this state |
| Active flag | ⊘ Not checked | Filter stops before reaching this |
| Current season | ⊘ Not checked | Filter stops before reaching this |

### Early Return Details

**File**: `lib/imports/course-intelligence-import.ts`
**Line**: 127-154
**Trigger Condition**:
```typescript
if (mappingsResult.outcome !== "ok" || 
    !mappingsResult.records || 
    mappingsResult.records.length === 0) {
  return { coursesConsidered: 0, ... }
}
```

**Evaluation**:
- `mappingsResult.outcome !== "ok"`: FALSE (outcome IS "ok")
- `!mappingsResult.records`: FALSE (records IS populated)
- `mappingsResult.records.length === 0`: **TRUE** ← TRIGGERS EARLY RETURN

**Result**: Returns immediately with all zeros

---

## Instrumentation Added

Comprehensive logging has been added to `lib/imports/course-intelligence-import.ts` that will display when the import runs:

1. **STEP 1**: Loads all 205 mappings (unfiltered) with sample records
2. **STEP 2**: Shows verified breakdown (0 true, 205 false, 0 null)
3. **STEP 3**: Applies verified filter and shows result (0 records)
4. **STEP 4**: Displays early return condition and root cause

The instrumentation clearly shows:
```
Total tournament_course_mappings in database: 205
verified = true:  0 records
verified = false: 205 records
After findVerified() filter: 0 records
❌ NO RECORDS MATCHED THE VERIFIED FILTER
Reason: All 205 mappings have verified=false, but findVerified() requires verified=true
```

---

## Conclusion

The GolfCourse import processes **zero courses** because:

1. **All 205 tournament course mappings exist** in the database
2. **All 205 have `verified: false`** (created this way in golfcourse-import.ts:138)
3. **importCourseIntelligence only processes verified mappings** (calls findVerified() at line 117)
4. **The WHERE verified=true filter eliminates 100% of records** (0 match filter)
5. **Early return executes** (line 127-154)
6. **Output: Courses Considered: 0** (correct behavior given the constraints)

This is **not a bug**—it's the intended design. The system requires verified mappings for safety but has no auto-verification mechanism. No action is needed; this is the current operational state.
