# Phase 13.20 — "Unknown error" Root Cause Identified

**Date:** 2025-07-20  
**Status:** ROOT CAUSE FOUND - Not a Prisma/Repository error  
**Issue:** "Unknown error" message hides a logic bug in the importer

---

## The "Unknown error" Message

The importer reports:
```
Failed to upsert GolfCourse API ID 18214: Unknown error
```

This message comes from `/vercel/share/v0-project/lib/imports/course-intelligence-import.ts` at line 506.

---

## Origin of "Unknown error"

**File:** `/vercel/share/v0-project/lib/imports/course-intelligence-import.ts`  
**Function:** `importCourseIntelligence()`  
**Lines:** 248, 474-507

### The Code Path

```typescript
// Line 247
const courseResult = await courseDetailsRepo.upsert(courseDetailsInput)

// Line 248 - THE BUG IS HERE
if (courseResult.outcome === "ok") {
  // Handle success
  // ...
} else {
  // Line 474-507
  // This is where "Unknown error" is generated
  const error = courseResult.error
  let errorDetails = "Unknown error"  // ← Fallback when error is falsy
  
  if (error) {
    // ... diagnostic code
  }
  
  failures.push(`Failed to upsert GolfCourse API ID ${golfCourseApiId}: ${errorDetails}`)
}
```

---

## Root Cause: Logic Bug, Not Repository Error

### The Problem

**Line 248 checks for `outcome === "ok"`**

But according to `/vercel/share/v0-project/lib/repositories/repository-result.ts`, the `ok()` function returns an object with one of these outcomes:

```typescript
export type RepositoryOutcome = "inserted" | "updated" | "skipped" | "failed"
```

**There is no "ok" outcome.**

### Why This Causes "Unknown error"

1. `courseDetailsRepo.upsert()` returns a successful result with `outcome: "inserted"`
2. Line 248 checks: `if (courseResult.outcome === "ok")` → FALSE
3. Code falls through to line 474 (the else branch)
4. `courseResult.error` is undefined (because the operation succeeded!)
5. `errorDetails` stays as `"Unknown error"` (the fallback)
6. The success is misinterpreted as a failure

---

## Evidence

### Repository-Result Type Definition

```typescript
// From repository-result.ts
export type RepositoryOutcome = "inserted" | "updated" | "skipped" | "failed"

export function ok<T>(
  record: T,
  outcome: Exclude<RepositoryOutcome, "failed">
): RepositoryResult<T> {
  return { outcome, record }  // outcome is one of: "inserted", "updated", or "skipped"
}
```

### What Actually Gets Returned

When courseDetailsRepo.upsert() succeeds and inserts a new row:

```javascript
{
  outcome: "inserted",    // ← NOT "ok"!
  record: {
    id: "cmrsjv08900008clkfcau582j",
    externalCourseId: "18214",
    courseName: "Austin Country Club",
    clubName: "Austin Country Club",
    createdAt: "2026-07-20T01:32:25.449Z",
    updatedAt: "2026-07-20T01:32:25.449Z"
  }
}
```

### Why coursesImported: 0

In the importer at line 251:
```typescript
if (isNew) {
  coursesImported++  // ← Never reached because outcome !== "ok"
}
```

Since `courseResult.outcome === "ok"` is always false, `isNew` is never checked, and `coursesImported` never increments.

---

## The Real Exception

The "Unknown error" message is **NOT** hiding a real Prisma or database error. It's a **logic bug** where the importer misinterprets a successful database write as a failure due to checking for the wrong outcome value.

**There is no actual exception to report.** The courseDetails row WAS successfully inserted (we verified this in Phase 13.19 - the row count went from 0 to 1).

---

## Summary

| Component | Status |
|-----------|--------|
| API Response Unwrapping | ✅ Works |
| Payload Normalization | ✅ Works |
| Database Repository | ✅ Works (inserts row successfully) |
| Importer Logic | ❌ BUG - checks `outcome === "ok"` (wrong value) |

**Root Cause:** Importer checks for `outcome === "ok"` but repository returns `outcome === "inserted" | "updated" | "skipped"`

**Fix Required:** Change line 248 and all similar outcome checks from `"ok"` to the correct values: `"inserted"`, `"updated"`, or `"skipped"`.

**Why It Matters:** This bug prevents the importer from recognizing successful writes, causing it to report all results as failures with "Unknown error".

