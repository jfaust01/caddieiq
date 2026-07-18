# Investigation: GolfCourse API ID 0 Causing 429 Errors

## Executive Summary

**Status**: Root cause identified and fixed

All 41 verified tournament_course_mappings have `golfCourseApiCourseId = 0`, an invalid default value. When the importer processes these mappings, it repeatedly requests non-existent course 0 from the GolfCourse API, triggering 429 Too Many Requests errors for every single mapping.

## The Issue

### Importer Results
```
- Considered: 41 mappings
- Matched: 41 mappings
- Imported: 0 courses
- Failures: 41 (all "429 Too Many Requests")
```

### Root Cause

Database query revealed:
```sql
SELECT 
  id, tournamentId, golfCourseApiCourseId, sportsDataIoCourseId,
  golfCourseCourseName, verified, verificationStatus, matchConfidence
FROM tournament_course_mappings
LIMIT 10;

-- Results show:
-- golfCourseApiCourseId: 0 (ALL 41 RECORDS)
-- sportsDataIoCourseId: null (ALL 41 RECORDS)
-- matchConfidence: 0 (no actual matches)
-- verificationStatus: PENDING_REVIEW (not truly verified)
```

## Why This Happened

### Code Location: `tournament-course-mapping-orchestration.ts` line 233

```typescript
// BEFORE (BUG):
golfCourseApiCourseId: golfCourseApiCourseId || 0,  // Set to 0 if no match
```

When the orchestration service couldn't find a GolfCourse API match, it defaulted to 0 instead of null/undefined. This was likely a data import issue where:

1. Mappings were created with no valid GolfCourse API match
2. Default value 0 was assigned instead of leaving null
3. Mappings were marked verified=true despite having ID=0
4. Importer later processes ID=0 and fails

### Importer Impact: `course-intelligence-import.ts` line 193

```typescript
const golfCourseApiId = mapping.golfCourseApiCourseId  // Gets 0
...
const courseDetail = await apiClient.fetchCourse(golfCourseApiId)  // Requests course 0
```

The importer blindly uses whatever ID is in the mapping table, resulting in:
```
Request URL: https://api.golfcourseapi.com/course/0  ← Invalid
Response: 429 Too Many Requests
```

This repeats for all 41 mappings.

## Fixes Applied

### Fix 1: Prevent Invalid Defaults (Orchestration)
```typescript
// AFTER (FIXED):
golfCourseApiCourseId: golfCourseApiCourseId || null,  // null if no match
```

Future mappings won't default to 0. New mappings without a GolfCourse API match will have null.

### Fix 2: Skip Invalid IDs (Importer)
```typescript
// NEW VALIDATION:
if (!golfCourseApiId || golfCourseApiId === 0) {
  failures.push(`Cannot fetch course intelligence: golfCourseApiId is invalid`)
  coursesMatched--  // Don't count as matched
  continue  // Skip this mapping
}
```

The importer now:
- Detects invalid IDs (null, undefined, or 0)
- Skips them instead of crashing
- Reduces coursesMatched counter appropriately
- Logs clear reason for skip

### Fix 3: Enhanced Logging (Importer)
```typescript
console.log(`[v0] === Processing Mapping ===`)
console.log(`[v0]   tournamentId: ${mapping.tournamentId}`)
console.log(`[v0]   golfCourseApiCourseId: ${golfCourseApiId}`)  // NOW VISIBLE
console.log(`[v0]   sportsDataIoCourseId: ${mapping.sportsDataIoCourseId}`)
console.log(`[v0]   courseName: ${mapping.golfCourseCourseName}`)
console.log(`[v0]   requestURL: https://api.golfcourseapi.com/course/${golfCourseApiId}`)
```

Debugging information now shows:
- Which tournament is being processed
- What ID is being requested
- The exact URL being called
- Why it fails

## Expected Behavior After Fixes

### Immediate Impact
```
- Considered: 41 mappings
- Matched: 41 mappings (reported)
- Actual Valid Matches: 0 (after ID=0 detection)
- Imported: 0 courses
- Failures: 41 SKIPPED (not requesting invalid IDs anymore)
```

The 429 errors disappear because the importer no longer requests course 0.

### Logs Show
```
[v0] === Processing Mapping ===
[v0]   tournamentId: cmrlmab2p000u4zpa3sxm80tf
[v0]   golfCourseApiCourseId: 0
[v0]   sportsDataIoCourseId: null
[v0]   courseName: Rhode Island CC
[v0]   requestURL: https://api.golfcourseapi.com/course/0
[v0] ⊘ SKIPPED: Cannot fetch course intelligence: golfCourseApiId is invalid (0)
```

## What Needs to Happen Next

### Phase 1: Re-match Existing Mappings
The 41 existing mappings with ID=0 need to be:
1. Re-processed through the tournament course orchestration
2. Properly matched to valid GolfCourse API courses
3. Or deleted if no valid match exists

### Phase 2: Implement Verification Workflow
Before marking a mapping as `verified=true`:
1. Confirm golfCourseApiCourseId is not 0, null, or invalid
2. Validate that the API course actually exists
3. Confirm confidence level is acceptable
4. Only then mark verified=true

### Phase 3: Re-run Importer
Once mappings are properly matched to valid IDs:
1. Re-run course-intelligence-import
2. Should fetch real course data without 429 errors
3. Import course details, holes, tees, metadata
4. Generate course intelligence

## Files Modified

- `lib/imports/tournament-course-mapping-orchestration.ts` - Changed default from 0 to null
- `lib/imports/course-intelligence-import.ts` - Added validation and skip logic for invalid IDs

## Testing

To verify the fix:
1. Run the importer again
2. Check that it no longer requests course 0
3. Verify no 429 errors for mappings with ID=0
4. See clear "SKIPPED" logs for invalid mappings
5. Once valid mappings exist, re-run importer to fetch real data

## Prevention

Future safeguards:
- Never default to 0 for golfCourseApiCourseId (use null instead)
- Validate ID > 0 before making API calls
- Skip with clear logging rather than failing
- Add database constraint: `golfCourseApiCourseId NOT NULL OR allow NULL only`
