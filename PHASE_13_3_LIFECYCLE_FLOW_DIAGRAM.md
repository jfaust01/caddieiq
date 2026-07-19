# Phase 13.3 — Tournament Course Mapping Lifecycle Flow Diagram

## Complete Flow: Tournament → Import

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TOURNAMENT DATA INGESTION                             │
│  Input: Tournament from SportsData.io, PGA Tour, etc.                       │
└────────────────────────────┬──────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: MATCHING ORCHESTRATION                                             │
│  File: tournament-course-mapping-orchestration.ts                           │
│  Purpose: Find GolfCourseAPI match for tournament course                    │
│                                                                              │
│  Input:  Tournament { id, name, courseId, ... }                            │
│  Output: TournamentCourseMapping {                                          │
│            tournamentId                                                      │
│            sportsDataIoCourseId                                             │
│            golfCourseApiCourseId    ← KEY: Must be > 0 or null             │
│            matchConfidence          ← KEY: Must be > 0 or null             │
│            verified: false          ← KEY: Must validate before true        │
│            verificationStatus: PENDING_REVIEW                               │
│          }                                                                   │
│                                                                              │
│  ✓ Creates mapping with golfCourseApiCourseId = null (not 0)              │
│  ✓ Sets matchConfidence = 0 for unmatched courses                          │
│  ✓ Sets verified = false (waiting for verification)                        │
│  ✓ Sets verificationStatus = PENDING_REVIEW                                │
└────────────────────────────┬──────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: VERIFICATION STATUS CHECK                                          │
│  Files: Low-confidence admin endpoint, review endpoints                      │
│  Purpose: Admin reviews unmatched/low-confidence mappings                   │
│                                                                              │
│  BRANCH A: Valid Match Found                                                │
│  ├─ Admin confirms match (e.g., click "Verify")                            │
│  ├─ golfCourseApiCourseId set to valid ID (> 0)  ✓                        │
│  ├─ matchConfidence updated to valid value (> 0) ✓                        │
│  ├─ Repository VALIDATES before update                                     │
│  └─ verificationStatus → VERIFIED, verified → true                         │
│                                                                              │
│  BRANCH B: No Match / Cannot Verify                                         │
│  ├─ Admin rejects mapping                                                   │
│  ├─ verificationStatus → REJECTED                                           │
│  └─ verified → false (stays unverified)                                     │
│                                                                              │
│  BRANCH C: Still Unresolved                                                 │
│  ├─ No admin action                                                         │
│  ├─ verificationStatus → PENDING_REVIEW                                     │
│  └─ verified → false (stays unverified)                                     │
│                                                                              │
│  ✗ INVALID PATH (NOW BLOCKED):                                             │
│  └─ golfCourseApiCourseId = null/0 AND verified = true ← PREVENTED          │
└────────────────────────────┬──────────────────────────────────────────────────┘
                             │
                             ├─────────────────────────┬──────────────────────┐
                             │                         │                      │
                    ✓ VERIFIED                  ✗ REJECTED          ⏳ PENDING
                             │                         │                      │
                             ▼                         ▼                      │
        ┌──────────────────────────────┐   ┌─────────────────┐               │
        │ STEP 3: IMPORTER ELIGIBILITY │   │  ARCHIVED DATA  │               │
        │                              │   │  (Not imported) │               │
        │ Validation Checks:           │   └─────────────────┘               │
        │                              │                                      │
        │ ✓ golfCourseApiId > 0?       │   Stay in                          │
        │ ✓ matchConfidence > 0?       │   PENDING_REVIEW                   │
        │ ✓ verified = true?           │   (May be reviewed later)          │
        │                              │                                      │
        │ ✓ PASSED → Ready for Import  │                                     │
        │ ✗ FAILED → SKIP with logging │                                     │
        └──────────────┬───────────────┘                                      │
                       │                                                       │
                       ▼                                                       │
        ┌──────────────────────────────┐                                      │
        │ STEP 4: COURSE INTELLIGENCE  │                                      │
        │ IMPORT                       │                                      │
        │                              │                                      │
        │ For each VERIFIED mapping:   │                                      │
        │                              │                                      │
        │ 1. Fetch from GolfCourseAPI  │                                      │
        │    using golfCourseApiId     │                                      │
        │                              │                                      │
        │ 2. Import course metadata    │                                      │
        │ 3. Import holes (18 holes)   │                                      │
        │ 4. Import tee boxes (par)    │                                      │
        │ 5. Import yardages           │                                      │
        │ 6. Generate intelligence     │                                      │
        │    (par ratings, handicaps)  │                                      │
        │                              │                                      │
        │ Output:                      │                                      │
        │  ✓ Courses table populated   │                                      │
        │  ✓ Holes table populated     │                                      │
        │  ✓ TeeBoxes table populated  │                                      │
        │  ✓ Course intelligence ready │                                      │
        │    for analytics             │                                      │
        └──────────────────────────────┘                                      │
```

## State Machine: Verification Status Transitions

```
┌──────────────┐
│   CREATED    │ ← Mapping created by orchestration
└────┬─────────┘
     │
     ▼
┌──────────────────────────────┐
│   PENDING_REVIEW             │ ← golfCourseApiCourseId: null/0
│   (verified: false)          │   matchConfidence: 0
│                              │
│   State Invariants:          │
│   ✓ golfCourseApiId may be null/0     (unmatched)
│   ✓ matchConfidence may be 0           (no match)
│   ✓ verified must be false             (awaiting review)
└────┬───────────────────┬────────────────────────────────────┐
     │                   │                                    │
 Admin Action       Still Waiting                         Admin Action
     │                   │                                    │
     ▼                   │                                    ▼
┌─────────────────┐      │                              ┌──────────────┐
│   VERIFIED      │      │                              │   REJECTED   │
│   (verified: true)     │                              │   (verified: false)
│                 │      │                              │              │
│   Invariants:   │      │   Invariants:                │   Invariants:
│   ✓ golfCourse │      │   ✓ golfCourseApiId remains  │   ✓ Any state OK
│     ApiId > 0  │      │     null/0 (no update)      │   ✓ Will not import
│   ✓ matchConf> │      │   ✓ verified stays false     │   ✓ Marked rejected
│     0          │      │                              │              │
│   ✓ verified =  │      │                              │              │
│     true       │      │                              │              │
│   READY FOR    │      │                              │   ARCHIVED   │
│   IMPORT ✓     │      │                              │   (no import)
└─────────────────┘      │                              └──────────────┘
                         │
                         └─→ (cycles through PENDING_REVIEW indefinitely)
```

## Critical Validation Points

### Point 1: Repository Create Method
```
IF verified = true THEN
  VALIDATE golfCourseApiCourseId > 0
  VALIDATE matchConfidence > 0
  IF NOT valid THEN REJECT with error
END
```
**File**: `tournament-course-mapping-repository.ts` line 121-130
**Status**: ✅ IMPLEMENTED

### Point 2: Repository Update Method
```
IF updating verified to true THEN
  FETCH current mapping
  MERGE current + input values
  VALIDATE golfCourseApiCourseId > 0
  VALIDATE matchConfidence > 0
  IF NOT valid THEN REJECT with error
END
```
**File**: `tournament-course-mapping-repository.ts` line 158-185
**Status**: ✅ IMPLEMENTED

### Point 3: Bulk Verify Method
```
FOR EACH mapping in bulk request:
  IF golfCourseApiCourseId <= 0 THEN REJECT
  IF matchConfidence <= 0 THEN REJECT
IF ANY mapping invalid THEN:
  REJECT entire bulk operation (all-or-nothing)
  RETURN error identifying problematic mapping
END
```
**File**: `tournament-course-mapping-repository.ts` line 567-588
**Status**: ✅ IMPLEMENTED

### Point 4: Course Intelligence Importer
```
FOR EACH verified mapping:
  IF golfCourseApiCourseId is null/0/invalid THEN:
    LOG "SKIPPED: invalid golfCourseApiCourseId"
    DECREMENT coursesMatched
    CONTINUE (don't call API)
  ELSE:
    FETCH from API using golfCourseApiCourseId
    IMPORT course data
END
```
**File**: `course-intelligence-import.ts` line 204-212
**Status**: ✅ IMPLEMENTED

## Why Invalid Mappings Reached Import (Root Cause)

### Before Validation
```
1. Orchestration created mapping:
   ├─ golfCourseApiCourseId: null (correct)
   ├─ matchConfidence: 0 (correct)
   └─ verified: false (correct)

2. Admin called bulkVerify() WITHOUT VALIDATION:
   └─ Just set verified: true
   └─ No checks for ID or confidence
   └─ Result: INVALID STATE ✗

3. Importer processed:
   └─ Tried to fetch course with ID=null
   └─ Got 429 errors
   └─ All 41 failed
```

### After Validation
```
1. Same as before (orchestration correct)

2. Admin calls bulkVerify() WITH VALIDATION:
   ├─ FETCHES all mappings
   ├─ FOR EACH mapping VALIDATES:
   │  ├─ golfCourseApiCourseId > 0? ✓
   │  ├─ matchConfidence > 0? ✓
   │  └─ IF ANY FAILS: REJECT with error
   └─ PREVENTS invalid mappings from being verified

3. Importer processes only valid mappings:
   └─ Skips unmapped/low-confidence records
   └─ Only fetches real GolfCourse API IDs
```

## Data Flow Example: One Tournament

```
INPUT: Tournament "2024 PGA Championship"

STEP 1 - ORCHESTRATION CREATES:
{
  tournamentId: "cmrlmab2p000u4zpa3sxm80tf"
  sportsDataIoCourseId: "sr:course:1234"
  golfCourseApiCourseId: null              ← No match found (this is OK)
  matchConfidence: 0                       ← No match confidence (this is OK)
  verified: false                          ← Awaiting review (this is OK)
  verificationStatus: "PENDING_REVIEW"     ← State correctly set
}

STEP 2a - ADMIN FINDS MATCH:
{
  golfCourseApiCourseId: 58761             ← Now has real ID ✓
  matchConfidence: 95                      ← High confidence ✓
  verified: true                           ← VALIDATION ALLOWS THIS ✓
  verificationStatus: "VERIFIED"
}
→ VALIDATION PASSES (ID > 0, confidence > 0, verified=true)

STEP 3 - IMPORTER PROCESSES:
IF golfCourseApiCourseId (58761) is valid:
  FETCH https://api.golfcourseapi.com/course/58761
  IMPORT: Oak Hill Country Club
  IMPORT: 18 holes with yardages
  IMPORT: Par 70 with handicap indices
  ✓ SUCCESS: Course intelligence imported

STEP 2b - ADMIN REJECTS (ALTERNATIVE):
{
  verified: false                          ← Stays unverified
  verificationStatus: "REJECTED"           ← Explicitly rejected
}
→ IMPORTER SKIPS (not verified, not eligible)

STEP 2c - NO ADMIN ACTION (ALTERNATIVE):
{
  verified: false                          ← Stays unverified
  verificationStatus: "PENDING_REVIEW"     ← Still waiting
}
→ IMPORTER SKIPS (not verified, not eligible)
```

## Invalid State Prevention Summary

| Scenario | Before Validation | After Validation |
|----------|-------------------|------------------|
| Create verified with ID=null | ✗ ALLOWED | ✅ BLOCKED |
| Create verified with ID=0 | ✗ ALLOWED | ✅ BLOCKED |
| Create verified with confidence=0 | ✗ ALLOWED | ✅ BLOCKED |
| Update to verified with ID=null | ✗ ALLOWED | ✅ BLOCKED |
| bulkVerify with any invalid mapping | ✗ ALLOWED | ✅ BLOCKED (ALL-OR-NOTHING) |
| Importer processes ID=null | ✗ CALLED API (429 error) | ✅ SKIPPED (logged) |
| Importer processes ID=0 | ✗ CALLED API (429 error) | ✅ SKIPPED (logged) |

---

## Summary

The lifecycle flow ensures that:
1. **Valid** mappings with real GolfCourse API IDs proceed to import
2. **Invalid** mappings stay in PENDING_REVIEW or are REJECTED
3. **Never** can an invalid mapping be marked VERIFIED
4. **Importer** only processes VERIFIED mappings with valid IDs
5. **All paths** have validation to prevent invalid states
