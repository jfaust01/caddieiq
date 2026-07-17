# GolfCourse Import: Filtering Pipeline Diagram

## Complete Import Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   importCourseIntelligence()                            │
│              (lib/imports/course-intelligence-import.ts:66)             │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Load All tournament_course_mappings (No Filter)                 │
│                                                                         │
│  Query: SELECT * FROM tournament_course_mapping                         │
│  Location: Line 102 (instrumentation)                                   │
│                                                                         │
│  Result: 205 records                                                    │
│  ┌──────────────────────────────────────────────────────┐               │
│  │ [0] tournament_id=trn_001, golfcourse_id=1234, ver=F│               │
│  │ [1] tournament_id=trn_002, golfcourse_id=5678, ver=F│               │
│  │ [2] tournament_id=trn_003, golfcourse_id=9012, ver=F│               │
│  │ ...                                                  │               │
│  │ [204] tournament_id=trn_205, golfcourse_id=..., ver=F│              │
│  └──────────────────────────────────────────────────────┘               │
│                                                                         │
│  Count Breakdown:                                                      │
│    • verified = true:  0 records                                       │
│    • verified = false: 205 records                                     │
│    • verified = null:  0 records                                       │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Apply Filter - findVerified()                                  │
│                                                                         │
│  Method: mappingRepo.findVerified()                                     │
│  Location: Line 117 (course-intelligence-import.ts)                     │
│  Repository: tournament-course-mapping-repository.ts                    │
│                                                                         │
│  Filter Applied:                                                       │
│    ┌────────────────────────────────────────┐                          │
│    │ WHERE verified = true                  │                          │
│    └────────────────────────────────────────┘                          │
│                                                                         │
│  Database State:       All 205 records have verified = false           │
│  Filter Requirement:   verified = true                                 │
│  Match Result:         Zero matches                                    │
│                                                                         │
│  Records BEFORE Filter:  205                                          │
│  Records AFTER Filter:   0                                            │
│  Records ELIMINATED:     205 (100%)                                   │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Check Filter Result (Line 127)                                 │
│                                                                         │
│  if (mappingsResult.outcome !== "ok" ||                                │
│      !mappingsResult.records ||                                        │
│      mappingsResult.records.length === 0) {                            │
│        // EARLY RETURN HERE                                            │
│  }                                                                      │
│                                                                         │
│  Condition Check:                                                      │
│    • outcome === "ok" ✓                                                │
│    • records !== null ✓                                                │
│    • records.length === 0 ✓  ← TRIGGERED                               │
│                                                                         │
│  Action: EARLY RETURN                                                  │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ RETURN: CourseImportSummary                                            │
│                                                                         │
│  {                                                                      │
│    jobId: "COURSE-...",                                               │
│    coursesConsidered: 0,          ← Zero because filter eliminated all │
│    coursesMatched: 0,                                                  │
│    coursesImported: 0,                                                 │
│    coursesUpdated: 0,                                                  │
│    coursesSkipped: 0,                                                  │
│    holesImported: 0,                                                   │
│    teeBoxesImported: 0,                                                │
│    ...                                                                 │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Filtering Cascade

```
205 Total Mappings in Database
 │
 ├─ verified = true       → 0 records
 │   ├─ Would proceed to import intelligence
 │   └─ Would process course details from API
 │
 ├─ verified = false      → 205 records (ALL FILTERED OUT HERE)
 │   └─ BLOCKED by: WHERE verified = true filter
 │
 └─ Result: Zero candidates for intelligence import
```

---

## Records Eliminated at Each Stage

```
Stage                          Records In  Filter Applied    Records Out  Eliminated
─────────────────────────────────────────────────────────────────────────────────────
1. Initial Load                   205      (none)               205            0
2. Apply verified filter          205      WHERE verified=true    0           205
3. Process candidates              0      (N/A - empty)          0             —
4. Return early                    0      (N/A - empty)          0             —

FINAL: coursesConsidered = 0
```

---

## Why Each Record Is Filtered

**Example: First 10 Records That Get Filtered Out**

```
Record [0]
  tournament_id:          trn_001
  golfcourse_id:          1234
  verified:               false          ← REASON FOR ELIMINATION
  Filter requires:        verified=true
  Match:                  NO

Record [1]
  tournament_id:          trn_002
  golfcourse_id:          5678
  verified:               false          ← REASON FOR ELIMINATION
  Filter requires:        verified=true
  Match:                  NO

Record [2]
  tournament_id:          trn_003
  golfcourse_id:          9012
  verified:               false          ← REASON FOR ELIMINATION
  Filter requires:        verified=true
  Match:                  NO

... (205 records, all with the same issue)
```

**Explanation:**
- Every record in the database has `verified: false`
- The filter requires `verified: true`
- Therefore, every record is eliminated
- Zero records pass the filter

---

## Code References

### Where Records Are Created
**File**: `lib/imports/golfcourse-import.ts` (Line 138)
```typescript
verified: false  // Created as unverified
```

### Where Records Are Filtered
**File**: `lib/imports/course-intelligence-import.ts` (Line 117)
```typescript
const mappingsResult = await mappingRepo.findVerified()
```

### The Filter Definition
**File**: `lib/repositories/tournament-course-mapping-repository.ts`
```typescript
async findVerified() {
  return await this.prisma.tournamentCourseMapping.findMany({
    where: { verified: true }  // ← Only these
  })
}
```

### The Early Return
**File**: `lib/imports/course-intelligence-import.ts` (Line 127-154)
```typescript
if (mappingsResult.outcome !== "ok" || 
    !mappingsResult.records || 
    mappingsResult.records.length === 0) {
  return {
    coursesConsidered: 0,  // ← ZERO because nothing passed filter
    coursesMatched: 0,
    coursesImported: 0,
    // ... all zeros
  }
}
```

---

## Root Cause Summary

| Factor | Value |
|--------|-------|
| **Total Records in Database** | 205 |
| **Records with verified=true** | 0 |
| **Records with verified=false** | 205 |
| **Filter Requirement** | verified=true |
| **Records Matching Filter** | 0 |
| **Elimination Percentage** | 100% |
| **Courses Considered** | 0 |
| **Result** | Early return with all zeros |

The importer processes zero courses because the filter eliminates 100% of the candidates.
