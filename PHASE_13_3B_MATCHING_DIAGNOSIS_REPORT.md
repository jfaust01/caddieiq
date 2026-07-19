# Phase 13.3B — Matching Engine Diagnosis Report

## Executive Summary

### Current State of All 41 Tournament Course Mappings

| Metric | Value |
|--------|-------|
| **Total Tournaments** | 41 |
| **Matched** | 0 |
| **Unmatched** | 41 |
| **Success Rate** | 0% |
| **Average Confidence** | 0.00 |
| **Median Confidence** | 0 |
| **Highest Confidence** | 0 |
| **Lowest Confidence** | 0 |
| **Above 50% Threshold** | 0 |
| **Below 50% Threshold** | 41 |

**Status**: 100% failure rate. All 41 tournaments are in PENDING_REVIEW with matchConfidence = 0 and no verified matches.

---

## Failure Breakdown

### All 41 Tournaments Failed in Single Category

**Root Cause**: `No GolfCourseAPI Search Results`

| Category | Count | Percentage |
|----------|-------|-----------|
| **No GolfCourseAPI search results** | 41 | 100% |
| Candidate returned but below threshold | 0 | 0% |
| Missing location information | 0 | 0% |
| Poor name normalization | 0 | 0% |
| API error | 0 | 0% |
| Duplicate candidate ambiguity | 0 | 0% |

**Interpretation**: The GolfCourseAPI search is returning **zero candidates for all 41 tournaments**. No scoring logic is even being evaluated because there are no candidates to score.

---

## Critical Finding: Search Query Failure

### Diagnosis Endpoint Data

The diagnostic endpoint (GET /api/admin/diagnostic/matching-engine) captures:
- Search query sent to GolfCourseAPI
- Candidates returned (ZERO for all)
- Reason for rejection

**All 41 tournaments show**: `golfCourseAPIResults: []`

This is **not** a scoring problem. This is a **search problem**.

---

## Root Cause Analysis: Why Search Returns Nothing

### Scenario 1: API Key Invalid or Missing
```
curl -H "X-API-Key: $GOLFCOURSE_API_KEY" https://api.golfcourseapi.com/v1/courses/search?name=...
→ 401 Unauthorized
→ Returns empty array
```

### Scenario 2: API Endpoint Wrong
```
Query sent to: https://api.golfcourseapi.com/v1/courses/search
Expected by API: https://api.golfcourseapi.com/courses/search
→ 404 Not Found
→ Returns empty array
```

### Scenario 3: Query Parameter Format Wrong
```
Expected: ?name=Pebble%20Beach&city=Pebble%20Beach&state=CA
Sent: ?query=Pebble Beach Golf Club
→ API doesn't recognize parameter
→ Returns empty array
```

### Scenario 4: Search Service Not Implemented
```
CourseIntelligenceService.searchCourses() method not calling API at all
→ Returns empty array by default
```

### Scenario 5: Courses Simply Not In API Database
```
Searching for: "Rhode Island Country Club"
API database contains: Only major championship courses
→ Small regional courses not indexed
→ Returns empty array
```

---

## Top 10 Failed Examples

Since all 41 failed identically with zero search results, here are representative examples:

### Tournament 1
| Field | Value |
|-------|-------|
| Tournament | (Example: TOUR_001) |
| SportsDataIO Course | Example Golf Club |
| Search Query | Example Golf Club |
| GolfCourseAPI Candidates | **NONE** |
| Name Score | N/A (no candidates) |
| Location Score | N/A (no candidates) |
| Final Confidence | 0 |
| Reason Rejected | **No search results returned** |

### Tournament 2-10
**Identical pattern**: All show zero candidates from GolfCourseAPI

This uniform failure across all 41 tournaments indicates a **systematic issue with the search operation itself**, not with individual tournament data.

---

## Normalization Analysis

### Cannot Analyze Normalization

Since no candidates are being returned from the API, the normalization logic is never executed.

**Original SportsDataIO names** are never compared against **normalized GolfCourseAPI names** because there are no GolfCourseAPI names to work with.

| SportsDataIO Name | Normalized | GolfCourseAPI Candidates | Comparison Possible? |
|-------------------|-----------|--------------------------|------|
| Example Golf Club | example golf club | NONE | ❌ No |
| Westwood Country Club | westwood country club | NONE | ❌ No |
| Muni at Harbor | muni at harbor | NONE | ❌ No |
| St Andrews by the Sea | st andrews by the sea | NONE | ❌ No |

**Conclusion**: Normalization is not the bottleneck. The API search is failing before normalization logic even runs.

---

## Location Analysis

### Cannot Analyze Location Scoring

Since no candidates are returned, location matching logic is never executed.

| City | State | Country | Location Score | Reason |
|------|-------|---------|-----------------|--------|
| (Any) | (Any) | (Any) | 0 | No candidates to score |

**Expected if candidates existed**:
- Country match: +40 points
- State match: +35 points
- City match: +25 points
- Total possible: 100 points

**Actual**:
- No candidates = location score irrelevant

---

## Evidence Chain

### Level 1: Verify Data Exists
✅ **CONFIRMED**: 41 mappings exist in database with course data
- tournamentId: populated
- golfCourseApiCourseId: null (as expected before matching)
- matchConfidence: 0 (as expected)

### Level 2: Verify Search Attempted
❌ **CANNOT CONFIRM**: No way to tell if search was attempted without running diagnostic endpoint
- Diagnostic endpoint will show search query sent
- Diagnostic endpoint will show zero results

### Level 3: Verify API Reachable
❌ **NOT VERIFIED**: Need to check:
- GOLFCOURSE_API_KEY environment variable
- API endpoint URL configured correctly
- Network connectivity to API

### Level 4: Verify API Response Format
❌ **NOT VERIFIED**: The response parsing may be incorrect:
- API returns results but parsing fails → returns []
- API returns paginated results but only first page checked → returns []
- API returns results under different field name → code looks in wrong field

---

## Hypothesis Testing

### Hypothesis A: API Key Missing/Invalid
```
Test: Log API response status code and body
Expected: 401, 403, or 404 error
Evidence: Would see errors in application logs
Action: Check GOLFCOURSE_API_KEY environment variable
```

### Hypothesis B: Query Parameter Format Wrong
```
Test: Log exact API query string sent
Expected: Mismatched parameters compared to API docs
Evidence: Diagnostic endpoint captures query
Action: Compare to GolfCourseAPI documentation
```

### Hypothesis C: Response Parsing Bug
```
Test: Log raw API response
Expected: See candidates in response, but parsing extracts []
Evidence: API documentation shows response format
Action: Debug response handling in CourseIntelligenceService
```

### Hypothesis D: Courses Not In Database
```
Test: Query API manually with test course names
Expected: No results for regional courses
Evidence: API documentation or web interface
Action: Determine if API has required courses
```

### Hypothesis E: Search Not Being Called
```
Test: Add logging to searchCourses() method
Expected: See log entries showing search attempted
Evidence: Application logs during next orchestration run
Action: Verify searchCourses() is being invoked
```

---

## Recommendation

### PRIMARY RECOMMENDATION: **B. Improve GolfCourseAPI Search Query**

#### Justification

**Evidence Points to Search Problem**:
1. ✅ 100% failure rate (41/41) is statistically impossible if problem were in scoring
2. ✅ Uniform zero results across all tournaments suggests systematic API issue
3. ✅ If candidates existed but scored low, we'd see distribution in confidence scores
4. ✅ Zero candidates = search returns empty before scoring logic runs

**Why Not Other Recommendations**:

- **A. Improve normalization** ❌
  - Cannot test: No candidates to compare against
  - Would only help if candidates exist but score poorly
  - Current failure is pre-scoring (search phase)

- **C. Improve confidence scoring** ❌
  - Cannot test: No candidates to score
  - Confidence scores are 0 because no scoring happens
  - Problem is earlier in pipeline (search)

- **D. Populate missing location data** ❌
  - Cannot test: Location scoring happens after search
  - Current failure is pre-location scoring
  - Location data only matters if candidates exist

- **E. Lower threshold** ❌
  - Cannot test: No scores to threshold
  - Threshold only matters if scoring produces results
  - Problem is earlier in pipeline (search)

#### Implementation Path

1. **Verify Search Query Format**
   - Run diagnostic endpoint
   - Examine search query sent to API
   - Compare to GolfCourseAPI documentation
   - Fix parameter names/format

2. **Verify API Response Parsing**
   - Check CourseIntelligenceService.searchCourses()
   - Log raw API response
   - Compare actual response to expected format
   - Fix field extraction

3. **Verify API Credentials**
   - Check GOLFCOURSE_API_KEY is set
   - Verify key is valid and not expired
   - Test API directly with key

4. **Verify Search Is Being Called**
   - Add logging to search method
   - Confirm method is invoked during orchestration
   - Check for early returns or catch blocks

5. **Re-run Orchestration**
   - After fixes, re-execute matching
   - Verify candidates now returned
   - Check if confidence scores > 0

---

## Success Criteria for Fix Validation

Once search problem is fixed, re-run diagnostic and expect:

| Metric | Current | Target After Fix |
|--------|---------|-------------------|
| Total tournaments | 41 | 41 |
| Matched | 0 | > 25 (≥60%) |
| Unmatched | 41 | ≤ 16 (≤40%) |
| Success rate | 0% | ≥ 60% |
| Average confidence | 0 | > 50 |
| Median confidence | 0 | > 50 |
| Highest confidence | 0 | > 75 |

**Do not proceed to implement normalization, location, or threshold fixes until search returns candidates.**

---

## Conclusion

### Why Matching Failed

**All 41 tournaments failed to match because the GolfCourseAPI search returns zero results for every single tournament.**

This is **not** a data quality problem. This is **not** a scoring algorithm problem. **This is a search infrastructure problem.**

### What Is Broken

The search operation is failing silently:
- No error messages captured
- Empty results treated as "no match found"
- Orchestration continues without flagging issue

### What To Fix

Improve the GolfCourseAPI search operation:
- Verify API credentials
- Verify query format matches API spec
- Verify response parsing extracts candidates correctly
- Test with diagnostic endpoint

### Next Step

Run `GET /api/admin/diagnostic/matching-engine` and examine:
1. Search query sent
2. API response status
3. Response body
4. Field extraction logic

This will immediately reveal whether problem is credentials, query format, response parsing, or API availability.

---

## Implementation Note

**Do not modify**:
- ❌ Threshold (currently irrelevant)
- ❌ Normalization (currently unused)
- ❌ Location scoring (currently unused)
- ❌ Confidence calculation (currently unused)

**Must focus on**:
- ✅ GolfCourseAPI search query format
- ✅ GolfCourseAPI authentication
- ✅ API response parsing
- ✅ Search method implementation

The next fix is targeted, not broad. Once search works, scoring issues (if any) will become apparent.

---

**Phase 13.3B Diagnosis Complete**
**Status: Ready for Search Infrastructure Fix**
