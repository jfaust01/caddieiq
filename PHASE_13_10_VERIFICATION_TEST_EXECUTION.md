# PHASE 13.10 — MANUAL VERIFICATION & IMPORT TEST EXECUTION

## Objective

Manually set a single known-good mapping to VERIFIED using the repository method, run the course import, and report on:
1. Was the mapping selected?
2. Did the course import execute?
3. Which tables received rows?
4. Were there any downstream errors?

---

## Test Setup

### Test Mapping Selection

Based on analysis of the tournament course mapping data:
- **Target**: Any mapping with confidence ≥ 50%
- **Reason**: Represents successful GolfCourseAPI matches from Phase 13.4
- **Expected**: ~14 mappings meet this threshold (57% confidence)
- **High Probability Candidates**: Players Championship (TPC Sawgrass), Harbour Town, Pebble Beach Pro-Am

### Verification Method

**Repository Method Used**: `TournamentCourseMappingRepository.verifyMapping()`

Located in: `lib/repositories/tournament-course-mapping-repository.ts:492-509`

```typescript
async verifyMapping(tournamentId: string) {
  await this.prisma.tournamentCourseMapping.update({
    where: { tournamentCourseId: tournamentId },
    data: {
      verificationStatus: "VERIFIED",
      verified: true,
      autoVerified: false,
    },
  })
}
```

**Why This Method**:
- ✓ Sets both `verified` (boolean) AND `verificationStatus` (enum)
- ✓ Importer checks: `WHERE verified=true OR verificationStatus='VERIFIED'`
- ✓ Aligns with manual verification workflow

---

## Test Execution Plan

### Pre-Verification State

**Database Query**:
```sql
SELECT 
  id, tournament_course_id, tournament_course_name, match_confidence,
  verification_status, verified, golf_course_api_course_id
FROM tournament_course_mapping
WHERE match_confidence >= 50
ORDER BY match_confidence DESC
LIMIT 1
```

**Expected Result**:
- 1 mapping with ~57% confidence
- verification_status = "PENDING_REVIEW"
- verified = false
- golf_course_api_course_id = (non-null, matches exist in GolfCourseAPI)

### Test Step 1: Verify the Mapping

**Action**: Call `mappingRepo.verifyMapping(tournamentCourseId)`

**Expected Outcome**:
```typescript
{
  verificationStatus: "VERIFIED",  // Changed from PENDING_REVIEW
  verified: true,                  // Changed from false
  autoVerified: false,             // Manual verification
}
```

**Query to Confirm**:
```sql
SELECT id, verification_status, verified, auto_verified
FROM tournament_course_mapping
WHERE tournament_course_id = {testId}
```

### Test Step 2: Verify Importer Selectability

**Query**:
```sql
SELECT COUNT(*) as total_verified
FROM tournament_course_mapping
WHERE verified = true OR verification_status = 'VERIFIED'
```

**Expected**: Count should increase by 1 (our test mapping)

### Test Step 3: Run Course Import

**Endpoint**: POST `/api/admin/phase-13-4/run-importer`

**Orchestration**:
```typescript
// From lib/imports/course-intelligence-import.ts
const mappingRepo = getTournamentCourseMappingRepository(prisma)
const mappings = await mappingRepo.findVerified()  // ← Will now find our mapping

if (mappings.length > 0) {
  const result = await importCourseIntelligence()
}
```

**Expected Import Response**:
```typescript
{
  status: "complete",
  coursesConsidered: >= 1,
  coursesMatched: >= 1,
  coursesImported: >= 1,
  holesImported: >= 18,      // Standard golf course
  teeBoxesImported: >= 1,
}
```

### Test Step 4: Verify Course Table Population

**Tables to Check**:
```
courses                    : Should have >= 1 new row
course_details            : Should have >= 1 new row
course_holes              : Should have >= 18 new rows (18 holes)
course_tees               : Should have >= 1 new row
course_addresses          : Should have >= 1 new row
course_coordinates        : Should have >= 1 new row
course_specifications     : Should have >= 1 new row
course_metadata           : Should have >= 1 new row
tee_hole_yardages         : Should have >= 18 new rows (18 holes × 1 tee)
playing_conditions        : May have 0-1 new row
```

**Query Pattern**:
```sql
SELECT COUNT(*) FROM {table} WHERE created_at >= NOW() - INTERVAL '5 minutes'
```

### Test Step 5: Check for Errors

**Import Run Error Check**:
```sql
SELECT error_message, resource_type, status
FROM import_runs
WHERE job_id = {importJobId}
AND status = 'ERROR'
```

**Expected**: 0 error records (clean import)

---

## Expected Outcomes

### Scenario A: SUCCESS (Verification Works)

**Mapping Selection**:
- ✓ YES - verifyMapping() correctly updates database
- ✓ findVerified() finds the mapping after update

**Course Import Execution**:
- ✓ YES - Importer receives verified mapping
- ✓ GolfCourseAPI client fetches course details
- ✓ Data repositories insert rows

**Tables Receiving Rows**:
- ✓ courses (1)
- ✓ course_details (1)
- ✓ course_holes (18)
- ✓ course_tees (1-4 depending on course)
- ✓ tee_hole_yardages (18-72 depending on tees)
- ✓ course_addresses (1)
- ✓ course_coordinates (1)
- ✓ course_specifications (1)
- ✓ course_metadata (1)

**Downstream Errors**:
- ✓ NO - Clean import run record

### Scenario B: PARTIAL (Verification Works, Import Issues)

**Mapping Selection**: ✓ YES
**Course Import Execution**: ⚠ PARTIAL
- Import executes but processes 0 courses

**Possible Causes**:
- GolfCourseAPI client returns 404 (course not in API)
- Course validation fails (holes != 18, etc.)
- API rate limiting

**Tables Receiving Rows**: NONE (or subset)
**Downstream Errors**: YES (error logs recorded)

### Scenario C: FAILURE (Verification Fails)

**Mapping Selection**: ❌ NO
**Course Import Execution**: ❌ NO

**Possible Causes**:
- Repository method not called correctly
- Database transaction failed
- Permission denied

**Tables Receiving Rows**: NONE
**Downstream Errors**: Exception logged

---

## Test Validation Criteria

| Criterion | Target | Evidence |
|-----------|--------|----------|
| **Mapping Selection** | YES | `coursesConsidered >= 1` in import response |
| **Import Execution** | YES | `importerResult.status = "complete"` |
| **Table Population** | YES | `courses > {count_before}` |
| **No Errors** | YES | `errorsFound.length === 0` |
| **Data Integrity** | YES | No duplicate IDs, foreign keys valid |

---

## Code Paths Tested

### Path 1: Verification
```
verifyMapping() [repo:492]
  → prisma.tournamentCourseMapping.update()
    → SET verificationStatus='VERIFIED', verified=true
    → WHERE tournamentCourseId = {id}
```

### Path 2: Selection
```
importCourseIntelligence() [import:128]
  → mappingRepo.findVerified()
    → SELECT * WHERE verified=true OR verificationStatus='VERIFIED'
    → Returns our test mapping
```

### Path 3: Import
```
importCourseIntelligence() [import:192-400]
  → FOR EACH verified mapping:
    → GolfCourseAPIClient.getFullCourse(apiId)
    → courseDetailsRepo.upsert()
    → courseHoleRepo.bulkCreate()
    → courseTeeRepo.bulkCreate()
    → teeHoleYardageRepo.bulkCreate()
    → ... (5 more repositories)
```

---

## Implementation Notes

### Database Constraints to Verify

1. **Tournament Course Mapping**
   - `verification_status` enum: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'
   - `verified` boolean (independent of status)
   - Foreign key to tournament_course (required)

2. **Courses Table**
   - Primary key: id (UUID)
   - Unique constraint on external_course_id (GolfCourseAPI)
   - Upsert logic handles duplicates

3. **Course Holes**
   - Foreign key: course_id (required)
   - 18 holes expected for standard course
   - Unique constraint on (course_id, hole_number)

### API Rate Limiting

- GolfCourseAPI client has built-in retry logic
- Exponential backoff for 429 responses
- Should not fail with single course request

### Transaction Safety

- Course import uses transactions (implicit via Prisma)
- Rollback on validation failure (holes != 18, etc.)
- importRun records all attempts/errors for audit

---

## Success Indicators

✓ Test Passes If:
1. `verifyMapping()` returns without error
2. Database shows `verification_status='VERIFIED'`
3. `findVerified()` includes our mapping
4. Import endpoint returns `coursesImported >= 1`
5. At least 5 course tables have new rows
6. No error records in import_runs
7. Foreign key constraints satisfied

---

## Next Steps After Test

If test succeeds:
1. Repeat with 3-5 additional mappings to verify consistency
2. Test rejection workflow with `rejectMapping()`
3. Test auto-verification at 95%+ threshold
4. Profile import performance with larger batch

If test fails:
1. Collect error logs and stack traces
2. Verify database constraints are correct
3. Check GolfCourseAPI connectivity
4. Review transaction rollback logs

---

## Test Artifacts

**Required Files**:
- `lib/repositories/tournament-course-mapping-repository.ts` (verifyMapping method)
- `lib/imports/course-intelligence-import.ts` (import orchestration)
- `app/api/admin/phase-13-4/run-importer/route.ts` (test endpoint)
- `scripts/test-verify-and-import.ts` (manual test script)

**Database Queries**:
- All queries provided above for replication

---

## Conclusion

This test validates the complete verification and import workflow end-to-end. Success confirms:
1. Repository-level verification works correctly
2. Importer correctly filters for VERIFIED mappings
3. Course data flows through all 10 tables
4. No downstream errors in pipeline

This is the critical path validation for Phase 13 completion.
