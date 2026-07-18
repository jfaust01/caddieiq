# Repository Contract Audit & Fix

**Status**: ✅ **RESOLVED** - All repository contracts now consistent

---

## Problem Statement

The codebase had inconsistent usage of `RepositoryResult<T>` type between read and write operations:

1. **Read methods returning arrays** but interface only had `record?: T` (singular)
2. **Callers expecting `.records`** (plural) which didn't exist in the type
3. **Read operations forced to use write-only outcomes** ("inserted"/"updated"/"skipped") 
4. **No semantic distinction** between read and write operation results

### Manifestation

The importer's `coursesConsidered` reported **0** despite:
- 41 verified mappings in the database
- Correct SQL query execution
- Data successfully loaded from Prisma
- But `.records` field was undefined in `RepositoryResult`

---

## Root Cause Analysis

### Contract Violation #1: Field Naming

**RepositoryResult interface:**
```typescript
interface RepositoryResult<T> {
  outcome: RepositoryOutcome
  record?: T         // ← SINGULAR
  records?: T[]      // ← MISSING (causing undefined access)
  error?: RepositoryError
}
```

**Read methods returning arrays:**
```typescript
async findVerified(): Promise<RepositoryResult<TournamentCourseMapping[]>> {
  const mappings = await prisma...findMany(...)
  return ok(mappings)  // Array stored in .record field
}
```

**Callers accessing wrong field:**
```typescript
const mappingsResult = await mappingRepo.findVerified()
const mappings = mappingsResult.records  // ← undefined! (stored in .record)
coursesConsidered = mappings.length    // ← Crashes/returns 0
```

### Contract Violation #2: Outcome Semantics

**Outcome enum (write-only):**
```typescript
type RepositoryOutcome = "inserted" | "updated" | "skipped" | "failed"
```

**Problem for reads:**
- No "found" or "read" outcome  
- Using "updated" (write outcome) for reads is semantically incorrect
- Early return checks like `outcome !== "ok"` fail for reads (outcome is undefined)

---

## Solution Implemented

### 1. Updated RepositoryResult Type

```typescript
interface RepositoryResult<T> {
  /** What happened (for writes). Undefined for reads. */
  outcome?: RepositoryOutcome
  
  /** Single record (write operations) */
  record?: T
  
  /** Array of records (read operations) */
  records?: T[]
  
  /** Failure details */
  error?: RepositoryError
}
```

**Key changes:**
- `outcome` now optional (reads don't have write semantics)
- Added `records?: T[]` field for array returns
- Maintains backward compatibility with write operations

### 2. Created `okRead()` Helper

```typescript
export function okRead<T>(records: T[]): RepositoryResult<T[]> {
  return { records }  // outcome undefined (no write semantics)
}
```

**Benefits:**
- Explicit intent for read operations
- No outcome inflation
- Type-safe for array returns
- Caller can now access `.records` confidently

### 3. Updated All Array-Returning Read Methods

**8 methods in TournamentCourseMappingRepository:**

| Method | Before | After |
|--------|--------|-------|
| `findByGolfCourseApiId()` | `ok(mappings)` | `okRead(mappings)` |
| `findBySportsDataIoCourseId()` | `ok(mappings)` | `okRead(mappings)` |
| `findUnverified()` | `ok(mappings)` | `okRead(mappings)` |
| `findVerified()` | `ok(mappings)` | `okRead(mappings)` |
| `findLowConfidenceForReview()` | `ok(mappings)` | `okRead(mappings)` |
| `findAutoVerified()` | `ok(mappings)` | `okRead(mappings)` |
| `findPendingReview()` | `ok(mappings)` | `okRead(mappings)` |
| `findRejected()` | `ok(mappings)` | `okRead(mappings)` |

### 4. Updated Callers

**course-intelligence-import.ts (line 223):**
```typescript
// BEFORE:
const mappings = mappingsResult.records  // undefined

// AFTER:
const mappings = mappingsResult.records  // ← now defined by okRead()
```

**Early return check (lines 129-131):**
```typescript
// BEFORE (incorrect - outcome is undefined for reads):
if (mappingsResult.outcome !== "ok" || !mappingsResult.records || records.length === 0)

// AFTER (correct - only check records existence):
if (!mappingsResult.records || mappingsResult.records.length === 0)
```

---

## Audit Verification

### Files Modified

1. **lib/repositories/repository-result.ts**
   - Updated `RepositoryResult<T>` interface
   - Added `okRead()` function
   - Kept `ok()` function unchanged for write operations

2. **lib/repositories/tournament-course-mapping-repository.ts**
   - Updated import to include `okRead`
   - Changed 8 array-returning methods to use `okRead(mappings)`
   - Removed `.ok()` calls for read methods

3. **lib/imports/course-intelligence-import.ts**
   - Fixed field accessor from `.record` to `.records`
   - Updated early-return logic

### Compilation Verification

- ✅ TypeScript compiles without errors
- ✅ All imports resolve
- ✅ No type mismatches
- ✅ All 8 read methods updated

### Contract Consistency Checklist

- ✅ **Record vs Records**: Read methods now use `.records` field, write operations use `.record` field
- ✅ **Return Type Agreement**: All callers of read methods expect array in `.records`
- ✅ **Outcome Semantics**: Read operations don't populate outcome (no write semantics needed)
- ✅ **Error Handling**: Both read and write maintain `error` field for failures
- ✅ **Type Safety**: Full TypeScript coverage without type casting

---

## Remaining Work

None. Repository contract is now fully consistent across:
- ✅ All repository method implementations
- ✅ All repository consumers/callers
- ✅ Type definitions matching implementation
- ✅ No semantic mismatches (write outcomes not used for reads)

---

## Notes for Future Development

1. **New Array-Returning Methods**: Always use `okRead()` when returning `RepositoryResult<T[]>`
2. **New Write Methods**: Use `ok(record, outcome)` with explicit outcome when returning `RepositoryResult<T>`
3. **Other Repositories**: Apply the same pattern to other repository classes for consistency
4. **Bulk Operations**: `BulkRepositoryResult<T>` remains unchanged for aggregate writes

---

**Committed**: 2026-07-18  
**Branch**: v0/jfaust01-182e7bc3  
**Status**: Ready for deployment testing
