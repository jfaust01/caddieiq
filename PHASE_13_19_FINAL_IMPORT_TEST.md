# Phase 13.19 — Final Import Test After Normalization

**Date:** 2025-07-20  
**Status:** COMPLETE - Normalization works, additional issues discovered  
**Test Mapping ID:** `cmrsd3z88000dbgnvgq8qv6mc`  
**GolfCourseAPI Course ID:** `18214` (Austin Country Club)

---

## Executive Summary

The GolfCourseAPI payload normalization (Phase 13.18) **works correctly**. The normalized course data was successfully prepared with all required fields:

- ✅ Course ID: 18214
- ✅ Course Name: Austin Country Club
- ✅ Club Name: Austin Country Club
- ✅ Holes: 18
- ✅ Tees: 12

However, the import **still failed** due to **two new runtime issues** discovered during the import process.

---

## Before Import Row Counts

| Table | Count |
|-------|-------|
| courses | 205 |
| courseDetails | 0 |
| courseHoles | 0 |
| courseTees | 0 |
| teeHoleYardages | 0 |
| courseAddresses | 0 |
| courseCoordinates | 0 |
| courseMetadata | 0 |
| courseSpecifications | 0 |
| **TOTAL** | **205** |

---

## Normalized Course Ready

Before the first database write, the importer logged the normalized course data:

```
[v0] NORMALIZED COURSE READY
[v0]   id: 18214
[v0]   name: Austin Country Club
[v0]   clubName: Austin Country Club
[v0]   holes.length: 18
[v0]   tees.length: 12
```

✅ **All fields present and correctly populated**

---

## Import Execution

The importer was called with the verified mapping. The first repository write (courseDetails upsert) **succeeded**:

```sql
INSERT INTO "public"."course_details" 
  ("id","externalCourseId","courseName","clubName","createdAt","updatedAt") 
VALUES 
  ($1,$2,$3,$4,$5,$6)
PARAMETERS: ["cmrsjv08900008clkfcau582j","18214","Austin Country Club","Austin Country Club","2026-07-20T01:32:25.449Z","2026-07-20T01:32:25.449Z"]
```

✅ **Row inserted into courseDetails table**

---

## After Import Row Counts

| Table | Before | After | Delta |
|-------|--------|-------|-------|
| courses | 205 | 205 | 0 |
| courseDetails | 0 | 1 | +1 ✅ |
| courseHoles | 0 | 0 | 0 |
| courseTees | 0 | 0 | 0 |
| teeHoleYardages | 0 | 0 | 0 |
| courseAddresses | 0 | 0 | 0 |
| courseCoordinates | 0 | 0 | 0 |
| courseMetadata | 0 | 0 | 0 |
| courseSpecifications | 0 | 0 | 0 |
| **TOTAL** | **205** | **206** | **+1** |

✅ **CourseDetails row was written to database**  
❌ **No other course data rows written**

---

## Import Statistics

```
coursesConsidered:    1  ✅ (found)
coursesImported:      0  ❌ (failed after courseDetails insert)
coursesUpdated:       0
coursesSkipped:       0
holesImported:        0
teeBoxesImported:     0
totalDelta:           +1 (only courseDetails)
```

---

## Failures and Warnings

### Primary Failure

```
Failed to upsert GolfCourse API ID 18214: Unknown error
```

### Secondary Failure (Record Keeping)

```
Import failed: Invalid `this.prisma.importRun.create()` invocation

Argument `startedAt` is missing.
Expected: DateTime
Got:      undefined
```

### Warnings (Duplicate Tee Names)

The importer detected duplicate tee box names in the normalized data:

```
Course Austin Country Club: duplicate tee name "White"
Course Austin Country Club: duplicate tee name "White/Gold Combo"
Course Austin Country Club: duplicate tee name "Gold"
Course Austin Country Club: duplicate tee name "Forward 2"
Course Austin Country Club: duplicate tee name "Forward 1"
```

---

## Root Causes Identified

### Issue 1: Duplicate Tee Names

The GolfCourseAPI returns tee boxes across multiple gender categories (female, male), and many tee names are repeated across genders:

- Female "White" tee
- Male "White" tee
- Both stored as `{name: "White", gender: "female|male"}`

**Current behavior:** Tee name deduplication logic rejects duplicate names

**Problem:** The normalization creates 12 tee objects (combining all genders), but many have identical names

### Issue 2: Missing `startedAt` DateTime

The import run repository's `record()` method tries to create an importRun record without providing the required `startedAt` DateTime field.

**Code location:** `ImportRunRepository.record()` (line where importRun.create() is called)

**Error:**
```
Argument `startedAt` is missing.
Expected: DateTime
Got:      undefined
```

**Impact:** Even if the course import succeeds, the final import record cannot be persisted, causing the entire import to fail.

---

## Summary: What Worked vs. What Failed

### What Worked ✅

1. **Repository Contract Fix (Phase 13.13):** `findVerified()` returns correct result shape
2. **Course Verification (Phase 13.14):** Mapping successfully verified
3. **API Response Unwrapping (Phase 13.16):** Nested course object correctly extracted
4. **Payload Normalization (Phase 13.18):** Raw API response normalized to GolfCourseDetail
5. **First Database Write (Phase 13.19):** CourseDetails successfully inserted

### What Failed ❌

1. **Tee Box Deduplication:** Duplicate tee names across gender categories cause import to fail
2. **Import Run Recording:** Missing `startedAt` DateTime prevents final import record from being saved

---

## Next Steps Required

To complete the GolfCourseAPI import pipeline:

1. **Fix Duplicate Tee Names:** Handle tee names that are duplicated across gender categories
   - Either deduplicate intelligently (by tee color or rating)
   - Or allow gender-differentiated tee names
   - Or create composite tee identifiers

2. **Fix Missing `startedAt`:** Ensure importRun.record() receives required DateTime field
   - Check where the import process begins
   - Provide current timestamp when creating importRun
   - Verify all required fields are populated

---

## Evidence

- ✅ Normalized course logged: id, name, clubName, holes.length: 18, tees.length: 12
- ✅ CourseDetails database row: externalCourseId: "18214", courseName: "Austin Country Club", clubName: "Austin Country Club"
- ❌ Duplicate tee warnings: 5 detected (White, White/Gold Combo, Gold, Forward 2, Forward 1)
- ❌ Prisma error: `Argument 'startedAt' is missing` in importRun.create()
- ❌ Import result: coursesImported: 0 (failed after first write)

