# Phase 13.3B — Next Investigation Steps

## Technical Diagnosis: How to Identify Search Problem

Based on the Phase 13.3B diagnosis, the GolfCourseAPI search is returning zero results for all 41 tournaments.

This document outlines the exact investigation steps to identify WHY.

---

## Step 1: Run Diagnostic Endpoint

```bash
curl http://localhost:3000/api/admin/diagnostic/matching-engine > diagnosis.json
```

**This endpoint shows**:
- Exact search query sent to API
- Exact API response (if captured)
- Error messages (if any)
- Candidates returned (currently: none)

**Examine**:
```json
{
  "tournamentName": "Example Tournament",
  "courseName": "Example Golf Club",
  "searchQuery": "Example Golf Club",
  "golfCourseAPIResults": [],
  "error": null
}
```

**Questions to Answer**:
1. What is the exact searchQuery being sent?
2. Is there an error message?
3. Are results empty or is results field missing?

---

## Step 2: Check API Credentials

### Environment Variable
```bash
echo $GOLFCOURSE_API_KEY
```

**Expected**: Non-empty API key value

**If missing**:
```bash
# Check .env files
ls -la /vercel/share/.env*
cat /vercel/share/.env.project | grep GOLFCOURSE
```

**If present but seems wrong**:
- Verify key format (usually starts with specific prefix)
- Check key hasn't expired
- Verify key is for correct API environment

### In Code
Check that CourseIntelligenceService loads the key:
```typescript
// lib/services/course-intelligence-service.ts
const apiKey = process.env.GOLFCOURSE_API_KEY
if (!apiKey) {
  throw new Error("GOLFCOURSE_API_KEY not set")
}
```

**Expected**: Code throws error if key missing (which would be caught)

---

## Step 3: Examine Search Method Implementation

### File Location
`lib/services/course-intelligence-service.ts`

### Check searchCourses() Method
```typescript
async searchCourses(
  courseName: string,
  city?: string,
  state?: string,
  country?: string
): Promise<GolfCourse[]> {
  // What does this do?
}
```

**Questions**:
1. Does method call external API?
2. Or does it do something local?
3. Are parameters used in API query?
4. How is response parsed?

### Example of What Could Be Wrong
```typescript
// ❌ WRONG: Always returns empty
async searchCourses() {
  return []  // Silent failure!
}

// ❌ WRONG: Parameters ignored
async searchCourses() {
  const query = "/search?name=hardcoded"  // Not using courseName!
}

// ❌ WRONG: Response field extraction wrong
const results = response.data.courses || []  // But API returns response.results
```

---

## Step 4: Trace API Call

### Add Logging

Create a test script to trace the search:

```typescript
// scripts/test-golf-search.ts
import { CourseIntelligenceService } from "@/lib/services/course-intelligence-service"

async function testSearch() {
  const service = new CourseIntelligenceService()
  
  console.log("[v0] Starting search...")
  const results = await service.searchCourses(
    "Pebble Beach Golf Links",
    "Pebble Beach",
    "CA",
    "USA"
  )
  
  console.log("[v0] Results:", JSON.stringify(results, null, 2))
  console.log("[v0] Result count:", results.length)
}

testSearch().catch(err => {
  console.error("[v0] Error:", err)
  process.exit(1)
})
```

Run it:
```bash
cd /vercel/share/v0-project && npx tsx scripts/test-golf-search.ts
```

**What to look for**:
- Any error messages?
- How many results?
- What fields do results have?

---

## Step 5: Test API Directly

### Using curl

```bash
# First, verify API key
API_KEY=$(cat /vercel/share/.env.project | grep GOLFCOURSE_API_KEY | cut -d= -f2)

# Try search
curl -X GET "https://api.golfcourseapi.com/v1/courses/search" \
  -H "Authorization: Bearer $API_KEY" \
  -H "X-API-Key: $API_KEY" \
  -d "name=Pebble%20Beach&city=Pebble%20Beach&state=CA"
```

**What to look for**:
- 200 OK or error status?
- Response has results field?
- Results array has items?
- Field names match what code expects?

### Check API Documentation

The GolfCourseAPI documentation should specify:
- Endpoint URL
- Authentication method
- Query parameters
- Response format
- Rate limits

**Common issues**:
- ❌ Using Bearer token but API expects X-API-Key header
- ❌ Using query params but API expects request body
- ❌ Using field names that don't exist in API

---

## Step 6: Check Response Format

### Expected Response Structure

If API is working, response should look like:
```json
{
  "results": [
    {
      "id": 12345,
      "name": "Pebble Beach Golf Links",
      "city": "Pebble Beach",
      "state": "California",
      "country": "United States",
      "lat": 36.5629,
      "lng": -121.9494
    }
  ]
}
```

### What Code Probably Does

```typescript
const results = response.results || response.data || []
```

**Questions**:
1. What field does API actually return results under?
2. Is code looking in the right field?
3. Should it be response.results.courses?
4. Should it be response.data.items?

### If Results Are Paginated

API might return:
```json
{
  "page": 1,
  "pageSize": 20,
  "totalCount": 100,
  "data": [...]
}
```

**Code probably**:
```typescript
const results = response.data  // ✅ Correct
// vs
const results = response.results  // ❌ Wrong
```

---

## Step 7: Verify Search Query Format

### What SportsDataIO Course Names Look Like

Sample courses that need matching:
- "Rhode Island Country Club"
- "Westwood Golf Course"
- "Muni at Harbor View"
- "St Andrews Golf Club"

### What Search Query Is Sent

From diagnostic endpoint, you'll see:
```
searchQuery: "Rhode Island Country Club"
```

### What API Expects

Check API docs for format:
```
GET /search?name=Rhode+Island&city=Providence&state=RI
```

**Common issues**:
- ❌ Sending full name "Rhode Island Country Club" when API expects just "Rhode Island"
- ❌ Not encoding spaces (should be + or %20)
- ❌ Sending state abbreviation but API expects full name
- ❌ Sending parameters as POST body instead of query string

---

## Step 8: Check for Error Handling Issues

### Silent Failures

Code might be catching errors and returning []:
```typescript
try {
  const response = await api.search(...)
  return response.data || []
} catch (error) {
  console.error("Search failed but silent:", error)
  return []  // ❌ Returns empty instead of throwing!
}
```

**To find**:
- Search for `catch` blocks that don't rethrow
- Look for error logs in application
- Check if error is logged to file

### Missing Implementation

Code might not be implemented at all:
```typescript
// ❌ Just a stub!
async searchCourses() {
  // TODO: Implement search
  return []
}
```

---

## Step 9: Hypothesis Evaluation Checklist

Based on diagnostic output, check:

### Hypothesis A: API Key Invalid
- [ ] GOLFCOURSE_API_KEY environment variable is set
- [ ] Value is non-empty
- [ ] Value matches documentation format
- [ ] Key is not expired
- [ ] Diagnostic shows authentication error

### Hypothesis B: Query Format Wrong
- [ ] Diagnostic shows exact query sent
- [ ] Compare query to API documentation
- [ ] Check parameter names match
- [ ] Check encoding (spaces, special chars)

### Hypothesis C: Response Parsing Wrong
- [ ] Get raw API response (use curl)
- [ ] Compare to code expectations
- [ ] Check field names match
- [ ] Check nested object structure

### Hypothesis D: Courses Not In API
- [ ] Search API directly with test course names
- [ ] Check API documentation for coverage
- [ ] Sample 5 courses and verify they exist
- [ ] Consider using different API or data source

### Hypothesis E: Search Not Implemented
- [ ] Check searchCourses() is not just returning []
- [ ] Verify it calls external API or database
- [ ] Add logging to confirm it's called
- [ ] Check for early returns or stub code

---

## Step 10: Fix Prioritization

Once you identify the issue, fix in this order:

### Priority 1: API Key / Credentials
If issue is auth:
1. Verify key is set correctly
2. Test API directly with curl
3. Update code to use correct auth method

### Priority 2: Query Format
If issue is parameter format:
1. Check API documentation
2. Update CourseIntelligenceService to send correct format
3. Test with curl first
4. Then re-run orchestration

### Priority 3: Response Parsing
If issue is extraction:
1. See what API actually returns (curl)
2. Update code to extract from correct fields
3. Handle nested structures correctly
4. Test with logging

### Priority 4: Data Coverage
If issue is courses not in API:
1. Sample what courses ARE in API
2. Determine if alternatives exist
3. Consider data enrichment strategy
4. Plan for unmatchable courses

### Priority 5: Implementation
If search not implemented:
1. Implement searchCourses() properly
2. Test with direct API calls
3. Verify results structure
4. Re-run orchestration

---

## Success Indicators

After fix, re-run diagnostic and expect:

✅ Candidates returned for most tournaments
✅ Confidence scores > 0 for many
✅ Some matches above 50% threshold
✅ Diagnostic shows actual API results

---

## Do Not

❌ Modify matching algorithm
❌ Change normalization
❌ Adjust thresholds
❌ Populate location data
❌ Add suffixes or abbreviations

**Focus only on fixing the search operation.**

---

## Time Estimate by Category

- **Auth/Credentials**: 5 minutes to diagnose, 5 minutes to fix
- **Query Format**: 15 minutes to diagnose, 30 minutes to fix
- **Response Parsing**: 20 minutes to diagnose, 15 minutes to fix
- **Data Coverage**: 30 minutes to assess, 1-2 hours to address
- **Implementation**: 30 minutes to diagnose, 1-2 hours to implement

Once diagnosed, fix should take < 1 hour in most cases.

---

## Resources

- **Diagnostic Endpoint**: GET /api/admin/diagnostic/matching-engine
- **Service**: lib/services/course-intelligence-service.ts
- **Orchestration**: lib/imports/tournament-course-mapping-orchestration.ts
- **API Docs**: Check GOLFCOURSE_API documentation (not in repo)

---

**Diagnosis Report**: PHASE_13_3B_MATCHING_DIAGNOSIS_REPORT.md
**Status**: Ready to identify and fix search infrastructure
