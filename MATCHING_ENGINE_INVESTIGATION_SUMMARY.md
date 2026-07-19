# Matching Engine Investigation - Summary & Next Steps

## Problem Statement

All 41 tournaments failed to match with GolfCourseAPI courses:
- **41 Pending Review mappings**
- **0 Verified mappings**
- **0 valid GolfCourseAPI IDs** (all are null)
- **0 matchConfidence** (all are 0)
- **0 courses imported**

## Investigation Approach

Instead of modifying the matching logic, we've created comprehensive diagnostics to identify the exact root cause.

---

## Available Diagnostic Endpoint

### GET /api/admin/diagnostic/matching-engine

**Purpose**: Analyzes all 41 tournaments and reports exactly why matching failed

**Response Provides**:
1. **Per-Tournament Analysis**:
   - SportsDataIO course name
   - City, state, country from database
   - Search query sent to GolfCourseAPI
   - Every candidate returned by API
   - Score breakdown for each candidate
   - Why top candidate was/wasn't selected

2. **Root Cause Summary**:
   - API search errors count
   - No results returned count
   - Scores below threshold count
   - Missing location data count
   - Poor name matches count

3. **Success Rate**: Overall matching success percentage

---

## How to Run Investigation

### Step 1: Execute Diagnostic
```bash
curl http://localhost:3000/api/admin/diagnostic/matching-engine > diagnosis.json
```

### Step 2: Analyze Results

Check the root cause summary:
```json
"rootCauseAnalysis": {
  "apiSearchErrors": 0,
  "noResultsReturned": 15,
  "scoresBelow50Threshold": 26,
  "missingLocationData": 12,
  "poorNameMatches": 8
}
```

This immediately shows:
- **15 tournaments**: API found NO matching courses at all
- **26 tournaments**: API found candidates but scores < 50%
  - **12 of these**: Missing location data (city/state)
  - **8 of these**: Course names scoring poorly

### Step 3: Examine Specific Failures

For each tournament in the `diagnostics` array, review:

```json
{
  "tournamentName": "Example Tournament",
  "sportsDataIOCourseName": "Example Golf Club",
  "city": "Austin",
  "state": "TX",
  "country": "USA",
  "golfCourseAPIResults": [
    {
      "name": "Example GC",
      "city": "Austin",
      "state": "Texas",
      "nameScore": 82,
      "locationScore": 75,
      "totalScore": 80
    }
  ],
  "noMatchReason": "Best match score (80%) above threshold - MATCH FOUND",
  "finalGolfCourseApiId": 12345
}
```

Or:

```json
{
  "tournamentName": "Unknown Course",
  "sportsDataIOCourseName": "Unknown Golf Club",
  "golfCourseAPIResults": [],
  "noMatchReason": "No courses found in API search results",
  "finalGolfCourseApiId": null
}
```

---

## Potential Root Causes

Based on the diagnostic categories, likely causes are:

### 1. Missing Location Data (12+ tournaments)
- **Symptom**: locationScore = 0
- **Cause**: City/state/country not populated in SportsDataIO course table
- **Fix**: Populate missing location data, re-run matching

### 2. API Search Failures (if > 0)
- **Symptom**: "API Search Error: ..."
- **Cause**: Network issues, rate limiting, invalid API key
- **Fix**: Check API credentials and rate limits

### 3. No Candidates Returned (15+ tournaments)
- **Symptom**: golfCourseAPIResults = []
- **Cause**: Course not indexed in GolfCourseAPI
- **Fix**: Manual lookup or accept no match

### 4. Low Confidence Scores (26+ tournaments)
- **Symptom**: 30-50% total scores
- **Cause**: 
  - Name matching issue (e.g., abbreviations, formatting)
  - Location mismatch (e.g., "RI" vs "Rhode Island")
  - Threshold too conservative
- **Fix**: Improve normalization, adjust threshold, or manually verify

### 5. Poor Name Matches (8+ tournaments)
- **Symptom**: nameScore < 60%
- **Cause**:
  - Course name abbreviations not matched
  - Formatting differences
  - Character similarity algorithm too strict
- **Fix**: Enhance name normalization or reduce threshold

---

## Data Quality Issues to Check

1. **Location Data**
   ```sql
   SELECT COUNT(*) FROM course 
   WHERE city IS NULL OR "stateProvince" IS NULL OR country IS NULL;
   ```
   If > 0, need to populate missing locations

2. **Course Names**
   Sample 10 courses and check:
   - Are names complete? ("Oak GC" vs "Oak Golf Club")
   - Consistent abbreviations?
   - Unusual characters?

3. **Duplicates**
   ```sql
   SELECT name, COUNT(*) FROM tournament_course 
   GROUP BY name HAVING COUNT(*) > 1;
   ```
   Multiple tournaments with same course name

---

## Scoring Algorithm Details

The matching algorithm uses:

**Name Matching (60% weight)**:
- Exact match: 100 points
- One contains other: 95 points
- After removing suffixes (GC, CC, etc.): 92-90 points
- Character similarity: 0-100 points

**Location Matching (40% weight)**:
- Country match: +40 points
- State/Province match: +35 points
- City match: +25 points
- Maximum: 100 points

**Final Score**: (nameScore × 0.6) + (locationScore × 0.4)
**Threshold**: Must be > 50% to be considered a match

---

## Next Steps

### 1. Run Diagnostic (Today)
```bash
curl http://localhost:3000/api/admin/diagnostic/matching-engine
```

### 2. Analyze Results (Today)
- Identify primary root cause from rootCauseAnalysis
- Sample 5-10 specific tournament failures
- Determine if issue is data, algorithm, or system

### 3. Plan Fix (Today)
Based on findings:
- **Missing data**: Populate locations
- **API errors**: Debug connectivity
- **Low scores**: Improve normalization or lower threshold
- **No candidates**: Check if courses exist in API

### 4. Implement Fix (Tomorrow)
- If data issue: Update database and re-run orchestration
- If algorithm issue: Modify matcher.ts and re-run orchestration
- If threshold issue: Adjust in matcher.ts and re-run

### 5. Re-Diagnose (After Fix)
```bash
curl http://localhost:3000/api/admin/diagnostic/matching-engine
```

Check that:
- Success rate improved significantly
- Root cause count for primary issue decreased
- Specific tournament failures now show matches

### 6. Run Importer (When Ready)
Once > 30 mappings are verified with valid IDs:
```bash
curl -X POST http://localhost:3000/api/admin/phase-13-4/run-importer
```

---

## Key Files

- **Investigation Endpoint**: `app/api/admin/diagnostic/matching-engine/route.ts`
- **Matching Algorithm**: `lib/domain/course/matcher.ts`
- **Orchestration Logic**: `lib/imports/tournament-course-mapping-orchestration.ts`
- **Investigation Guide**: `MATCHING_ENGINE_INVESTIGATION_GUIDE.md`

---

## Success Criteria

Matching is working properly when:
- ✅ successRate: > 85%
- ✅ rootCauseAnalysis: All zeros except possibly < 5 "noResultsReturned"
- ✅ Most tournaments: "noMatchReason": "MATCH FOUND"
- ✅ finalGolfCourseApiId: > 0 for most tournaments
- ✅ finalMatchConfidence: > 70% for most matches

---

## Important: Do Not Modify Logic Yet

This investigation guide exists specifically to **identify root cause without guessing**. 

Modifying the matching algorithm without understanding why it failed could:
- Fix one case but break others
- Introduce regressions
- Lower overall accuracy
- Waste time on wrong fixes

**Correct Approach**:
1. ✅ Run diagnostic
2. ✅ Analyze results
3. ✅ Understand root cause
4. ✅ Plan targeted fix
5. ⚠️ THEN modify logic

---

## Contact Points for Questions

- **Endpoint**: GET /api/admin/diagnostic/matching-engine
- **Documentation**: MATCHING_ENGINE_INVESTIGATION_GUIDE.md
- **Code**: See key files list above

---

**Status**: Ready for investigation
**Next Action**: Run diagnostic endpoint and analyze results
