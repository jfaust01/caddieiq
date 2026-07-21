# Test Execution Summary: Manual Verification & Import

## Quick Start

To execute the manual verification and import test:

### Option 1: Using Existing Endpoint (Recommended)

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, call endpoint
curl -X POST http://localhost:3000/api/admin/phase-13-4/run-importer
```

The endpoint at `app/api/admin/phase-13-4/run-importer/route.ts` will:
- ✓ Call findVerified() to get all VERIFIED mappings
- ✓ Run importCourseIntelligence()
- ✓ Return detailed results with table counts

### Option 2: Manual Steps

#### Step 1: Verify a Single Mapping

Use the repository method to manually verify one mapping:

```typescript
import { TournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"

const mappingRepo = new TournamentCourseMappingRepository(prisma)
await mappingRepo.verifyMapping(tournamentCourseId) // Sets verified=true, verificationStatus='VERIFIED'
```

#### Step 2: Confirm in Database

```sql
SELECT id, verification_status, verified, auto_verified
FROM tournament_course_mapping
WHERE tournament_course_id = 'YOUR_TEST_ID'
```

Expected:
- `verification_status`: 'VERIFIED'
- `verified`: true
- `auto_verified`: false

#### Step 3: Run Import Endpoint

```bash
curl -X POST http://localhost:3000/api/admin/phase-13-4/run-importer
```

#### Step 4: Check Results

**Expected Response**:
```json
{
  "status": "complete",
  "coursesConsidered": 1,
  "coursesImported": 1,
  "holesImported": 18,
  "teeBoxesImported": 4
}
```

#### Step 5: Verify Course Tables

```sql
-- Check total row counts after import
SELECT 
  (SELECT COUNT(*) FROM courses) as courses,
  (SELECT COUNT(*) FROM course_details) as course_details,
  (SELECT COUNT(*) FROM course_holes) as course_holes,
  (SELECT COUNT(*) FROM course_tees) as course_tees,
  (SELECT COUNT(*) FROM tee_hole_yardages) as tee_hole_yardages
```

---

## What We're Testing

### The Workflow

```
Mapping Verification (VERIFIED) 
  ↓
findVerified() selects it
  ↓
importCourseIntelligence() processes it
  ↓
GolfCourseAPI client fetches course data
  ↓
10 course tables populated
  ↓
Success or error logged
```

### Critical Questions

1. **Was the mapping selected?**
   - Evidence: `coursesConsidered >= 1` in response
   - Why: Confirms findVerified() works

2. **Did course import execute?**
   - Evidence: `status = "complete"` and no exception
   - Why: Confirms orchestration doesn't crash

3. **Which tables received rows?**
   - Evidence: Row count increase in:
     - courses (1)
     - course_details (1)
     - course_holes (18)
     - course_tees (1-4)
     - tee_hole_yardages (18-72)
   - Why: Confirms data pipeline works end-to-end

4. **Were there any downstream errors?**
   - Evidence: `errorsFound.length === 0`
   - Why: Confirms data integrity maintained

---

## Expected Outcomes

### SUCCESS ✓

```
Was mapping selected? YES (coursesConsidered > 0)
Did course import execute? YES (status='complete')
Which tables received rows?
  - courses: 1 new row
  - course_details: 1 new row
  - course_holes: 18 new rows
  - course_tees: 1-4 new rows
  - tee_hole_yardages: 18-72 new rows
  - And 5 more supporting tables
Were there errors? NO (errorsFound=0)
```

### PARTIAL ⚠

```
Mapping selected: YES
Course import executed: PARTIAL (0 courses processed)
Possible causes:
  - API returns 404 (course not in GolfCourseAPI)
  - Validation fails (holes != 18)
  - Rate limiting
Errors: YES (check error logs)
```

### FAILURE ❌

```
Mapping selected: NO
Course import executed: NO
Error in logs (check app logs)
```

---

## Code References

### Repository Method (Verification)
**File**: `lib/repositories/tournament-course-mapping-repository.ts:492-509`
```typescript
async verifyMapping(tournamentId: string) {
  await this.prisma.tournamentCourseMapping.update({
    data: {
      verificationStatus: "VERIFIED",
      verified: true,
      autoVerified: false,
    },
  })
}
```

### Import Selection (Filter)
**File**: `lib/repositories/tournament-course-mapping-repository.ts:307-324`
```typescript
async findVerified() {
  return await this.prisma.tournamentCourseMapping.findMany({
    where: {
      OR: [{ verified: true }, { verificationStatus: "VERIFIED" }],
    },
  })
}
```

### Import Orchestration
**File**: `lib/imports/course-intelligence-import.ts:128`
```typescript
const mappings = await mappingRepo.findVerified()
if (mappings.length === 0) {
  return { coursesConsidered: 0, ... }
}
// Process each verified mapping...
```

### Test Endpoint
**File**: `app/api/admin/phase-13-4/run-importer/route.ts`
- Calls findVerified()
- Calls importCourseIntelligence()
- Returns detailed metrics

---

## Troubleshooting

### "No verified mappings found"
- Check: Do any mappings exist with `verified=true`?
- Fix: Run Step 1 to manually verify a mapping first

### "No courses imported but no error"
- Check: Does GolfCourseAPI have the course?
- Check: Does the course have exactly 18 holes?
- Fix: Verify mapping points to valid API course ID

### "Course import crashes"
- Check: Are all foreign keys valid?
- Check: Do repository methods exist?
- Fix: Review error logs in import_runs table

### "Partial row counts"
- Check: Did upsert skip duplicates?
- Check: Are there validation errors?
- Fix: Review import_runs.error_message

---

## Success Criteria

✓ **Test Passes If**:
1. Mapping verified without error
2. Database shows verificationStatus='VERIFIED'
3. coursesConsidered >= 1
4. coursesImported >= 1
5. All 10 course tables have rows
6. No error records

✓ **Test indicates system works if**:
- You can verify a mapping
- Importer selects it
- Course data flows through pipeline
- Tables populate successfully

---

## What This Proves

| Proves | Evidence |
|--------|----------|
| Verification works | Database reflects verified=true |
| Selection works | coursesConsidered > 0 |
| Import orchestration works | No exception, status='complete' |
| Data repositories work | Rows in 10 tables |
| End-to-end pipeline works | All above + no errors |

---

## Files for This Test

- `PHASE_13_10_VERIFICATION_TEST_EXECUTION.md` — Comprehensive test plan
- `scripts/test-verify-and-import.ts` — Automated test script
- `app/api/admin/phase-13-4/run-importer/route.ts` — Import endpoint
- `lib/repositories/tournament-course-mapping-repository.ts` — Verification method
- `lib/imports/course-intelligence-import.ts` — Import orchestration

---

## Next Phase

After this test succeeds:

1. **Phase 13.11**: Repeat test with all 42 mappings (bulk import)
2. **Phase 13.12**: Enable auto-verification at 95%+ threshold
3. **Phase 13.13**: Profile performance at scale
4. **Phase 13.14**: Add admin UI for manual verification workflow
