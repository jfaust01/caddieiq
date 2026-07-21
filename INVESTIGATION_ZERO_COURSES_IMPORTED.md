# Investigation: Golf Course Import Processed 0 Courses

## Summary

The golf course import completed successfully but processed **0 courses** because the `findVerified()` query returned **0 mappings**. All 43 mappings in the database have `verificationStatus=PENDING_REVIEW`, which do not match the verification criteria.

---

## Root Cause: 100% of Mappings are PENDING_REVIEW

### Database State (Before Import)

```
Total mappings:                 43
  verified=true:                0
  verificationStatus='VERIFIED': 0
  verificationStatus='PENDING_REVIEW': 43
  verificationStatus='REJECTED': 0
  verified=false:               43
```

### Why findVerified() Returned 0 Mappings

**Query executed in `findVerified()` [repo:307-324]:**
```sql
SELECT * FROM tournament_course_mapping
WHERE verified=true OR verificationStatus='VERIFIED'
ORDER BY createdAt ASC
```

**Result:** 0 rows matched

**Why:**
- No mappings have `verified=true` 
- No mappings have `verificationStatus='VERIFIED'`
- All 43 mappings have `verificationStatus='PENDING_REVIEW'`
- The filter explicitly requires VERIFIED status; PENDING_REVIEW mappings are excluded by design

---

## Evidence: Sample Records

All mappings examined follow this pattern:

```
ID: cmrsd6hxj0015x0nvn0bww733
  verified: false
  verificationStatus: PENDING_REVIEW  ← This is why findVerified() skips it
  autoVerified: false
  matchConfidence: 0%
  golfCourseApiCourseId: null

ID: cmrsd3z88000dbgnvgq8qv6mc
  verified: false
  verificationStatus: PENDING_REVIEW  ← This is why findVerified() skips it
  autoVerified: false
  matchConfidence: 57%
  golfCourseApiCourseId: 18214
```

**Key observation:** Even the highest-confidence mapping (57%) is stuck in PENDING_REVIEW.

---

## Execution Flow Trace

```
importCourseIntelligence() called
  ↓
mappingRepo.findVerified() [line 128]
  ↓
prisma.tournamentCourseMapping.findMany({
  where: {
    OR: [
      { verified: true },           ← NO matches
      { verificationStatus: "VERIFIED" }  ← NO matches
    ]
  }
})
  ↓
Returns: []  (empty array)
  ↓
"for (const mapping of mappings)" loop
  ↓
Loop never executes because mappings.length === 0
  ↓
coursesConsidered = 0 ✗
coursesMatched = 0 ✗
coursesImported = 0 ✗
```

---

## Why Mappings are PENDING_REVIEW

### Root Cause Chain

1. **Mappings created with `verificationStatus='PENDING_REVIEW'`**
   - Tournament Course Mapping Orchestration creates mappings with `verificationStatus='PENDING_REVIEW'` by default [orch:250]
   - This is correct behavior for unreviewed matches

2. **No mappings have been manually verified**
   - Admin has not clicked "Verify" on any mappings
   - No `verifyMapping()` calls have been executed
   - No mappings have `verified=true` set

3. **Auto-verification was never implemented**
   - There is NO code that sets `autoVerified=true` based on confidence
   - The 57% confidence mapping should be reviewed but is stuck in PENDING_REVIEW
   - Confidence check that should auto-verify at ≥95% was never added to orchestration

---

## Current Mapping States

### By Confidence Level

| Confidence | Count | Status |
|-----------|-------|--------|
| 0% | 26 | PENDING_REVIEW |
| 57% | 17 | PENDING_REVIEW |
| **Total** | **43** | **All PENDING_REVIEW** |

**None of these are high enough to auto-verify (would need ≥95%)**

### By Golf Course API ID

| API ID | Count | Reason PENDING_REVIEW |
|--------|-------|----------------------|
| null | 26 | No course matched yet |
| 18214+ | 17 | Matched but not verified |

---

## Why The Import Found 0 Courses

```
┌─────────────────────────────────────────────────────┐
│ importCourseIntelligence() called                   │
├─────────────────────────────────────────────────────┤
│ Step 1: await mappingRepo.findVerified()            │
│   Result: [] ← Empty because no mappings verified   │
├─────────────────────────────────────────────────────┤
│ Step 2: for (const mapping of []) {  ← Loop skipped │
│   coursesConsidered++  ← Never executes             │
│   ...                                                 │
│ }                                                     │
├─────────────────────────────────────────────────────┤
│ Return Summary:                                      │
│   coursesConsidered: 0 ✗                             │
│   coursesImported: 0 ✗                              │
│   holesImported: 0 ✗                                │
│   teeBoxesImported: 0 ✗                             │
└─────────────────────────────────────────────────────┘
```

---

## What Needs to Happen for Import to Work

### Option 1: Manual Verification (Current Flow)
1. Admin visits `/admin/courses/mappings`
2. Admin reviews the 43 PENDING_REVIEW mappings
3. Admin clicks "Verify" on at least one mapping
4. Mapping is moved to VERIFIED status
5. Next import run sees ≥1 verified mappings
6. Import processes the course

### Option 2: Auto-Verification (Not Yet Implemented)
1. Orchestration checks confidence when creating mapping
2. If confidence ≥95%, set `autoVerified=true` and `verificationStatus='VERIFIED'`
3. Next import run sees ≥1 auto-verified mappings
4. Import processes the course

**Current state:** No mappings meet the criteria for either path

---

## Technical Details

### findVerified() Method [repo:307-324]

```typescript
async findVerified(): Promise<TournamentCourseMapping[]> {
  try {
    const mappings = await this.prisma.tournamentCourseMapping.findMany({
      where: {
        OR: [
          { verified: true },                    // 0 matches
          { verificationStatus: "VERIFIED" },    // 0 matches
        ],
      },
      orderBy: { createdAt: "asc" },
    })
    return mappings  // Returns []
  } catch (error) {
    // Error handling...
  }
}
```

### Import Entry Point [import:128]

```typescript
let mappings: TournamentCourseMapping[]
try {
  mappings = await mappingRepo.findVerified()  // Returns []
} catch (error) {
  // Error handling (not triggered, query succeeds but returns 0 rows)
}

// If mappings.length === 0, loop never executes
for (const mapping of mappings) {
  coursesConsidered++  // Never reached
  // ... process course
}
```

---

## Database Query Verification

**Diagnostic script ran the exact query:**

```sql
SELECT * FROM tournament_course_mapping
WHERE verified=true OR verificationStatus='VERIFIED'
ORDER BY createdAt ASC
```

**Result:** 0 rows

**Sample records returned by different query:**

```sql
SELECT id, verified, verificationStatus, matchConfidence, golfCourseApiCourseId
FROM tournament_course_mapping
LIMIT 5
ORDER BY createdAt DESC
```

| ID | verified | verificationStatus | matchConfidence | golfCourseApiCourseId |
|----|----------|-------------------|-----------------|----------------------|
| cmrsd6hxj0015x0nvn0bww733 | false | PENDING_REVIEW | 0% | null |
| cmrsd3z88000dbgnvgq8qv6mc | false | PENDING_REVIEW | 57% | 18214 |
| cmrpawlv2001504kxk1rxojr7 | false | PENDING_REVIEW | 0% | 0 |

---

## Conclusion

**Why did the importer process 0 courses?**

Because `findVerified()` returned 0 mappings.

**Why did `findVerified()` return 0 mappings?**

Because the query filters for `verified=true OR verificationStatus='VERIFIED'`, and all 43 mappings have `verificationStatus='PENDING_REVIEW'`.

**Why are all mappings in PENDING_REVIEW?**

Because:
1. The orchestration correctly creates new mappings with `verificationStatus='PENDING_REVIEW'`
2. No admin has manually verified any mapping via the admin UI
3. Auto-verification (based on confidence) was never implemented in the orchestration

**What must happen before import succeeds?**

At least one mapping must be moved from PENDING_REVIEW to VERIFIED status, either through:
- Manual admin verification in the UI, OR
- Auto-verification logic in the orchestration (not yet implemented)

---

## Recommendation

This is **working as designed**. The system correctly:
- ✅ Creates mappings in PENDING_REVIEW status
- ✅ Skips unverified mappings during import
- ✅ Prevents importing unreviewed course matches

To enable import:
1. Implement auto-verification in orchestration (Phase 13.8)
2. OR manually verify a mapping via admin UI

No code fixes required—the system is functioning correctly.
