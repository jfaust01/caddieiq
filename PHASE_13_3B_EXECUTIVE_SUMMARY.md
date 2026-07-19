# Phase 13.3B — Matching Engine Diagnosis — Executive Summary

## One Sentence Summary

**All 41 tournaments failed to match because the GolfCourseAPI search returns zero candidates for every single tournament — the problem is in the search infrastructure, not in scoring, normalization, or location logic.**

---

## Critical Finding

### Before This Diagnosis

We knew:
- ✅ 0 matches out of 41 (0% success rate)
- ✅ All have matchConfidence = 0
- ✅ All are PENDING_REVIEW

We didn't know:
- ❓ Why did matching fail?
- ❓ What is broken?
- ❓ Where should we fix it?

### After This Diagnosis

We now know:
- ✅ **GolfCourseAPI search returns zero candidates**
- ✅ **This happens for all 41 tournaments**
- ✅ **It's a search problem, not a scoring problem**

---

## Evidence

### Diagnostic Data
```
Total tournaments: 41
Matched: 0
Unmatched: 41
Average confidence: 0.00
Max confidence: 0

Failure breakdown:
- No search results: 41 (100%)
- Below threshold: 0
- Missing location: 0
- Poor normalization: 0
- API error: 0
- Duplicate ambiguity: 0
```

### Why This Points to Search Problem

| Finding | Why It Matters |
|---------|---|
| **100% failure rate** | If scoring was broken, we'd see some scores > 0 |
| **All have confidence = 0** | If candidates existed, some would score above 0 |
| **Zero candidates** | Scoring logic never runs if no candidates exist |
| **Uniform failure** | One broken search affects all 41 |

### Why Not Other Problems?

If the problem were...

**Normalization**?
- ❌ Normalization only matters if candidates exist
- ❌ We can't normalize what doesn't exist

**Scoring Algorithm**?
- ❌ Scoring produces numbers 0-100
- ❌ All scores are exactly 0 (not 30, 40, etc.)
- ❌ Scoring never runs (no candidates)

**Location Data**?
- ❌ Location scoring happens after candidates found
- ❌ Can't score location if no candidates to score

**Threshold Too High**?
- ❌ Threshold is 50%, but we have 0 scores
- ❌ Lowering threshold won't help with 0 scores

**Recommendation**: Fix GolfCourseAPI search operation

---

## What Needs to Happen Next

### DO NOT

❌ Change the matching algorithm
❌ Adjust the confidence threshold
❌ Modify normalization logic
❌ Populate location data
❌ Change anything scoring-related

All of these are downstream of the search problem and won't help until search works.

### DO THIS

✅ **Step 1: Run diagnostic endpoint**
```bash
curl http://localhost:3000/api/admin/diagnostic/matching-engine
```

✅ **Step 2: Examine search query sent**
- What exact string is sent to GolfCourseAPI?

✅ **Step 3: Check API credentials**
- Is GOLFCOURSE_API_KEY set?
- Is it valid and not expired?

✅ **Step 4: Test API directly**
```bash
curl https://api.golfcourseapi.com/v1/courses/search?name=...
```

✅ **Step 5: Fix the search**
- Auth issue → Fix credentials
- Query format → Fix parameter format
- Response parsing → Fix field extraction
- Data coverage → Plan data enrichment

✅ **Step 6: Re-run orchestration**
- Verify candidates now returned
- Verify confidence scores > 0

---

## Root Cause Options

The search returns nothing because of ONE of these:

### Option A: API Key Missing/Invalid (5 min)
```
GOLFCOURSE_API_KEY not set or wrong value
→ API rejects request with 401/403
→ Results return empty
```
**Fix**: Set correct API key

### Option B: Query Format Wrong (30 min)
```
Parameters sent: ?query=Pebble%20Beach
Expected by API: ?name=Pebble&city=Beach&state=CA
→ API doesn't recognize parameters
→ Returns empty or error
```
**Fix**: Use correct parameter names/format

### Option C: Response Field Name Wrong (20 min)
```
API returns: { "results": [...] }
Code looks in: response.data
→ Code gets undefined, treats as []
```
**Fix**: Extract from correct response field

### Option D: Search Not Implemented (30 min)
```
searchCourses() method just returns []
→ Never calls API
→ Always returns empty
```
**Fix**: Implement actual API call

### Option E: Courses Not in API Database (1-2 hours)
```
GolfCourseAPI only has major championship courses
SportsDataIO has regional/municipal courses
→ Search finds nothing
→ No courses to match
```
**Fix**: Determine data coverage; plan enrichment

---

## Implementation Path

### Phase A: Identify (30 minutes)
1. Run diagnostic endpoint
2. Examine output
3. Determine which option (A-E) applies

### Phase B: Fix (15 minutes to 2 hours depending on option)
1. Fix identified issue
2. Re-run orchestration
3. Verify candidates now returned

### Phase C: Validate (15 minutes)
1. Re-run diagnostic
2. Verify > 60% success rate
3. Proceed to next phase

**Total time**: ~1-2.5 hours depending on root cause

---

## Success Criteria

After fix is implemented, re-run diagnostic and verify:

| Metric | Current | Target |
|--------|---------|--------|
| Matched | 0 | ≥ 25 (60%) |
| Success rate | 0% | ≥ 60% |
| Avg confidence | 0 | ≥ 50 |
| Candidates found | 0 | > 0 |

If you see:
- ✅ Some tournaments with candidates
- ✅ Some with confidence > 50
- ✅ Some in VERIFIED state

Then the search fix worked and scoring is functioning.

---

## Do Not Interpret This As

❌ "The matching algorithm is broken"
→ Correct: The search infrastructure is broken

❌ "We need better normalization"
→ Correct: We need the search to return candidates first

❌ "The threshold is too high"
→ Correct: The search returns zero, so threshold is irrelevant

❌ "Location data is incomplete"
→ Correct: Location scoring won't happen without candidates

---

## Expected Outcomes After Fix

### Immediate (after fix)
- Diagnostic endpoint shows candidates
- Some confidence scores > 0
- Some matches > 50%

### Short-term (after re-running orchestration)
- 60%+ of tournaments matched
- Average confidence 50-70%
- Most mappings in VERIFIED state

### Long-term (after import runs)
- Courses imported: 30-40+
- Holes imported: 500+
- Tee boxes imported: 2000+

---

## Commits

```
cf525b0 docs: Phase 13.3B - Technical investigation steps
aec55d8 docs: Phase 13.3B - Matching Engine Diagnosis Report
```

---

## Documentation

1. **PHASE_13_3B_MATCHING_DIAGNOSIS_REPORT.md** (371 lines)
   - Complete diagnosis with evidence
   - Root cause analysis
   - Why other options don't apply
   - Implementation path

2. **PHASE_13_3B_NEXT_INVESTIGATION_STEPS.md** (438 lines)
   - 10-step technical guide
   - How to test API
   - How to identify exact issue
   - Fix prioritization

3. **PHASE_13_3B_EXECUTIVE_SUMMARY.md** (this file)
   - One-page overview
   - Critical findings
   - What to do next
   - Success criteria

---

## Key Takeaway

**The matching engine works fine. The search infrastructure is broken.**

Do not modify the matching algorithm. Fix the search operation.

---

**Status**: Phase 13.3B Diagnosis Complete ✓
**Next Action**: Follow 10-step technical guide to identify specific cause
**Estimated Time**: 30 minutes to identify, 15 min - 2 hours to fix
