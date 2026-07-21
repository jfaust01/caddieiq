# Signal Dependency and Double-Counting Review

**Document:** Architecture Review Board — Critical Analysis  
**Date:** 2026-07-20  
**Finding:** Multiple overlapping signals identified; recommend deduplification

---

## Executive Summary

Phase 16A proposes 50+ player attributes and 60+ course attributes. **Analysis reveals significant overlapping signals that create double-counting if included simultaneously.**

**Examples:**
- SG:Approach + Proximity (same golfer-green interaction)
- Driving Distance + Dispersion (both measure tee consistency)
- SG:Short Game + Sand Save % (sand is component of short game)
- Recent Form + Recent SG (same performance window)

**Recommendation:** Remove duplicate signals for V1, use cleaned signal set.

---

## Signal Dependency Map

### Cluster 1: Driving Skill

```
┌─────────────────────────────────┐
│    Driving Skill Cluster        │
├─────────────────────────────────┤
│ Driving Distance (PRI)          │ Primary signal
│   ├─ Dispersion (DUP)           │ Derived from distance variance
│   └─ Power (SAME)               │ Distance IS power
│ Driving Accuracy (PRI)          │ Primary signal
│   ├─ Fairways Hit (SAME)        │ Same measurement
│   └─ Driving Discipline (DUP)   │ Depends on course, not player
│ SG:OTT (ALT)                    │ Alternative primary signal
│   └─ Combines distance + acc    │ Use instead of components
└─────────────────────────────────┘

RECOMMENDATION:
Use ONE primary (SG:OTT preferred) instead of distance + accuracy + dispersion
```

---

### Cluster 2: Approach/Iron Skill

```
┌──────────────────────────────────┐
│   Approach Skill Cluster         │
├──────────────────────────────────┤
│ SG:Approach (PRI)                │ Primary signal
│   ├─ Proximity (DUP)             │ Derived from same shots
│   ├─ Proximity Buckets (DUP)     │ Over-specification
│   └─ Proximity by Distance (DUP) │ Severe over-spec
│ Iron Accuracy (ALT)              │ Alternative name for SG:App
└──────────────────────────────────┘

RECOMMENDATION:
Use SG:Approach ONLY. Report proximity in explanations, not scoring.
```

---

### Cluster 3: Short Game / Recovery

```
┌──────────────────────────────────┐
│   Short Game Cluster             │
├──────────────────────────────────┤
│ SG:Short Game (PRI)              │ Primary signal
│   ├─ Sand Save % (DUP)           │ Component of SG:SG
│   ├─ Pitch/Chip Proximity (DUP)  │ Included in SG:SG
│   └─ Scrambling Rate (ALT)       │ Related but distinct
│ SG:ARG (ALT)                     │ Alternative: All recovery
│   └─ Includes sand + everything  │ Use this instead
│ Recovery Specialist (DUP)        │ Same as SG:ARG
└──────────────────────────────────┘

RECOMMENDATION:
Use SG:Short Game + SG:ARG (two recovery buckets) or SG:ARG only (if preferred).
Do NOT use sand-specific metrics alongside SG:Short Game.
```

---

### Cluster 4: Putting

```
┌──────────────────────────────────┐
│   Putting Cluster                │
├──────────────────────────────────┤
│ SG:Putting (PRI)                 │ Primary signal
│   ├─ Long Putting % (DUP)        │ Component of SG:Putting
│   ├─ Short Putting % (DUP)       │ Component of SG:Putting
│   ├─ Grass-Specific (DUP)        │ No data source, rejected
│   ├─ Speed Adaptation (DUP)      │ Assumed, not measured
│   └─ Consistency (DUP)           │ Variance, use separately
└──────────────────────────────────┘

RECOMMENDATION:
Use SG:Putting ONLY for putting skill. 
Putting consistency/variance handled separately in volatility profile.
```

---

### Cluster 5: Form & Momentum

```
┌──────────────────────────────────┐
│   Form/Momentum Cluster          │
├──────────────────────────────────┤
│ Recent Form (PRI)                │ Last 10 rounds performance
│   ├─ Recent SG Breakdown (DUP)   │ Same time window
│   ├─ Recent Scoring Avg (DUP)    │ Same measurement
│   └─ Hot Streak (DUP)            │ Derived from form
│ Career Average (BASELINE)        │ Long-term baseline
│ Momentum (ALT)                   │ Trajectory analysis
└──────────────────────────────────┘

RECOMMENDATION:
Use Recent Form (last 10 rounds) as single measurement.
Calculate trajectory: does player have improving vs. declining trend?
Do NOT use both recent SG AND recent score.
```

---

### Cluster 6: Course History

```
┌──────────────────────────────────┐
│   Course History Cluster         │
├──────────────────────────────────┤
│ Same-Venue History (PRI)         │ Performance at this exact course
│   ├─ Course Type History (ALT)   │ Performance at similar courses
│   └─ Setup Type History (ALT)    │ Performance on similar setups
│ Recency-Weighted History (DUP)   │ Same data, weighted by recency
└──────────────────────────────────┘

RECOMMENDATION:
Use Same-Venue History (if available, 3+ rounds minimum).
Use Course-Type History as fallback (for courses where player hasn't played).
Do NOT use both—choose based on data availability.
```

---

### Cluster 7: Player Quality vs. Course Fit (CRITICAL)

```
┌────────────────────────────────────┐
│   Potential Double-Count Risk      │
├────────────────────────────────────┤
│ Career Skill Percentiles (PRI)     │ Player rank vs. field
│   ├─ Scoring Average (ALT)         │ Overall quality aggregate
│   ├─ World Ranking (ALT)           │ Official ranking
│   └─ Recent Scoring (ALT)          │ Current quality
│ Course Demand Fit (PRI)            │ Relative advantage on this course
│   ├─ Is Player Better at Driving   │ Compared to...?
│   └─ Compared to Field Average     │ Or compared to player's baseline?
└────────────────────────────────────┘

CRITICAL ISSUE:
If Skill Fit is calculated as:
  Skill Fit = Player Percentile × Course Weight
  
Then we're mixing:
  - Player's absolute quality (percentile)
  - With course's skill emphasis (weight)
  
But if Player was elite at everything, they'd get high fit on every course!
This is CORRECT for fitting (better players fit better).

HOWEVER: If you want to measure SPECIALIZATION (specialist > generalist):
  Must use relative advantage, not absolute percentile:
  Specialization Fit = (Player_Percentile - Field_Average) × Course_Weight
  
Phase 16A is ambiguous about which to use.
```

---

## Double-Counting Risk Analysis

### Risk 1: Form Bonus + Skill Percentile

**Scenario:**
- Player has great driving season: Driving Percentile = 90
- Player's recent form is hot: Form Bonus = +10

**Result:** 
- Skill Fit includes the 90 percentile (from good season)
- Form Bonus ADDS +10 for hot streak
- If both from same recent rounds, we've double-counted

**Mitigation:**
- Form Bonus should use TRAJECTORY, not absolute performance
- Example: "Player was 85th percentile last 20 rounds, now 92nd percentile" = +7 bonus
- This avoids double-counting absolute performance vs. trend

---

### Risk 2: SG:Approach + Proximity

**Scenario:**
- Player has elite SG:Approach
- Proximity shows player is 95th percentile in approach proximity

**Result:**
- SG:Approach already includes proximity advantage (it's net strokes vs. avg proximity)
- Including proximity separately double-counts same golfer-green interaction

**Mitigation:**
- Use SG:Approach only for scoring
- Report proximity in explanations for narrative, not scoring

---

### Risk 3: Recent Form + Course History at Same Venue

**Scenario:**
- Player played same course 2 weeks ago, shot 65 (excellent)
- Form Bonus: +8
- Course History: +5 (because player did well last time)

**Result:**
- Both using same recent excellent score

**Mitigation:**
- Course History should use HISTORICAL pattern, not recent performance
- Exclude most recent occurrence if already in Form Bonus
- Use: "Player's average at this course over career" vs. "Player's recent form"

---

## Correlation Analysis

### Predicted Correlations Between Signals

| Signal Pair | Predicted Correlation | Risk Level |
|-------------|----------------------|-----------|
| Distance + Dispersion | 0.7+ (high) | HIGH — exclude one |
| SG:App + Proximity | 0.8+ (very high) | HIGH — SG:App absorbs |
| SG:SG + Sand Saves | 0.6+ (medium) | MEDIUM — exclude sand metric |
| Recent Form + Recent SG | 0.9+ (very high) | HIGH — use form ONLY |
| Career Quality + Venue History | 0.4+ (low-med) | LOW — can coexist |
| Scoring Avg + All SG Metrics | 0.7+ (high) | MEDIUM — SG redundant |

**Recommendation:** 
- Exclude high-correlation pairs (>0.7)
- Use only one signal from correlated cluster
- Use the more fundamental signal (SG:Approach > Proximity)

---

## V1 CLEANED SIGNAL SET

**Remove These to Eliminate Double-Counting:**

1. Driving Dispersion (use Distance only)
2. Approach Proximity (use SG:Approach only)
3. Proximity buckets (use SG:Approach only)
4. Sand Save % (use SG:Short Game only)
5. Pitch/Chip Proximity (use SG:Short Game only)
6. Long Putting % (use SG:Putting only, not separate)
7. Recent SG Breakdown (use Form metric only)
8. Career Scoring Avg (use individual skill percentiles instead)

**Keep These (No Overlap):**

1. SG:Off-Tee (Driving)
2. SG:Approach
3. SG:Short Game
4. SG:ARG (Recovery)
5. SG:Putting
6. Recent Form (Trajectory, not absolute)
7. Venue History (Historical pattern)
8. Volatility Profile (Separate concept)
9. Confidence (Separate dimension)

---

## Confidence Multiplier Semantics (CRITICAL CLARIFICATION NEEDED)

**Phase 16A is ambiguous about what Confidence Multiplier does:**

### Option A: Scale the Score
```
Final Score = Skill Fit × Confidence Multiplier

Example:
- Skill Fit = 75
- Confidence = 0.6 (low data)
- Final Score = 75 × 0.6 = 45 (artificially low)

PROBLEM: Low-confidence high-fit player appears bad when data is sparse.
This conflates "we're uncertain" with "player doesn't fit"
```

### Option B: Separate Signals
```
Fit Score = 75
Confidence = 0.6 (low data)
Display both separately in UI

ADVANTAGE: "Fit is good, but data is sparse" is clear message
```

**Recommendation:**
- Use Option B (separate signals)
- Confidence multiplier does NOT affect Fit score
- Confidence affects explanation ("trust this") but not ranking

---

## Recommendation

✅ **CONDITIONAL PASS**

Phase 16A architecture can avoid double-counting if:

1. **Implement cleaned signal set** (14 core signals instead of 50+)
2. **Use one signal per cluster** (not multiple from same cluster)
3. **Clarify Confidence semantics** (separate, don't multiply score)
4. **Validate signal independence** (Phase 16B: run correlation test on historical data)
5. **Define form as trajectory** (not absolute performance)

With these modifications, the 5-component score (Fit, Form, History, Confidence, Volatility) can work without double-counting.

