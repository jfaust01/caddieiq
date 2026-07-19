# Tournament Course Matching Engine Investigation Guide

## Overview

All 41 tournament courses failed to match with GolfCourseAPI courses, resulting in:
- 0 verified mappings
- 41 mappings in PENDING_REVIEW with matchConfidence = 0
- 0 courses imported

This investigation guide explains how to diagnose the exact root cause.

---

## Investigation Endpoint

**URL**: `GET /api/admin/diagnostic/matching-engine`

**Purpose**: Run diagnostic matching logic for all 41 tournaments, capturing:
1. SportsDataIO course name
2. GolfCourseAPI search query
3. Every candidate returned by the API
4. Scores calculated for each candidate
5. Why (or why not) a match was selected

**Response Structure**:
```json
{
  "status": "complete",
  "totalTournaments": 41,
  "matchedCount": 0,
  "failedCount": 41,
  "summary": {
    "successRate": "0%",
    "rootCauseAnalysis": {
      "apiSearchErrors": 0,
      "noResultsReturned": 0,
      "scoresBelow50Threshold": 0,
      "missingLocationData": 0,
      "poorNameMatches": 0
    }
  },
  "diagnostics": [
    {
      "tournamentId": "...",
      "tournamentName": "...",
      "sportsDataIOCourseName": "Rhode Island Country Club",
      "city": "Providence",
      "state": "RI",
      "country": "USA",
      "searchQuery": "Rhode Island Country Club",
      "golfCourseAPIResults": [
        {
          "id": 12345,
          "name": "Rhode Island CC",
          "city": "Providence",
          "state": "Rhode Island",
          "country": "United States",
          "nameScore": 85,
          "locationScore": 40,
          "totalScore": 68
        }
      ],
      "bestMatchResult": {
        "courseId": 12345,
        "confidence": 68,
        "reason": "Name: 85% (60% weight) + Location: 40% (40% weight)"
      },
      "noMatchReason": "MATCH FOUND",
      "finalMatchConfidence": 68,
      "finalGolfCourseApiId": 12345
    }
  ]
}
```

---

## Root Cause Analysis Framework

The endpoint categorizes failures into distinct root causes:

### 1. **API Search Errors**
```
"noMatchReason": "API Search Error: 429 Too Many Requests"
```
**Indicates**: Network/API connectivity issues
**Next Step**: Check API rate limiting, authentication, network connectivity

### 2. **No Results Returned**
```
"noMatchReason": "No courses found in API search results"
"golfCourseAPIResults": []
```
**Indicates**: Search query returned no candidates
**Possible Causes**:
- Misspelled course name in source data
- Course name not indexed in GolfCourseAPI
- Search term too restrictive

### 3. **Scores Below 50% Threshold**
```
"noMatchReason": "Best match score (42%) below 50% threshold"
"golfCourseAPIResults": [
  {
    "id": 12345,
    "name": "Different Name Golf Club",
    "totalScore": 42
  }
]
```
**Indicates**: Candidates found but didn't meet confidence threshold
**Sub-causes**:
- **Poor Name Matches** (nameScore < 60%): Course names don't match well
- **Missing Location Data** (locationScore = 0): Location data missing or mismatched
- **Mixed Issues**: Both name and location factors contribute

---

## Key Scoring Components

### Name Matching (60% weight)
```
Algorithm:
1. Normalize both names (lowercase, trim, single spaces)
2. Check exact match (100 points)
3. Check containment (95 points)
4. Remove common suffixes (GC, CC, Golf Club, Country Club)
5. Check cleaned containment (90 points)
6. Calculate character similarity (0-100 points)

Threshold: Must match for overall score > 50%
```

**Examples**:
- "Rhode Island CC" vs "Rhode Island Country Club": 92 (after suffix removal)
- "West Woods Golf Course" vs "West Woods": 95 (containment)
- "Pebble Beach" vs "Pebble Beach Golf Links": 95 (containment)

### Location Matching (40% weight)
```
Components:
- Country match: ±40 points
- State/Province match: ±35 points
- City match: ±25 points
Maximum: 100 points

Threshold: Must contribute sufficiently for overall score > 50%
```

**Examples**:
- Perfect location match: 100 points (40 country + 35 state + 25 city)
- State + country match: 75 points
- No location data: 0 points

### Overall Score Calculation
```
confidence = (nameScore × 0.6) + (locationScore × 0.4)

Examples:
- nameScore=90, locationScore=100: confidence = 94 ✓ (above 50%)
- nameScore=85, locationScore=0: confidence = 51 ✓ (above 50%)
- nameScore=70, locationScore=30: confidence = 54 ✓ (above 50%)
- nameScore=45, locationScore=90: confidence = 54 ✓ (above 50%)
- nameScore=40, locationScore=30: confidence = 37 ✗ (below 50%)
```

---

## How to Interpret Results

### Step 1: Run the Diagnostic
```bash
curl http://localhost:3000/api/admin/diagnostic/matching-engine
```

### Step 2: Check Root Cause Summary
```json
"rootCauseAnalysis": {
  "apiSearchErrors": 2,
  "noResultsReturned": 15,
  "scoresBelow50Threshold": 24,
  "missingLocationData": 12,
  "poorNameMatches": 8
}
```

This tells you:
- **2 tournaments**: API search failed (investigate API/network)
- **15 tournaments**: API found no matching courses (data not in API)
- **24 tournaments**: Candidates found but scored too low (matching algorithm issue)
  - **12 of these**: Missing location data from database
  - **8 of these**: Course names scoring poorly

### Step 3: Examine Specific Tournament Failures
For each tournament in `diagnostics` array:

#### Scenario A: No Results Returned
```json
{
  "sportsDataIOCourseName": "Unknown Golf Club",
  "searchQuery": "Unknown Golf Club",
  "golfCourseAPIResults": [],
  "noMatchReason": "No courses found in API search results"
}
```
**Action**: Check if course name is valid. May need manual lookup or accept no match.

#### Scenario B: Multiple Candidates, One Scoring Low
```json
{
  "sportsDataIOCourseName": "RiversideGC",
  "golfCourseAPIResults": [
    {
      "name": "Riverside Golf Club",
      "nameScore": 88,
      "locationScore": 50,
      "totalScore": 72
    }
  ],
  "noMatchReason": "MATCH FOUND"
}
```
**Action**: Match is good! Check why it wasn't selected (should be in database but isn't).

#### Scenario C: Scoring Just Below Threshold
```json
{
  "sportsDataIOCourseName": "Westwood",
  "golfCourseAPIResults": [
    {
      "name": "West Wood Golf Club",
      "nameScore": 82,
      "locationScore": 25,
      "totalScore": 59
    }
  ],
  "noMatchReason": "Best match score (59%) below 50% threshold"
}
```
**Action**: This is close! Consider lowering threshold from 50% to 45%.

#### Scenario D: Multiple Candidates with Varying Scores
```json
{
  "golfCourseAPIResults": [
    {
      "name": "Exact Match Golf Club",
      "totalScore": 95
    },
    {
      "name": "Partial Match Club",
      "totalScore": 60
    },
    {
      "name": "Similar Name Golf",
      "totalScore": 30
    }
  ],
  "noMatchReason": "MATCH FOUND"
}
```
**Action**: Top match is excellent. Verify it's in database.

---

## Common Findings & Solutions

### Finding 1: API Returns No Results
**Cause**: Course not indexed in GolfCourseAPI
**Solution**: 
- Manual database enrichment
- Use different search terms
- Accept match failure, mark as REJECTED

### Finding 2: Candidates Found but Scores 40-50%
**Cause**: Matching algorithm too conservative
**Solution**:
- Lower threshold from 50% to 45%
- Improve name normalization (remove abbreviations)
- Weight name matching differently

### Finding 3: Location Data Missing (Score=0)
**Cause**: City/state/country not populated in SportsDataIO course data
**Solution**:
- Populate missing location data
- Increase name matching weight (already 60%)
- Manual verification of location

### Finding 4: Name Matching Issues
**Examples**:
- "CC" vs "Country Club" suffix (solved by suffix removal)
- Abbreviations: "Muni" vs "Municipal"
- Short names: "Oak" vs "Oak Golf Club"

**Solution**:
- Add abbreviation mappings
- Enhance suffix handling
- Adjust string similarity algorithm

### Finding 5: Consistent Failures Across All 41
**Indicates**: Systematic issue, not data quality
**Check**:
- Is API returning ANY results?
- Are results completely different from source?
- Is scoring algorithm fundamentally broken?

---

## Next Steps After Diagnosis

### If Mostly API Errors (Finding 1)
1. Check API connectivity and rate limits
2. Verify GOLFCOURSE_API_KEY environment variable
3. Test API directly with sample course names

### If Mostly No Results (Finding 2)
1. Sample 5-10 course names
2. Check if they exist in GolfCourseAPI
3. Try alternative search terms
4. Consider if data quality is issue

### If Mostly Below Threshold (Finding 3)
1. Analyze score distributions
2. If many at 45-50%: Lower threshold to 45%
3. If many at 30-40%: Need algorithm improvements
4. If wide variance: Check for location data issues

### If Mixed Causes
1. Fix API/network issues first
2. Address missing location data
3. Adjust thresholds based on score distributions
4. Improve name matching for persistent failures

---

## Decision Tree

```
Run GET /api/admin/diagnostic/matching-engine
         ↓
    Check rootCauseAnalysis
         ↓
    ├─ apiSearchErrors > 0?
    │  └─ YES: Fix API connectivity/auth
    │
    ├─ noResultsReturned > 5?
    │  └─ YES: Sample courses, verify they exist in API
    │
    ├─ scoresBelow50Threshold > 20?
    │  └─ YES: Examine score distribution
    │     ├─ If many at 45-50%: Lower threshold
    │     └─ If many at 30-40%: Improve algorithm
    │
    ├─ missingLocationData > 10?
    │  └─ YES: Populate location data in SportsDataIO
    │
    └─ poorNameMatches > 10?
       └─ YES: Improve name normalization/suffix removal

After fixes: Re-run orchestration and diagnostics
```

---

## Expected Outcomes

### Healthy Matching (Goal)
```json
{
  "matchedCount": 35-41,
  "failedCount": 0-6,
  "successRate": "85-100%",
  "rootCauseAnalysis": {
    "apiSearchErrors": 0,
    "noResultsReturned": 0,
    "scoresBelow50Threshold": 0-3,
    "missingLocationData": 0,
    "poorNameMatches": 0
  }
}
```

### Diagnostics Show Matches Found
```
"finalGolfCourseApiId": 12345,
"finalMatchConfidence": 75-100,
"noMatchReason": "MATCH FOUND"
```

### Importer Can Process
- coursesConsidered: 41
- coursesImported: 35-41
- holesImported: 400+
- teeBoxesImported: 1000+

---

## Resources

- **Matching Algorithm**: `lib/domain/course/matcher.ts`
- **Orchestration Logic**: `lib/imports/tournament-course-mapping-orchestration.ts`
- **GolfCourseAPI Client**: `lib/providers/golfcourseapi/client.ts`
- **Repository**: `lib/repositories/tournament-course-mapping-repository.ts`

---

## Conclusion

The diagnostic endpoint provides complete visibility into why matches failed. Use this guide to:
1. Identify root causes (API, data, algorithm)
2. Make targeted improvements
3. Re-test and verify fixes
4. Proceed to course intelligence import once thresholds are met

**Do not modify matching logic until root cause is identified.**
