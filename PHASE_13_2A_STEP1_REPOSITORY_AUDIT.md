# Phase 13.2A Step 1 — Repository Audit

## Overview

Audited 30 repository classes across the codebase to document their public APIs and identify contract inconsistencies.

## Key Finding: Two Distinct Patterns

### Pattern A: Write Operations (Most Repositories - 25/30)
- **Return Type**: `RepositoryResult<T>` (single record) or `BulkRepositoryResult<T>`
- **Purpose**: Insert, update, upsert, delete operations
- **Return Structure**:
  - `outcome`: "inserted" | "updated" | "skipped" | "failed"
  - `record`: Single T (write operations only)
  - `error`: RepositoryError (on failure)
- **Examples**: 
  - CourseDetailsRepository.upsert()
  - CourseRepository.bulkUpsert()
  - PlayerRepository.upsert()
  - TournamentRepository.upsert()

### Pattern B: Read Operations (TournamentCourseMappingRepository - 5 methods)
- **Return Type**: `RepositoryResult<T[]>` (array of records)
- **Purpose**: Query/filter operations returning multiple records
- **Return Structure** (INCONSISTENT):
  - `outcome`: undefined (reads have no write semantics)
  - `records`: Array of T (recently fixed to use okRead())
  - `error`: RepositoryError (on failure)
- **Methods**:
  - findVerified()
  - findUnverified()
  - findByGolfCourseApiId()
  - findBySportsDataIoCourseId()
  - findLowConfidenceForReview()
  - findAutoVerified()
  - findPendingReview()
  - findRejected()

## Current State

### Consistent Contracts (Write Operations)
```typescript
// Pattern: Single Record Write
async upsert(input: CourseDetailsInput): Promise<RepositoryResult<CourseDetailsRecord>> {
  // Returns: { outcome: "inserted" | "updated" | "skipped", record: T, error? }
}

// Pattern: Bulk Write
async bulkUpsert(courses: readonly CourseDetailsInput[]): Promise<BulkRepositoryResult<CourseDetailsRecord>> {
  // Returns: { records: T[], processed, inserted, updated, skipped, failed, errors }
}
```

### Inconsistent Contracts (Read Operations - Recently Fixed)
```typescript
// OLD (Broken):
async findVerified(): Promise<RepositoryResult<TournamentCourseMapping[]>> {
  return ok(mappings)  // ← outcome undefined, record=[array]
}
// Caller expected: mappingsResult.records (doesn't exist!)

// NEW (Fixed in Phase 13.2):
async findVerified(): Promise<RepositoryResult<TournamentCourseMapping[]>> {
  return okRead(mappings)  // ← outcome undefined, records=[array]
}
// Caller now uses: mappingsResult.records ✓
```

## Repository Method Inventory

### Single-Record Write Operations
- CourseAddressRepository.upsert()
- CourseCoordinatesRepository.upsert()
- CourseDetailsRepository.upsert()
- CourseHoleRepository.upsert()
- CourseMetadataRepository.upsert()
- CourseRepository.upsert()
- CourseSpecificationsRepository.upsert()
- CourseTeeRepository.upsert()
- FieldRepository.upsert()
- PlayingConditionsRepository.create()
- PlayerRepository.upsert()
- PlayerRepository.delete()
- PlayerRoundRepository.upsert()
- RoundRepository.upsert()
- RoundStatisticRepository.upsert()
- TeeHoleYardageRepository.upsert()
- TournamentCourseMappingRepository.create()
- TournamentCourseMappingRepository.update()
- TournamentCourseMappingRepository.upsert()
- TournamentCourseMappingRepository.verify()
- TournamentRepository.upsert()
- WeatherRepository.replaceSnapshot()
- TournamentCourseMappingRepository.verifyMapping()
- TournamentCourseMappingRepository.markForReSearch()

### Bulk Write Operations
- BettingRepository (bulk)
- CourseDetailsRepository.bulkUpsert()
- CourseHoleRepository.bulkUpsert()
- CourseRepository.bulkUpsert()
- CourseTeeRepository.bulkUpsert()
- FantasyRepository (bulk)
- FieldRepository (bulk)
- NewsRepository (bulk)
- OddsRepository (bulk)
- PlayerRepository.bulkUpsert()
- PlayerRoundRepository.bulkUpsert()
- RoundRepository.bulkUpsert()
- RoundStatisticRepository.bulkUpsert()
- StatisticsRepository (bulk)
- TournamentRepository (bulk)
- TournamentCourseMappingRepository.bulkVerify()

### Query/Read Operations (Only in TournamentCourseMappingRepository)
- findByTournamentId() → single record or null
- findVerified() → array (FIXED with okRead)
- findUnverified() → array (FIXED with okRead)
- findByGolfCourseApiId() → array (FIXED with okRead)
- findBySportsDataIoCourseId() → array (FIXED with okRead)
- findLowConfidenceForReview() → array (FIXED with okRead)
- findAutoVerified() → array (FIXED with okRead)
- findPendingReview() → array (FIXED with okRead)
- findRejected() → array (FIXED with okRead)

## Problem: Other Repositories Don't Have Read Methods

**Critical Gap**: No other repositories expose read/query methods at all. Only TournamentCourseMappingRepository has:
- find*() methods for filtering
- query capabilities for importer/consumers

All other 29 repositories:
- Only have write operations (upsert, create, update, delete)
- No find/query methods
- Return single records or bulk operation stats

## Analysis

### Current Design Weakness

1. **Read/Write Semantic Split**: Write operations return `outcome` enum; reads don't fit this model
2. **Naming Inconsistency**: Write uses `record` (singular); reads use `records` (plural)
3. **Limited Query Surface**: Only TournamentCourseMappingRepository has rich query API
4. **No Read Method Pattern**: Other repos would need similar find() methods if they needed queries

### Why This Matters for Phase 13.2A

The importer (and future workflows) need to:
- Query tournament_course_mappings by verification status
- Get filtered sets of mappings (verified, unverified, pending review, etc.)
- Process these arrays

The current fix (okRead + .records) makes this work, but establishes an inconsistent contract compared to other repositories.

## Recommendations for Step 2

### Option 1: Separate Read/Write Result Types (Recommended)
```typescript
// Write operations (existing)
interface RepositoryResult<T> {
  outcome: RepositoryOutcome
  record?: T
  error?: RepositoryError
}

// Read operations (new)
interface ReadRepositoryResult<T> {
  data: T[]
  error?: RepositoryError
}

// Usage
async findVerified(): Promise<ReadRepositoryResult<TournamentCourseMapping>> {
  return { data: mappings }
}
```
**Pros**: Clear semantic distinction, simple consumer code
**Cons**: Two result types to maintain

### Option 2: Unified Result with Discriminated Union (Better Type Safety)
```typescript
type RepositoryResult<T> =
  | { type: 'write'; outcome: RepositoryOutcome; record: T; error?: never }
  | { type: 'read'; data: T[]; outcome?: never; error?: never }
  | { type: 'error'; error: RepositoryError; outcome?: never; record?: never; data?: never }
```
**Pros**: Impossible wrong states, type guards enforce contract
**Cons**: More complex, breaking change for write methods

### Option 3: Throw on Error (Simplest)
```typescript
async findVerified(): Promise<TournamentCourseMapping[]> {
  // Returns array directly, throws on error
  // No result wrapper needed
}
```
**Pros**: Simplest API, standard JavaScript pattern
**Cons**: Loses structured error information, different from write operations

## Next Steps

**Step 2**: Choose result type redesign strategy and implement
**Step 3**: Audit all consumers and ensure compatibility
**Step 4**: Run importer and validate
**Step 5**: Create regression tests

---

*Audit Date: 2026-07-18*  
*Repositories Audited: 30*  
*Inconsistencies Found: 1 (read/write semantic split in TournamentCourseMappingRepository)*  
*Status: Ready for Step 2 RepositoryResult Redesign*
