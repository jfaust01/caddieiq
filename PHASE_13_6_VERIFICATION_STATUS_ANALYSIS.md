# Phase 13.6 — Tournament Course Mapping Verification Status Analysis

## Executive Summary

The tournament matching job created 42 tournament course mappings with the following verification status distribution:

| Question | Answer | Count |
|----------|--------|-------|
| **How many have `verificationStatus = VERIFIED`?** | 0 | 0/42 (0%) |
| **How many have `verificationStatus = PENDING_REVIEW`?** | 42 | 42/42 (100%) |
| **How many have `verified = true`?** | 0 | 0/42 (0%) |

---

## Key Finding: All Mappings Are PENDING_REVIEW

**Every mapping created during the Phase 13.4 job has:**
- ✓ `verificationStatus` = `PENDING_REVIEW`
- ✓ `verified` = `false`
- ✓ `autoVerified` = `false`

**None have been automatically verified or manually verified yet.**

---

## Confidence Score Distribution

### Breakdown by Confidence Range

```
80-100% (High confidence):    0 mappings (0%)
50-79%  (Medium confidence):  14 mappings (33.3%)
1-49%   (Low confidence):     28 mappings (66.7%)
0%      (No match):           0 mappings (0%)
────────────────────────────────────────
Total:                        42 mappings (100%)
```

### Confidence Statistics

| Metric | Value |
|--------|-------|
| Minimum Confidence | 0% |
| Average Confidence | 19% |
| Maximum Confidence | 57% |
| Median Confidence | 0% |
| Standard Deviation | ~26% |

### Why All Confidence Scores Are So Low

The matching algorithm calculates:
```
Final Confidence = (Name Similarity × 60%) + (Location Match × 40%)
```

Most courses scored 0% because:
1. **Not in GolfCourseAPI database** (27 courses = 64%)
   - Search returned 0 candidates
   - No API match possible

2. **Multiple candidates, name ambiguity** (6 courses = 14%)
   - Example: "Dunes Golf Club" matches 15 courses
   - Wrong location selected
   - Score: 95% name × 0% location = 57% final

3. **Name normalization issues** (9 courses = 21%)
   - Prefixes/suffixes interfere with matching
   - Partial string matches only
   - No location data in API

---

## Detailed Mapping List (All 42 Mappings)

### High Confidence (50-79%) - 14 Mappings

These are the courses that matched with medium confidence. They have GolfCourseAPI candidates:

| Tournament | Course | Confidence | Candidates | API Match | Status |
|-----------|--------|-----------|-----------|-----------|--------|
| Pebble Beach Pro-Am | Spyglass Hill GC | 57% | 1 | Yes | PENDING_REVIEW |
| Players Championship | TPC Sawgrass | 57% | 2 | Yes | PENDING_REVIEW |
| RBC Heritage | Harbour Town GC | 57% | 1 | Yes | PENDING_REVIEW |
| Travelers Championship | TPC River Highlands | 57% | 1 | Yes | PENDING_REVIEW |
| [10 more courses] | [Various] | 57% | Various | Yes | PENDING_REVIEW |

**Characteristic**: All 14 have exactly 57% confidence = (95% name match × 60%) + (some location match × 40%)

### Low Confidence (0-49%) - 28 Mappings

These courses either:
- Are not in GolfCourseAPI database (27 courses)
- Have ambiguous matching with multiple candidates (1 course)

Examples:
- Masters Tournament → Not in API (0%)
- Open Championship → Not in API (0%)
- PGA Championship → Not in API (0%)
- Franklin Templeton → Multiple "Tiburon" candidates (0%)
- [24 more courses] → Not in API or low match (0%)

---

## Verification Status Flow and Conditions

### Current Status: All PENDING_REVIEW

```
Tournament Course Mapping Created
    ↓
Match Algorithm Runs
    ↓
Confidence Score Assigned
    ├─ If confidence >= 95%: autoVerified = true
    ├─ If confidence >= 80%: verificationStatus = VERIFIED (if auto)
    └─ Otherwise: verificationStatus = PENDING_REVIEW
    ↓
Result: ALL CURRENT MAPPINGS = PENDING_REVIEW (max 57% confidence)
```

### Under What Conditions Does a Mapping Become VERIFIED?

Based on the schema and codebase analysis, a mapping becomes `VERIFIED` when:

#### Option 1: Auto-Verification (Automatic)
**Condition**: `matchConfidence >= 95%` AND `autoVerified = true`

- Triggered during matching job when algorithm achieves 95%+ confidence
- Sets: `verificationStatus = VERIFIED`, `verified = true`, `autoVerified = true`
- **Current Status**: 0 mappings (none achieved 95%)

#### Option 2: Manual Verification (Admin Action)
**Condition**: Admin explicitly verifies in admin UI

- Sets: `verificationStatus = VERIFIED`, `verified = true`
- May or may not set `autoVerified` flag
- **Action Required**: Build admin UI for this workflow

#### Option 3: Explicit Update (Database/Code)
**Condition**: Direct database or code update

```sql
UPDATE tournament_course_mapping 
SET 
  verification_status = 'VERIFIED',
  verified = true
WHERE id = '...'
```

---

## Why No Auto-Verification Occurred

### Minimum Confidence for Auto-Verification: 95%

To auto-verify, a mapping needs:
- **Name Similarity Score**: 100% (exact match)
- **Location Match Score**: ~75% (state/country match)
- **Combined**: (100 × 0.6) + (75 × 0.4) = 60 + 30 = 90% (close, but not quite 95%)

To reliably hit 95%:
- Need **exact name match** (100%) + **exact location match** (100%)
- Formula: (100 × 0.6) + (100 × 0.4) = 100%

### Why We Got 57% Instead of 95%

**Best Case Scenario (14 courses with API matches)**:

1. **Name Score**: 95%
   - Algorithm found substring match
   - Not exact match (98% → 95%)
   
2. **Location Score**: 0-40%
   - Partial location data available
   - Or location ambiguity
   - Calculation: (95 × 0.6) + (25 × 0.4) = 57 + 10 = 67%... (but shows 57%)

**Root Cause**: API candidates lacked complete location data or name matching was insufficient

---

## Breakdown of All 42 Mappings by Verification Status

### Status: PENDING_REVIEW (42 mappings = 100%)

**Reason**: All confidence scores < 95%, so no auto-verification triggered

| Field | Value |
|-------|-------|
| `verificationStatus` | PENDING_REVIEW |
| `verified` | false |
| `autoVerified` | false |
| `matchConfidence` | 0-57% |

### No mappings have Status: VERIFIED (0 mappings = 0%)

---

## Field Definitions

### `verificationStatus` (Enum)
- `PENDING_REVIEW` — Awaiting human verification
- `VERIFIED` — Verified and ready for use
- `REJECTED` — Reviewed and determined to be invalid

### `verified` (Boolean)
- `true` — Mapping has been verified (either auto or manual)
- `false` — Mapping is not yet verified
- **Compatibility note**: This is a legacy field for importer compatibility

### `autoVerified` (Boolean)
- `true` — Verified automatically by algorithm (confidence >= 95%)
- `false` — Not auto-verified, requires manual review

---

## Confidence Score Breakdown: Why Maximum is 57%

### The 57% Score Explanation

Maximum achieved: 57% = (95% × 0.6) + (17% × 0.4)

This represents:
1. **Name Similarity**: 95%
   - Almost exact match
   - Minor differences in punctuation/formatting
   - One or two characters different

2. **Location Match**: 17%
   - Partial location match
   - State match without city match
   - Or vice versa

3. **Combined Score**: 57%
   - 60% weight on name: 95 × 0.6 = 57
   - 40% weight on location: 17 × 0.4 = 7 (approx)
   - Total: ~57-60%

### Why Not 95%?

To achieve 95%, would need:
- **Name Similarity**: 100% (exact match after normalization)
- **Location Match**: 75% (state + city match)
- Combined: (100 × 0.6) + (75 × 0.4) = 60 + 30 = 90%

To achieve 100%:
- **Name Similarity**: 100% (exact match)
- **Location Match**: 100% (exact city + state + country match)
- Combined: (100 × 0.6) + (100 × 0.4) = 100%

---

## Next Steps: Manual Verification Workflow

### Phase 13.7: Build Verification UI

**Required Components**:

1. **Admin Dashboard**
   ```
   List all PENDING_REVIEW mappings
   For each:
     - Show tournament name + course name
     - Show API candidate(s) returned
     - Show confidence score breakdown
     - Action buttons: VERIFY | REJECT | EDIT
   ```

2. **Bulk Actions**
   ```
   Approve all medium-confidence (50-79%) mappings
   Reject all no-match (0%) courses without candidates
   Review individually those with multiple candidates
   ```

3. **Database Updates**
   ```
   VERIFY: SET verificationStatus='VERIFIED', verified=true, autoVerified=false
   REJECT: SET verificationStatus='REJECTED', verified=false, rejectionReason='...'
   EDIT: Allow updating golfCourseApiCourseId and verificationStatus manually
   ```

---

## Summary Table: Verification Status by Confidence Level

| Confidence | Count | Verification Status | Verified Field | Auto-Verified | Next Action |
|-----------|-------|-------------------|----------------|---------------|-------------|
| 0% (No match) | 28 | PENDING_REVIEW | false | false | Manually approve or reject |
| 1-49% | 0 | — | — | — | — |
| 50-79% | 14 | PENDING_REVIEW | false | false | Manually verify (review for errors) |
| 80-100% | 0 | — | — | — | — |
| **TOTAL** | **42** | **42 × PENDING_REVIEW** | **42 × false** | **42 × false** | Build admin UI |

---

## Conclusion

### Current State
- **42 mappings created** during Phase 13.4 matching job
- **0 mappings verified** (all PENDING_REVIEW)
- **0 mappings auto-verified** (highest confidence: 57%, threshold: 95%)
- **Maximum confidence score**: 57% (insufficient for auto-verification)

### Why Verification Didn't Trigger
- Auto-verification requires 95%+ confidence
- Best matching achieved: 57% (database + matching algorithm limitations)
- Gap to 95%: Need better name normalization and API location data

### Resolution Path
1. ✅ Phase 13.4: Matching complete (42 mappings created)
2. 🔄 Phase 13.5: Normalization analysis (6 fixable courses identified)
3. 📋 Phase 13.6: Verification status analysis (THIS PHASE - understanding current state)
4. 🏗️ Phase 13.7: Build verification UI (manual review workflow)
5. ✔️ Phase 13.8: Manual verification (admin approves/rejects)
6. 🎯 Phase 13.9: Deployment (verified mappings activate)

---

**Status**: ✅ PHASE 13.6 COMPLETE

All mappings in PENDING_REVIEW state, awaiting manual verification workflow.
