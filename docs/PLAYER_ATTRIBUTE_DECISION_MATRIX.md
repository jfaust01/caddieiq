# Player Attribute Decision Matrix — V1 Calibration

**Document:** Architecture Review Board — Detailed Analysis  
**Date:** 2026-07-20  
**Purpose:** Review 50+ Phase 16A player attributes and assign V1 status  
**Framework:** Predictive value + Data availability + Explainability + Noise/Correlation

---

## Decision Framework

Each attribute is evaluated on:

1. **Predictive Value** (0-10): Does it predict course fit?
2. **Data Availability** (0-10): Can we get reliable data?
3. **Explainability** (0-10): Can we explain it to users?
4. **Noise/Correlation** (0-10): Is it noisy or redundant?
5. **Minimum Sample** (rounds needed): Required data depth

**V1 Status Options:**
- **V1 CORE** — Use immediately in Phase 16B
- **V1 SUPPORTING** — Use if available, don't block
- **V1 EXPLANATION-ONLY** — Use in text explanations, not scoring
- **V2 DEFERRED** — Build in Phase 16B+
- **REJECT** — Don't use (duplicate/noisy/unavailable)

---

## Category A: Driving (4 Attributes)

### A.1 - Driving Distance

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 9/10 | Strong signal on long courses |
| Data Availability | 10/10 | PGA Tour Stats, ShotLink |
| Explainability | 10/10 | Obvious to users |
| Noise/Correlation | 7/10 | Some variance round-to-round |
| Min Sample | 10 rounds | Stabilizes by 20 rounds |

**Decision:** ✅ **V1 CORE**

**Rationale:** High predictive value, perfect data, easy to explain. Core differentiator.

---

### A.2 - Driving Accuracy

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 8/10 | Predicts tight-fairway courses |
| Data Availability | 10/10 | PGA Tour Stats |
| Explainability | 10/10 | Fairway percentage obvious |
| Noise/Correlation | 8/10 | Can be influenced by course difficulty (tight fairways naturally reduce %) |
| Min Sample | 15 rounds | More variable than distance |

**Decision:** ✅ **V1 CORE**

**Rationale:** Predictor for precision-demanding courses. Slight correlation with course setup, but independent signal.

---

### A.3 - Driving Dispersion

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 6/10 | Useful but derived from distance + accuracy |
| Data Availability | 9/10 | ShotLink ball tracking |
| Explainability | 5/10 | Users don't understand standard deviation |
| Noise/Correlation | 4/10 | Highly correlated with accuracy (both measure tee consistency) |
| Min Sample | 20 rounds | Noisy metric |

**Decision:** ⚠️ **V1 SUPPORTING** → **RECOMMEND: REJECT**

**Rationale:** 
- Dispersion is highly correlated with "Driving Accuracy" 
- Users don't understand standard deviation
- Inclusion risks double-counting tee consistency
- If needed later, can be derived from distance + accuracy

**Recommendation:** Remove from V1. Use accuracy alone. Dispersion can be added Phase 16C.

---

### A.4 - Tee Shot Discipline

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 3/10 | Decision quality at tee is interesting but rare to measure |
| Data Availability | 2/10 | NO CURRENT SOURCE. Must infer from shot patterns |
| Explainability | 6/10 | Conceptually understandable but hard to show data |
| Noise/Correlation | 3/10 | Highly dependent on course design |
| Min Sample | 50+ rounds | Inferred metric, needs deep sample |

**Decision:** ❌ **REJECT**

**Rationale:**
- No data source currently available
- Would require manual annotation of tee decisions
- Highly correlated with course setup (tight courses force discipline)
- Phase 16A admits this requires "manual research"
- Not worth operational burden for V1

---

## Category B: Approach (4 Attributes)

### B.1 - Strokes Gained: Approach

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 9/10 | Strong predictor for precision courses |
| Data Availability | 10/10 | PGA Tour Stats |
| Explainability | 8/10 | Users understand strokes-gained |
| Noise/Correlation | 6/10 | Includes green-reading skill (confound with putting) |
| Min Sample | 15 rounds | Stabilizes well |

**Decision:** ✅ **V1 CORE**

**Rationale:** Best overall measure of mid-range iron skill. SG:Approach is proven metric.

**Note:** SG:Approach includes both iron proximity AND green reading. Acknowledged confound with putting; can be separated Phase 16B.

---

### B.2 - Approach Proximity

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 7/10 | Useful but highly correlated with SG:Approach |
| Data Availability | 9/10 | ShotLink provides detailed proximity |
| Explainability | 10/10 | "Feet to pin" very intuitive |
| Noise/Correlation | 3/10 | **DUPLICATE SIGNAL** — Strongly correlated with SG:Approach |
| Min Sample | 20 rounds | Better stability |

**Decision:** ⚠️ **V1 SUPPORTING** → **RECOMMEND: REJECT**

**Rationale:**
- SG:Approach already captures proximity advantage
- Including both creates double-counting of approach skill
- Proximity is derived from the same shots as SG:Approach
- Use SG:Approach (normalized strokes) not raw proximity
- Proximity can be output in explanation but not scored

**Recommendation:** Remove from scoring. Use SG:Approach only. Report proximity in explanations.

---

### B.3 - Proximity Percentiles by Distance Bucket

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 6/10 | More granular but adds complexity |
| Data Availability | 8/10 | ShotLink can provide |
| Explainability | 3/10 | Too complex for user explanation |
| Noise/Correlation | 2/10 | **SEVERE OVER-SPECIFICATION** |
| Min Sample | 30+ rounds | Needs many shots per bucket |

**Decision:** ❌ **REJECT**

**Rationale:**
- Over-engineered for V1
- Requires 30+ rounds per distance bucket for stability
- Phase 16A level of granularity creates false precision
- SG:Approach already handles this at higher level
- Can revisit Phase 16B+ if warranted

---

### B.4 - Par-5 Scoring Efficiency

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 7/10 | Useful for par-5 heavy courses |
| Data Availability | 8/10 | Can derive from score data |
| Explainability | 8/10 | "Par-5 scoring" is intuitive |
| Noise/Correlation | 6/10 | Includes both approach AND par-5 strategy |
| Min Sample | 20+ par-5s | Needs sufficient sample |

**Decision:** ⚠️ **V1 SUPPORTING**

**Rationale:**
- Useful signal for par-5 heavy courses
- Data available and explainable
- Doesn't create double-counting (separate from iron approach)
- Sample requirement is manageable

**Status:** Include if data available, don't block Phase 16B. Deferred to Phase 16B implementation.

---

## Category C: Short Game (5 Attributes)

### C.1 - Strokes Gained: Short Game

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 8/10 | Strong for hazard-heavy courses |
| Data Availability | 10/10 | PGA Tour Stats |
| Explainability | 8/10 | Strokes-gained metric understood |
| Noise/Correlation | 7/10 | Includes both pitch/chip and sand play |
| Min Sample | 15 rounds | Stable by 20 rounds |

**Decision:** ✅ **V1 CORE**

**Rationale:** Proven metric, good data, explainable. Core skill differentiator.

---

### C.2 - Sand Save Percentage

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 5/10 | Narrow signal (bunker play only) |
| Data Availability | 10/10 | PGA Tour Stats |
| Explainability | 10/10 | Very intuitive |
| Noise/Correlation | 4/10 | **SUBSET OF SG:Short Game** — included in broader metric |
| Min Sample | 20+ sand shots | Requires bunker play |

**Decision:** ⚠️ **V1 SUPPORTING** → **RECOMMEND: REJECT**

**Rationale:**
- Sand saves are a component of SG:Short Game
- Including both creates redundancy
- SG:Short Game already weights bunker play appropriately
- Sample requirement problematic (some players hit few bunkers)
- Use SG:Short Game only

**Recommendation:** Remove from scoring. Output sand saves in explanation if relevant.

---

### C.3 - Scrambling Rate

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 6/10 | Correlated with recovery ability |
| Data Availability | 10/10 | PGA Tour Stats |
| Explainability | 9/10 | "Made recovery" very intuitive |
| Noise/Correlation | 5/10 | Confounded with course setup (rough density affects scrambling rate) |
| Min Sample | 20 rounds | Reasonable stability |

**Decision:** ⚠️ **V1 SUPPORTING**

**Rationale:**
- Intuitive metric
- Data available and explainable
- Some confound with course setup but manageable
- Complements SG:Short Game by measuring recovery attempts
- Include if implementation bandwidth

**Status:** Optional add to Phase 16B. Include scrambling %, recommend against scrambling distance.

---

### C.4 & C.5 - Pitch/Chip Proximity and Sand Proximity

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 4/10 | Derivative of SG:Short Game |
| Data Availability | 7/10 | ShotLink provides |
| Explainability | 8/10 | Intuitive but false precision |
| Noise/Correlation | 2/10 | **SEVERE DUPLICATION** — Already captured by SG |
| Min Sample | 30+ shots | High granularity requirement |

**Decision:** ❌ **REJECT BOTH**

**Rationale:**
- Over-specification of short game
- SG:Short Game already aggregates these signals
- Including proximity metrics adds false precision without predictive gain
- Too many sample requirements
- Use SG:Short Game only; report proximity in explanations

---

## Category D: Putting (5 Attributes)

### D.1 - Strokes Gained: Putting

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 9/10 | Excellent predictor for speed-dependent courses |
| Data Availability | 10/10 | PGA Tour Stats |
| Explainability | 8/10 | Strokes-gained understood |
| Noise/Correlation | 8/10 | Pure putting metric, independent of other skills |
| Min Sample | 15 rounds | Stabilizes well |

**Decision:** ✅ **V1 CORE**

**Rationale:** Best measure of putting ability. High predictive value on fast greens. Core differentiator.

---

### D.2 - Long Putting (10+ feet)

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 6/10 | Useful for fast greens (more long putts) |
| Data Availability | 8/10 | ShotLink provides distance buckets |
| Explainability | 9/10 | "Long putts made" intuitive |
| Noise/Correlation | 5/10 | Confounded with green speed (fast greens = more long putts) |
| Min Sample | 50+ long putts | Small sample per bucket |

**Decision:** ⚠️ **V1 EXPLANATION-ONLY**

**Rationale:**
- Useful for explanation ("made long putts last week")
- Not independent enough for scoring
- SG:Putting already captures this
- Sample requirements limit implementation

**Status:** Include in explanations, not in score model.

---

### D.3 & D.4 - Grass-Specific Putting

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 4/10 | Potentially useful but too specific |
| Data Availability | 3/10 | No API for grass type per hole in historical data |
| Explainability | 6/10 | Complex to explain |
| Noise/Correlation | 3/10 | Confounded with course setup |
| Min Sample | 100+ rounds | Needs deep sample across grass types |

**Decision:** ❌ **REJECT — DEFER TO V2**

**Rationale:**
- Data not currently available (must manually categorize)
- Over-specification for V1
- Phase 16B cannot implement
- Revisit Phase 17+ if grass data becomes available

---

### D.5 - Speed Adaptation

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 3/10 | Assumes players adapt between events; limited evidence |
| Data Availability | 2/10 | NO CURRENT SOURCE |
| Explainability | 5/10 | Speculative concept |
| Noise/Correlation | 6/10 | Confounded with player skill variation |
| Min Sample | Unavailable | Would require manual research |

**Decision:** ❌ **REJECT**

**Rationale:**
- Not implementable without new data source
- Concept is speculative
- SG:Putting handles speed differences implicitly
- Not worth pursuing

---

## Category E: Scoring (5 Attributes)

### E.1 - Average Score

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 7/10 | Overall performance baseline |
| Data Availability | 10/10 | PGA Tour Stats |
| Explainability | 10/10 | "Scoring average" is obvious |
| Noise/Correlation | 7/10 | Aggregate of all skills (not independent) |
| Min Sample | 15 rounds | Stabilizes by 20 |

**Decision:** ⚠️ **V1 SUPPORTING**

**Rationale:**
- Useful as check on overall player quality
- High correlation with sum of skill scores (expected)
- Can serve as confidence signal or validation
- Include if implementation bandwidth

---

### E.2 - Birdie Rate

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 5/10 | Confounded with course difficulty |
| Data Availability | 10/10 | PGA Tour Stats |
| Explainability | 9/10 | Intuitive metric |
| Noise/Correlation | 3/10 | **DEPENDS ON COURSE** — Can't normalize |
| Min Sample | 50+ holes | Needs sufficient sample |

**Decision:** ⚠️ **V1 EXPLANATION-ONLY**

**Rationale:**
- Birdie rate highly dependent on field and course
- Can't compare Scottie's birdie rate at easy course vs. hard course
- Use in explanations ("averaging 4.2 birdies per event")
- Not suitable for course-fit scoring

---

### E.3 & E.4 - Scoring Consistency / Variance

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 6/10 | Indicates volatility |
| Data Availability | 9/10 | Can derive from score data |
| Explainability | 7/10 | "Score variance" understood |
| Noise/Correlation | 5/10 | Captures same signal as volatility attribute |
| Min Sample | 20+ rounds | Needs sufficient history |

**Decision:** ⚠️ **V1 SUPPORTING** → **DEFER TO VOLATILITY SECTION**

**Rationale:**
- This overlaps with "Volatility Profile" category
- Redundant if volatility attributes included
- Decide: Use volatility profile OR scoring variance, not both
- Recommend: Use formal volatility profile (ceiling/floor)

---

### E.5 - Scoring Differential vs. Field

| Criterion | Score | Notes |
|-----------|-------|-------|
| Predictive Value | 8/10 | Measures relative performance |
| Data Availability | 9/10 | Can calculate from tournament data |
| Explainability | 8/10 | "Scoring 2 strokes better than field average" understood |
| Noise/Correlation | 8/10 | Independent signal (field-adjusted) |
| Min Sample | 15 rounds | Stabilizes well |

**Decision:** ⚠️ **V1 SUPPORTING**

**Rationale:**
- Good metric for comparing within tournament contexts
- Field-adjustment reduces noise
- Can serve as validation for skills-based fit score
- Include if bandwidth

---

## Category F: Recovery & Mental (8 Attributes) — SUMMARY

**Key Findings:**
- Recovery (Strokes Gained: Recovery) ✅ **V1 CORE** — Good data
- Mental attributes (consistency, composure) ❌ **REJECT** — No data source
- Volatility profile ✅ **V1 CORE** — Useful but needs formal definition

---

## Category G-M: Advanced Attributes (Wind, Grass, DFS, Course History, Recent Form, etc.)

**SUMMARY FOR ALL:**
- Wind performance ❌ NO DATA → REJECT
- Grass-specific play ❌ NO DATA → REJECT  
- DFS characteristics ⚠️ POSSIBLE → V1 SUPPORTING (if derived from scoring)
- Course history ✅ V1 CORE (if sufficient sample)
- Recent form ✅ V1 CORE (used in Form Bonus)
- Field strength adjustment ⚠️ V1 SUPPORTING (for confidence, not score)

---

## RECOMMENDED V1 PLAYER MODEL

### V1 CORE (Use Immediately)

1. **Driving Distance** (SG:OTT or raw distance)
2. **Driving Accuracy** (Fairway %)
3. **Strokes Gained: Approach**
4. **Strokes Gained: Short Game**
5. **Strokes Gained: Putting**
6. **Strokes Gained: Recovery** (ARG)
7. **Recent Form** (Last 10 rounds)
8. **Course History** (Performance at same venue)
9. **Volatility Profile** (Ceiling, floor, variance)

**Total: 9 core attributes** (vs. Phase 16A's 50)

### V1 SUPPORTING (Include if Data Available)

- Birdie rate (explanation only)
- Long-putt efficiency (explanation only)
- Scoring differential vs. field
- Par-5 scoring efficiency
- Scrambling rate

**Total: 5 supporting attributes**

### V2 DEFERRED

- Mental/composure attributes
- Wind performance  
- Grass-specific metrics
- DFS characteristics (if complex)
- Tee discipline
- All advanced derived metrics

---

## Key Reductions from Phase 16A

| Category | Phase 16A | V1 Core | Reduction | Reason |
|----------|-----------|---------|-----------|--------|
| Driving | 4 | 2 | 50% | Reject dispersion (duplicate) |
| Approach | 4 | 1 | 75% | Reject proximity/buckets (over-spec) |
| Short Game | 5 | 2 | 60% | Reject sand/pitch specifics |
| Putting | 5 | 1 | 80% | Reject grass-specific, speed adaptation |
| Recovery | 3 | 1 | 67% | Use only strokes gained |
| **TOTAL** | **50+** | **9** | **82%** | **Eliminate noise & duplication** |

---

## Recommendation

✅ **PASS WITH MODIFICATIONS**

Proceed to Phase 16B with 9-core + 5-supporting player model. This eliminates:
- False precision (too many buckets)
- Duplicate signals (dispersion vs. accuracy)
- Unavailable data (wind, grass, mental)
- Over-engineering (5 attributes worth of redundant putting metrics)

The reduced model is:
- More explainable (fewer moving parts)
- More robust (less noise)
- More implementable (no missing data sources)
- More statistically sound (avoids multicollinearity)

