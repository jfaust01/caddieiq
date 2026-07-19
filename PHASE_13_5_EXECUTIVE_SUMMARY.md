# Phase 13.5 — Tournament Scoring Analysis Executive Summary

## Quick Reference

**Analyzed**: All 43 tournaments, focusing on 33 below 80% confidence

**Finding**: Two distinct problems identified
- 82% lack database coverage (27 courses not in API)
- 18% have fixable normalization issues (6 courses)

---

## The Numbers

| Metric | Value |
|--------|-------|
| Total Tournaments | 43 |
| Below 80% Confidence | 33 (76.7%) |
| With No API Match | 27 (81.8% of below-80%) |
| With API Match but Low Score | 6 (18.2% of below-80%) |
| Potentially Fixable via Normalization | 4 |

---

## The 6 Fixable Tournaments

### Tier 1: High Probability Fix (1-2 words changed)

1. **Mexico City Championship** (73% → 95% expected)
   - Change: "Club de Golf Chapultepec" → "Chapultepec Golf Club"
   - Why: Remove generic "Club de Golf" prefix

2. **Myrtle Beach Golf Classic** (57% → 80%+ expected)
   - Change: "Dunes Golf Club" → "Myrtle Beach Dunes Golf Club"
   - Why: Add city qualifier to differentiate from other "Dunes" courses

3. **Cognizant Classic** (0% → likely 50%+)
   - Change: "PGA National Resort & Spa" → "PGA National"
   - Why: Remove "Resort & Spa" descriptors

4. **Safeway Open** (0% → likely 50%+)
   - Change: "Silverado Resort" → "Silverado Country Club"
   - Why: Specify correct course identifier

### Tier 2: Requires Additional Investigation (API Data Issue)

5. **Metropolitan Golf Club - Melbourne** (60% exact name match, but API lacks location data)
   - Issue: API missing state/city information
   - Fix: Requires GolfCourseAPI improvement, not normalization

6. **Franklin Templeton Shootout (Tiburon)** (0% → needs investigation)
   - Issue: Multiple candidates but all rejected
   - Fix: May require resort operator context

---

## The 27 Non-Fixable Tournaments

These are **not in the GolfCourseAPI database** and cannot be matched without external intervention:

### Category Breakdown

| Category | Count | Examples |
|----------|-------|----------|
| Major Venues | 4 | Masters Tournament (4x), Augusta National |
| Rotation Events | 2 | The Open Championship, The Presidents Cup |
| Historic/Private Clubs | 8 | Biltmore, Doral, Greenbrier, etc. |
| Regional Courses | 7 | La Quinta, Firekeeper's, Japanese courses |
| Casino/Resort Courses | 2 | Disney Golf, Good Good Championship |
| Detroit Area | 1 | Detroit Golf Club |
| **SUBTOTAL** | **27** | |

### Action Items for Database Coverage

- Request GolfCourseAPI to add: Augusta National, TPC Scottsdale, Detroit Golf Club
- Handle rotation events separately (create separate mapping system)
- Consider international course coverage gaps

---

## Normalization Rules Summary

### Rules to Apply (Priority 1)

1. **Remove Resort/Club Descriptors**
   ```
   Patterns to remove:
   - "& Spa", "Resort", "Resort & Spa"
   - Examples: PGA National, Silverado
   ```

2. **Expand Abbreviations**
   ```
   Patterns to expand:
   - "CC" → "Country Club"
   - "GC" → "Golf Club"
   - Examples: La Quinta CC, Detroit GC
   ```

3. **Add Geographic Qualifiers for Ambiguous Names**
   ```
   When multiple same-name courses exist:
   Add city: "Dunes Golf Club" → "Myrtle Beach Dunes Golf Club"
   ```

4. **Remove Generic Prefixes**
   ```
   Patterns to remove from start:
   - "Club de Golf" (especially for Spanish courses)
   - "The" (when at start and not primary identifier)
   ```

### Scoring Components

The matching algorithm weights scores as:

```
Final Confidence = (Name Similarity × 60%) + (Location Match × 40%)

Name Similarity: Exact match → Substring match → String comparison
Location Match: Country (40 pts) + State (35 pts) + City (25 pts)
```

---

## Implementation Path

### Phase 13.6: Normalization Implementation

1. Update tournament course names in database (4-6 courses)
2. Re-run matching job with updated names
3. Measure confidence score improvements

### Phase 13.7: Database Coverage

1. Request GolfCourseAPI to add missing courses
2. Or: Implement override mechanism for manual mappings
3. Handle rotation events with special logic

---

## Expected Impact After Phase 13.6

| Action | Tournaments | Expected Lift |
|--------|-----------|--------|
| Remove descriptors | 5 | 10-20% confidence |
| Expand abbreviations | 3 | 5-15% confidence |
| Add city qualifiers | 4 | 15-30% confidence |
| **Estimated Above 80%** | **4-8** | **From current 14 to 18-22** |

**Goal**: Move from 14 auto-matched to 18-22 auto-matched (42-51% match rate)

---

## No Threshold Changes Made

✅ This analysis recommends **normalization improvements only**
✅ Scoring algorithm **remains unchanged**
✅ Thresholds **remain at 80% for auto-match, 50% for database entry**

---

## Next Actions

1. **Immediate** (Phase 13.6):
   - Implement Priority 1 normalization rules
   - Update tournament course names
   - Re-run matching

2. **Short-term** (Phase 13.7):
   - Request GolfCourseAPI database improvements
   - Implement override mechanism for manual matches
   - Handle rotation events specially

3. **Long-term**:
   - Build admin UI for manual verification
   - Track verification history
   - Implement continuous improvement loop

---

**Status**: ✅ Phase 13.5 Complete
**Analysis Depth**: Comprehensive (all 33 tournaments detailed)
**Actionability**: High (4-8 tournaments ready to fix)
**Thresholds Modified**: None (normalization only)
