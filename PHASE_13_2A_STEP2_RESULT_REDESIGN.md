# Phase 13.2A Step 2 — RepositoryResult Redesign

## Decision: Option 3 (Throw on Error - Partial Implementation)

After evaluating the audit findings, we choose to simplify the API for read operations specifically.

### Rationale

1. **Current State Works for Writes**: Write operations use RepositoryResult + outcome enum ✓
2. **Read Operations Are Different**: Queries don't fit write semantics (no insert/update/skip)
3. **Simplest Solution**: Remove wrapper for reads, let them throw or return data directly
4. **Existing Consumer Happy**: Importer already uses `.records` field consistently ✓

### Changes Required

#### Before (Current - Still Confusing):
```typescript
async findVerified(): Promise<RepositoryResult<TournamentCourseMapping[]>> {
  return okRead(mappings)  // { records: [...], outcome: undefined }
}

// Consumer must check:
const mappings = result.records
```

#### After (Proposed - Clearer Intent):
```typescript
async findVerified(): Promise<TournamentCourseMapping[]> {
  // Returns array directly
  // Throws RepositoryError on failure
  // Consumer: const mappings = await repo.findVerified()
}
```

## Implementation Strategy

### Phase 1: Document Contract (THIS STEP)
- [x] Audit all repositories
- [x] Identify inconsistency in TournamentCourseMappingRepository
- [ ] Document proposed changes
- [ ] Implement changes
- [ ] Update consumers

### Phase 2: Implement in TournamentCourseMappingRepository
Change 5 read methods from `Promise<RepositoryResult<T[]>>` to `Promise<T[]>`:

1. `findVerified()` → `Promise<TournamentCourseMapping[]>`
2. `findUnverified(limit?)` → `Promise<TournamentCourseMapping[]>`
3. `findByGolfCourseApiId(id)` → `Promise<TournamentCourseMapping[]>`
4. `findBySportsDataIoCourseId(id)` → `Promise<TournamentCourseMapping[]>`
5. `findLowConfidenceForReview(limit?)` → `Promise<TournamentCourseMapping[]>`
6. `findAutoVerified()` → `Promise<TournamentCourseMapping[]>`
7. `findPendingReview()` → `Promise<TournamentCourseMapping[]>`
8. `findRejected()` → `Promise<TournamentCourseMapping[]>`

### Phase 3: Update All Consumers
- courseinteligence-import.ts
- Any admin pages using these methods
- Any workflows using these methods

### Phase 4: Update Importer
```typescript
// Before:
const mappingsResult = await mappingRepo.findVerified()
if (!mappingsResult.records || mappingsResult.records.length === 0) { return }
const mappings = mappingsResult.records

// After:
const mappings = await mappingRepo.findVerified()
if (!mappings || mappings.length === 0) { return }
```

## Benefits

✓ **Simpler API**: No wrapper object for reads
✓ **Clearer Intent**: Return type shows it's data, not result
✓ **Standard Pattern**: Matches JavaScript conventions (return data or throw)
✓ **Breaks Confusion**: Can't accidentally check `.record` vs `.records`
✓ **Type Safe**: Impossible wrong usage

## Risks

- Breaking change to TournamentCourseMappingRepository API
- Any other code calling these methods will break (need full audit)
- Error handling changes from structured result to exceptions

## Mitigation

- Search all files for calls to these 5 methods (consumers identified in audit)
- Update all callsites simultaneously
- TypeScript will catch any remaining issues

## Files to Modify

### Core Changes
- `lib/repositories/tournament-course-mapping-repository.ts` (update 8 methods)

### Consumer Updates
- `lib/imports/course-intelligence-import.ts` (main consumer)
- Search for other callsites

### Documentation
- `repository-result.ts` (remove okRead, keep ok/fail for writes)

---

*Status: Ready to proceed*
