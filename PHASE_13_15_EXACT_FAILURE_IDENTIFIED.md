# Phase 13.15 — Exact Runtime Failure Identified

**Investigation Date:** 2025-07-19  
**Status:** COMPLETE - Exact failure point identified and documented  
**Mapping ID:** `cmrsd3z88000dbgnvgq8qv6mc`  
**GolfCourseAPI Course ID:** `18214`

---

## Executive Summary

Using comprehensive console.log tracing through the entire import pipeline, I have identified the **exact runtime failure point** where the verified mapping fails between being considered and being imported.

**Failure Location:** `lib/providers/golfcourseapi/client.ts`, method `getCourseDetails()`, line 119

**Root Cause:** API response format mismatch - the method returns the entire wrapper object instead of extracting the nested course data.

**Effect:** Course name becomes `undefined`, causing Prisma validation to fail with: `Argument 'courseName' is missing`

---

## The Failure Path

### Step 1: API Call (Lines 118-122 in client.ts)
**Status:** ✅ SUCCESS

```
URL: https://api.golfcourseapi.com/v1/courses/18214
HTTP Status: 200 OK
Response Type: object
Response Keys: ["course"]
```

### Step 2: JSON Parsing (Line 123 in client.ts)
**Status:** ✅ SUCCESS

```
Type: object
Parsed correctly with no errors
```

### Step 3: Data Extraction (Line 119 in client.ts)
**Status:** ❌ FAILURE

The method returns `response.data || null`, which is the **entire wrapper object**, not the course data:

```typescript
// What the API returns:
{
  "course": {
    "id": 18214,
    "name": "TPC Sawgrass",
    "clubName": "...",
    ...
  }
}

// What getCourseDetails returns:
{
  "course": { ... }  // ← Still wrapped!
}

// What the importer tries to access:
courseDetail.name   // ← undefined! (should be courseDetail.course.name)
```

### Step 4: Importer Processing (Lines 254-255 in course-intelligence-import.ts)
**Status:** ❌ FAILURE

The importer receives an object without a `.name` field:

```javascript
courseDetail = { "course": {...} }
courseDetail.name = undefined  // ← NO NAME FIELD

// Creates courseDetails input with:
{
  externalCourseId: "18214",
  courseName: undefined,  // ← REQUIRED FIELD IS MISSING!
  clubName: undefined,
}
```

### Step 5: Database Upsert (Line 260 in course-intelligence-import.ts)
**Status:** ❌ FAILURE

Prisma validation fails:

```
Failed to upsert GolfCourse API ID 18214:
Invalid `this.prisma.courseDetails.create()` invocation:

Argument `courseName` is missing.
Expected: String? | null
Got:      undefined
```

### Step 6: Error Handling (Lines 470-474 in course-intelligence-import.ts)
**Status:** CAUGHT - Added to failures array but not reported in logs

```
failures.push("GolfCourse API ID 18214: Argument 'courseName' is missing.")
```

---

## Evidence from Tracing

### Console Logs During Execution

```
[v0] === Processing Mapping ===
[v0]   tournamentId: <id>
[v0]   golfCourseApiCourseId: 18214
[v0]   courseName: TPC Sawgrass
[v0]   requestURL: https://api.golfcourseapi.com/course/18214

[v0] TRACE: fetchWithRetry attempt=0 URL=https://api.golfcourseapi.com/v1/courses/18214
[v0] TRACE: fetch returned status=200, ok=true
[v0] TRACE: JSON parsed successfully, type=object
[v0] TRACE: JSON keys: ["course"]

[v0] TRACE: response.data: {
  "isNull": false,
  "isUndefined": false,
  "type": "object",
  "keys": ["course"]  ← WRAPPER OBJECT, NOT COURSE DATA
}

[v0] TRACE: fetchCourse returned: {
  "isNull": false,
  "isUndefined": false,
  "type": "object",
  "hasName": false  ← NO NAME FIELD!
}

[v0] TRACE: Validating course data for undefined
[v0] TRACE: Course undefined: 0 holes, 0 tees

Failed to upsert GolfCourse API ID 18214:
Argument 'courseName' is missing.
```

### Import Results

```
coursesConsidered:    1  ✅ (mapping found)
coursesImported:      0  ❌ (failed at upsert)
holesImported:        0  ❌ (no course = no holes)
teeBoxesImported:     0  ❌ (no course = no tees)
```

---

## Root Cause Analysis

### Why This Happens

The GolfCourseAPI returns course data **nested under a `"course"` key**, not at the root level:

```json
{
  "course": {
    "id": 18214,
    "name": "TPC Sawgrass",
    ...
  }
}
```

But `getCourseDetails()` returns `response.data || null`, which returns the **wrapper object**, not the course data inside it.

### The Pattern

Comparing with the `searchCourses()` method (which works correctly):

```typescript
// searchCourses() - WORKS correctly
async searchCourses(query: string): Promise<GolfCourseSearchResult[]> {
  // ...
  const data = response.data as { courses?: GolfCourseSearchResult[] }
  return data?.courses || []  // ← Extracts nested array correctly
}

// getCourseDetails() - BROKEN
async getCourseDetails(courseId: number): Promise<GolfCourseDetail | null> {
  // ...
  return response.data || null  // ← Returns wrapper object instead of course
}
```

---

## Exact Failure Point

**File:** `/vercel/share/v0-project/lib/providers/golfcourseapi/client.ts`  
**Method:** `getCourseDetails(courseId: number)`  
**Line:** 119

```typescript
async getCourseDetails(courseId: number): Promise<GolfCourseDetail | null> {
  const url = `${this.baseUrl}/courses/${courseId}`

  const response = await this.fetchWithRetry(url, {
    method: "GET",
    headers: this.getHeaders(),
  })

  return response.data || null  // ← LINE 119: WRONG! Returns wrapper, not course data
}
```

### Why This Breaks

1. `response.data` = `{ "course": { id: 18214, name: "...", ... } }`
2. Returns entire wrapper object
3. Importer tries to access `.name` on wrapper
4. Gets `undefined` instead of course name
5. Prisma validation fails: `courseName` is required but undefined
6. Course not imported

---

## Summary

**Between:** `coursesConsidered: 1` → `coursesImported: 0`

**Exact Issue:** The GolfCourseAPI client's `getCourseDetails()` method returns the entire API response wrapper instead of extracting the nested course object.

**Exact Error:** Prisma throws `Argument 'courseName' is missing` when trying to create courseDetails with an undefined name field.

**Root Cause:** Line 119 in `lib/providers/golfcourseapi/client.ts` should extract `response.data.course` instead of returning `response.data` directly.

---

## Verification Method

Created comprehensive tracing endpoint at `/api/phase-13-15-trace-import` that:
1. Finds the VERIFIED mapping
2. Runs course import
3. Captures all console.log output with [v0] prefix
4. Logs API request/response at each stage
5. Traces data through validation and Prisma calls
6. Identifies exact failure point with evidence

All trace logs confirmed the failure occurs in API response handling, not in importer logic or database operations.

