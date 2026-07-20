# Baseline Model Specification

**Author:** Principal Data Scientist  
**Date:** 2026-07-20  
**Purpose:** Define comparison models that CaddieIQ matching engine must beat

---

## Overview

Every model must beat something. We define 10 baseline models ranging from trivial (random) to sophisticated (Vegas odds). CaddieIQ must exceed all of them to claim improvement.

---

## Baseline 1: Random Model

**Description:** Rank players randomly.

**Implementation:** 
```python
import random
ranks = list(range(1, field_size + 1))
random.shuffle(ranks)
return ranks
```

**Expected Performance:**
- Rank correlation: ~0.0
- Top-5 hit rate: ~4.5% (5/110)
- Top-10 hit rate: ~9%

**Purpose:** Establish noise floor. Any model worse than random is broken.

---

## Baseline 2: Field Strength Only

**Description:** Rank by world ranking only. Best-ranked players expected to finish highest.

**Implementation:**
```python
return sorted(players, key=lambda p: p.world_ranking)
```

**Expected Performance:**
- Rank correlation: 0.20-0.25
- Top-5 hit rate: 25-30%
- Top-10 hit rate: 30-35%

**Why It Works:** World ranking aggregates many signals.  
**Why It Fails:** Ignores course, form, venue history.

---

## Baseline 3: Recent Form Only

**Description:** Rank by average Strokes Gained over last 8 weeks.

**Implementation:**
```python
return sorted(players, key=lambda p: -1 * p.avg_sg_8weeks)
```

**Expected Performance:**
- Rank correlation: 0.22-0.28
- Top-5 hit rate: 28-32%
- Top-10 hit rate: 35-40%

**Why It Works:** Current momentum is predictive.  
**Why It Fails:** High regression to mean; doesn't account for course fit.

**CaddieIQ Must Beat:** 0.30 correlation (10% above baseline).

---

## Baseline 4: Course History Only

**Description:** For each player, rank by historical performance at this course/venue only.

**Implementation:**
```python
def rank_by_venue_history(player, course):
  history = player.get_rounds_at_venue(course.venue_id)
  return avg(history.strokes_gained)

return sorted(players, key=lambda p: -1 * rank_by_venue_history(p, course))
```

**Expected Performance:**
- Rank correlation: 0.15-0.20
- Top-5 hit rate: 20-25%
- Top-10 hit rate: 25-30%

**Why It Works:** Course-specific data is relevant.  
**Why It Fails:** <5 prior appearances for most players; small sample size.

**Limitation:** Only 30% of field has 2+ prior rounds at course.

---

## Baseline 5: Composite Strokes Gained

**Description:** Rank by rolling 52-week average SG across all categories (driving, approach, short game, putting).

**Implementation:**
```python
sg_composite = (
  p.sg_driving_52w +
  p.sg_approach_52w +
  p.sg_short_game_52w +
  p.sg_putting_52w
)
return sorted(players, key=lambda p: -1 * p.sg_composite)
```

**Expected Performance:**
- Rank correlation: 0.28-0.32
- Top-5 hit rate: 32-36%
- Top-10 hit rate: 38-42%

**Why It Works:** Comprehensive shot quality, diversified signal.  
**Why It Fails:** No course-specific weighting.

**CaddieIQ Must Beat:** 0.35 correlation (target for V1).

---

## Baseline 6: DataGolf Rank

**Description:** Use publicly available DataGolf course fit model ranking.

**Data Source:** DataGolf API (public, updated daily)

**Expected Performance:**
- Rank correlation: 0.32-0.38
- Top-5 hit rate: 38-42%
- Top-10 hit rate: 42-48%

**Why It Works:** Sophisticated course fit model, similar to CaddieIQ ambition.  
**Why It Fails:** Black box; limited feature set.

**CaddieIQ Target:** Must beat DataGolf by 3-5% to claim superiority.

---

## Baseline 7: Vegas Odds

**Description:** Rank by implied probability from Vegas moneyline odds.

**Data Source:** BetMGM, DraftKings, FanDuel opening odds

**Implementation:**
```python
implied_prob = 1.0 / american_odds_to_decimal(moneyline)
return sorted(players, key=lambda p: -1 * p.implied_probability)
```

**Expected Performance:**
- Rank correlation: 0.38-0.45
- Top-5 hit rate: 45-52%
- Top-10 hit rate: 48-55%

**Why It Works:** Incorporates all available information; market efficiency.  
**Why It Fails:** Odds set for betting, not prediction; contain vig bias.

**CaddieIQ Target:** Should approach but not exceed Vegas (edge is small).

---

## Baseline 8: DraftKings Salary

**Description:** Rank by DFS salary (higher salary = higher expected value).

**Data Source:** DraftKings golf slate openings

**Implementation:**
```python
return sorted(players, key=lambda p: -1 * p.draftking_salary)
```

**Expected Performance:**
- Rank correlation: 0.35-0.42
- Top-5 hit rate: 40-48%
- Top-10 hit rate: 45-52%

**Why It Works:** Pricing incorporates expert projections.  
**Why It Fails:** Pricing designed for GPP balance, not pure ranking.

---

## Baseline 9: OWGR + Recent Form Hybrid

**Description:** Weighted combination: 60% world ranking, 40% recent form.

**Implementation:**
```python
rank_owgr = normalize(players.world_ranking)
rank_form = normalize(-1 * players.avg_sg_8weeks)
return sorted(players, key=lambda p: 0.6 * rank_owgr[p] + 0.4 * rank_form[p])
```

**Expected Performance:**
- Rank correlation: 0.27-0.33
- Top-5 hit rate: 35-40%
- Top-10 hit rate: 40-45%

**Why It Works:** Combines structural skill + current momentum.  
**Why It Fails:** Simple weighting ignores course and venue.

**Purpose:** Tests whether course-specific features add value over simple hybrids.

---

## Baseline 10: Expert Consensus

**Description:** Average ranking from 3 golf analysts (Mark Immelman, Grant Boone, Justin Ray).

**Data Source:** Published weekly rankings (where available)

**Expected Performance:**
- Rank correlation: 0.30-0.37
- Top-5 hit rate: 35-42%
- Top-10 hit rate: 40-48%

**Why It Works:** Expert judgment incorporates hidden information.  
**Why It Fails:** Limited to publically ranked players; unavailable for some tournaments.

**Limitation:** Cannot evaluate for historical periods (experts didn't publish).

---

## Performance Summary Table

| Baseline | Rank Correlation | Top-5 Hit % | Top-10 Hit % | Purpose |
|----------|------------------|-------------|--------------|---------|
| 1. Random | ~0.00 | 4% | 9% | Noise floor |
| 2. World Ranking | 0.22 | 28% | 33% | Structural skill |
| 3. Recent Form | 0.25 | 30% | 38% | Current momentum |
| 4. Venue History | 0.18 | 22% | 28% | Course-specific (small n) |
| 5. SG Composite | 0.30 | 34% | 40% | **Target for V1: Beat this** |
| 6. DataGolf | 0.35 | 40% | 45% | Industry standard |
| 7. Vegas Odds | 0.42 | 48% | 52% | Market consensus |
| 8. DKings Salary | 0.38 | 44% | 50% | DFS expert pricing |
| 9. OWGR + Form | 0.30 | 37% | 43% | Simple hybrid |
| 10. Expert | 0.33 | 38% | 45% | Analyst consensus |

---

## Regression Testing

**Every CaddieIQ version must:**

- ✅ Beat Baseline 5 (SG Composite) by 5%+
- ✅ Meet or exceed Baseline 6 (DataGolf)
- ✅ Not regress below Baseline 2 (World Ranking)
- ✅ Show improvement on Baseline 3 (Recent Form)

**If regression occurs:**
- Halt release
- Investigate algorithmic change
- Revert to last-known-good version
- Document learning

---

## Caution: Baseline Overfitting

**Anti-Pattern to Prevent:**

Don't optimize CaddieIQ specifically to beat these baselines. Instead:

❌ Don't hardcode player rankings to beat Vegas odds  
❌ Don't overweight course history to beat Venue History baseline  
❌ Don't tune weights specifically to beat DataGolf  

✅ Optimize for prediction accuracy, let baselines show improvement naturally  
✅ If you're beating baselines by tuning against them, you're overfitting  

---

**These baselines establish the competitive context. CaddieIQ must prove superiority against all of them to claim market advantage.**
