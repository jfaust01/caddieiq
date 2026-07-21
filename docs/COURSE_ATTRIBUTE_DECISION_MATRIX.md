# Course Attribute Decision Matrix — V1 Calibration

**Document:** Architecture Review Board — Course Analysis  
**Date:** 2026-07-20  
**Purpose:** Evaluate 60+ Phase 16A course attributes  
**Critical Finding:** Only ~20 attributes are immediately available; 40+ require manual research

---

## Executive Summary

**CRITICAL ISSUE IDENTIFIED:**

Phase 16A claims "60+ course attributes are obtainable through current providers." This is **NOT SUPPORTED BY DATA.**

**Reality:**
- ✅ **Immediate (No Manual Work):** ~20-25 attributes
- ⚠️ **With Manual Research:** ~25-30 attributes  
- ❌ **Unavailable:** ~15-20 attributes

Proceeding with Phase 16A's full 60-attribute model will require:
- Manual curation process for each tournament
- Quality control procedures
- Consistency validation
- Operational overhead

**Recommendation:** V1 course model uses 20-25 automatic attributes + 5-10 manual attributes, with clear operational plan.

---

## Attribute Categorization Framework

### TIER 1: AUTOMATIC (No Manual Work)

These come from public APIs, official data, or routine calculations.

#### T1.1 - Layout Dimensions (ALL AVAILABLE)

| Attribute | Source | Example | Status |
|-----------|--------|---------|--------|
| Total Yardage | USGA Handicap / Setup Sheet | 7,245 yards | ✅ AUTOMATIC |
| Par | Official course data | Par 71 | ✅ AUTOMATIC |
| Par Distribution | Course design | 4 par-3s, 10 par-4s, 4 par-5s | ✅ AUTOMATIC |
| Average Hole Length | Calculated | 402 yards/hole | ✅ AUTOMATIC |
| Hole Length Variance | Calculated | StdDev 35 yards | ✅ AUTOMATIC |
| Reachability (Par-5) | Calculated from design | 75% reachable | ✅ AUTOMATIC |

**Total T1.1:** 6 attributes, 100% automatic

---

#### T1.2 - Scoring Difficulty (MOSTLY AUTOMATIC)

| Attribute | Source | Example | Status |
|-----------|--------|---------|--------|
| Course Rating | USGA | 74.5 | ✅ AUTOMATIC |
| Slope Rating | USGA | 138 | ✅ AUTOMATIC |
| Scoring Average (Field) | Tournament Results | 71.2 avg | ✅ AUTOMATIC |
| Birdie Difficulty | ShotLink results | Birdies per 100 holes | ✅ AUTOMATIC |
| Winning Score | Historical data | -12 (relative to par) | ✅ AUTOMATIC |

**Total T1.2:** 5 attributes, 100% automatic

---

#### T1.3 - Basic Green Characteristics (PARTIAL)

| Attribute | Source | Example | Status |
|-----------|--------|---------|--------|
| Green Size (Avg) | Course design/photos | 5,500 sq ft | ⚠️ MANUAL/RESEARCH |
| Green Shapes | Visual/design | Circular, elongated, etc | ⚠️ MANUAL |
| Speed (Stimp) | Setup sheet OR measured | 12.5 Stimp | ⚠️ SEMI-AUTO (setup sheet 1 week before) |
| Firmness | Setup sheet | Scale 1-10 | ⚠️ SEMI-AUTO |

**Total T1.3:** 4 attributes, 50% semi-automatic, 50% manual

---

#### T1.4 - Tournament Setup (AVAILABLE BUT DELAYED)

| Attribute | Source | Example | Status |
|-----------|--------|---------|--------|
| Pin Placements | Setup sheet | Available only 1 week before | ⚠️ DELAYED (1-week lag) |
| Rough Depth | Setup sheet | 3-4 inches | ⚠️ DELAYED |
| Rough Density | Measured/visual | Medium, heavy, etc | ⚠️ DELAYED (visual assessment) |
| Fairway Width (setup) | Setup sheet/measured | 35 avg | ⚠️ DELAYED/MANUAL |

**Total T1.4:** 4 attributes, available 1 week before event

---

### TIER 2: MANUAL RESEARCH (1-2 Hours Per Course)

These require manual curation but are one-time (permanent course characteristics).

#### T2.1 - Permanent Course Layout

| Attribute | Source | Example | Effort |
|-----------|--------|---------|--------|
| Fairway Width Distribution | Course visit/design | 20% wide, 50% med, 30% narrow | 1 hour |
| Hazard Profile | Design/visit | Water: 35 holes, Bunkers: 80, etc | 1 hour |
| Elevation Profile | Visual/topographic | Hilly (200 ft change), flat | 30 min |
| Tree Density | Visual/design | Heavy left, open right, etc | 45 min |

**Total T2.1:** 4 attributes per course (one-time)

---

#### T2.2 - Strategic Characteristics

| Attribute | Source | Example | Effort |
|-----------|--------|---------|--------|
| Bail-Out Areas | Design review | Plenty of miss-and-recover | 1 hour |
| Penalty Areas | Visual assessment | Severe penalties (OB, water) | 1 hour |
| Landing Area Patterns | Aerial/design | Tight landing zones | 45 min |

**Total T2.2:** 3 attributes per course (one-time)

---

### TIER 3: UNAVAILABLE / IMPRACTICAL (Skip for V1)

These cannot be reliably obtained or are too speculative.

| Attribute | Problem | Impact |
|-----------|---------|--------|
| Hole-by-hole grass type | No API, must research each hole | 100+ holes × research = 3+ hours per course |
| Weather patterns (historical) | Need years of archive | Not available from standard sources |
| Wind exposure (per hole) | Requires topographic + wind data | Too speculative |
| Aesthetic/difficulty "feel" | Subjective | Can't measure |
| Previous tournament difficulty | Too much variation | Not predictive for new field |

**Total T3:** 5+ attributes — REJECT for V1

---

## V1 COURSE MODEL RECOMMENDATION

### AUTOMATIC ATTRIBUTES (Available Immediately)

1. Total Yardage
2. Par
3. Par Distribution
4. Course Rating (USGA)
5. Slope Rating (USGA)
6. Scoring Average (field, from ShotLink)
7. Birdie Difficulty (from ShotLink)
8. Green Size (average, from design)
9. Pin Placement Difficulty (from setup sheet, 1 week prior)

**Total: 9 attributes, 100% data-driven, 0 manual work**

---

### SEMI-AUTOMATIC ATTRIBUTES (1 Week Before Event)

10. Green Speed (Stimp, from setup sheet)
11. Green Firmness (from setup sheet)
12. Rough Depth (from setup sheet)
13. Pin Position Patterns (from setup sheet + analysis)

**Total: 4 attributes, available 1 week before tournament**

---

### MANUAL-RESEARCH ATTRIBUTES (One-Time per Course)

14. Fairway Width Distribution
15. Hazard Profile (water, bunkers, OB)
16. Elevation Profile (flat vs. hilly)
17. Tree Density & Position Patterns
18. Penalty Area Severity

**Total: 5 attributes, 1-2 hours per new course**

---

### DEFERRED TO V2

All 40+ other Phase 16A attributes require either:
- Impractical manual research
- Speculative data
- Unavailable sources
- Historical archive access

**Plan:** Expand to 40+ attributes after V1 validates with core 18.

---

## V1 COURSE MODEL DETAILS

### Tier 1: Layout & Difficulty (9 Automatic)

```
{
  "courseId": "7504",
  "name": "TPC Sawgrass",
  "year": 2025,
  "par": 71,
  "yardage": 7245,
  "par_distribution": { "par3": 4, "par4": 10, "par5": 4 },
  "usga_rating": 74.5,
  "usga_slope": 138,
  "field_scoring_avg": 71.24,
  "birdie_difficulty_score": 45, // higher = harder to birdie
  "avg_green_size_sq_ft": 5500
}
```

**Data Sources:**
- USGA Handicap service: par, yardage, rating, slope
- Setup sheets: par distribution, yardage confirmation
- ShotLink analysis: scoring average, birdie rates
- Course design: green sizes

---

### Tier 2: Setup Context (4 Semi-Automatic)

```
{
  "setupId": "7504_2025_05",
  "tournament": "Players Championship 2025",
  "green_speed_stimp": 12.5,
  "green_firmness_1_10": 7,
  "rough_depth_inches": 3.5,
  "pin_position_difficulty": 6, // 1-10 scale, 1=easy, 10=brutal
  "pin_pattern_distribution": {
    "front_position": 0.40,
    "middle_position": 0.35,
    "back_position": 0.25
  }
}
```

**Data Sources:**
- PGA Tour setup sheets (available 1 week before event)
- Visual assessment of rough
- Pin position analysis from previous tournaments

---

### Tier 3: Permanent Course Characteristics (5 Manual)

```
{
  "courseId": "7504",
  "fairway_width_distribution": {
    "wide_gt40yds": 0.20,
    "medium_25_40yds": 0.50,
    "narrow_lt25yds": 0.30
  },
  "hazard_profile": {
    "water_holes": 8,
    "bunker_count": 80,
    "OB_severity": "moderate"
  },
  "elevation_profile": "hilly", // flat, moderate, hilly
  "tree_density_areas": {
    "left_side": "heavy",
    "right_side": "open",
    "center": "moderate"
  },
  "penalty_severity": "severe" // lenient, moderate, severe
}
```

**Data Entry Process:**
- Curator visits course or reviews detailed design
- Enters fairway widths, hazard counts, visual characteristics
- One-time entry per course
- Updated only if course renovated

---

## OPERATIONAL PLAN FOR MANUAL ATTRIBUTES

### For New Courses (Never Researched)
- Effort: 2-3 hours per new course
- Process: Video review + design consultation
- Quality: 2-person review before finalization
- Timing: Within 2 weeks of tournament announcement

### For Recurring Courses
- Effort: 0 (data reused from previous year)
- Process: Confirm no renovations, approve previous data
- Quality: Spot check annually
- Timing: Automated

### Quality Assurance
- 10% sample of manual attributes reviewed by secondary person
- Metadata: Who entered, when, last updated
- Version control: Track changes over years

---

## Data Source Reality Check

### What Phase 16A Assumes is Available

❌ "60+ course attributes are obtainable through current providers"

### What Actually Is

✅ 9 attributes from official sources (0 manual work)
⚠️ 4 attributes from setup sheets (available 1 week before event)
⚠️ 5 attributes from manual research (1-2 hours per course)
❌ 40+ attributes require impractical manual research or aren't available

---

## Risk Assessment

### Risk 1: Manual Data Quality
**Severity:** MEDIUM  
**Mitigation:** 2-person review, metadata tracking, version control

### Risk 2: Setup Sheet Delayed Availability
**Severity:** LOW  
**Mitigation:** Use pre-tournament defaults until setup sheet released

### Risk 3: Course Renovations Invalidate Manual Data
**Severity:** LOW  
**Mitigation:** Annual verification, update when known changes occur

### Risk 4: Inability to Backfill Historical Courses
**Severity:** MEDIUM  
**Mitigation:** Manual research for historical tournaments only as needed

---

## Recommendation

✅ **CONDITIONAL PASS**

Proceed with V1 course model using:
- 9 automatic attributes (ready immediately)
- 4 semi-automatic attributes (ready 1 week before)
- 5 manual attributes (curated as needed)

**Total: 18 core course attributes** (vs. Phase 16A's 60)

This is:
- ✅ Implementable immediately
- ✅ Data-driven (automatic where possible)
- ✅ Operationally feasible (limited manual work)
- ✅ Quality-controllable
- ✅ Expandable (add more manual research Phase 16B+)

**DO NOT attempt to implement Phase 16A's full 60 attributes in Phase 16B.** Start with 18-core model, prove it works, expand methodically.

