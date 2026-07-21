# Validation Methodology

**Author:** Principal Statistician  
**Date:** 2026-07-20  
**Purpose:** Define how to prevent bias, leakage, and false positives

---

## Core Principle

**The validation methodology must prevent us from fooling ourselves.**

Every evaluation must simulate real-world conditions: the model has never seen this tournament before and must predict its outcome *a priori* (before the tournament).

---

## Preventing Look-Ahead Bias

**Problem:** Using future data to predict past outcomes.

**Example of Failure:**
```python
# ❌ WRONG: Uses tournament results (future) to train
model = train(players, tournament_outcome)  # Data leakage!
predictions = predict(same_tournament)      # Circular!
accuracy = 99%                               # Meaningless
```

**Prevention:**

1. **Training Window:** All player data used to build model must be >14 days before tournament
2. **Cutoff Rule:** For tournament on 2026-08-10, use only data through 2026-07-27
3. **World Rankings:** Use rankings as of 2026-07-27, not updated rankings after event
4. **Injury Data:** If player withdrew mid-tournament, don't use that information for prediction

**Validation:**

```python
# ✅ RIGHT: Model trained on data BEFORE tournament
training_cutoff = tournament_date - timedelta(days=14)
model = train(players_through[training_cutoff])
predictions = predict(tournament)  # Never seen this tournament
accuracy = measure(predictions, actual_results)
```

---

## Preventing Data Leakage

**Problem:** Information about the tournament influencing training data.

### Setup Leakage

**❌ WRONG:**
```python
# Using post-setup data (known pin positions) to predict
course_setup = tournament.get_setup_data()  # Known after setup released
model = train(course_setup)
```

**✅ RIGHT:**
```python
# Using only estimated setup difficulty
estimated_setup = estimate_course_difficulty_from_prior_events()
model = train(estimated_setup)
```

### Outcome Leakage

**❌ WRONG:**
```python
# Using withdrawal information BEFORE prediction
feature = "withdrawn_next_week"  # Data from future!
predictions = predict(features_with_withdrawals)
```

**✅ RIGHT:**
```python
# Only use withdrawal data available at prediction time
features = player_data_through[training_cutoff]
# Do NOT include "withdrew" flag for this tournament
```

---

## Preventing Selection Bias

**Problem:** Non-random selection of test cases.

### Field Composition Bias

**❌ WRONG:**
```python
# Testing only on elite events (easier prediction)
test_events = filter_to(["Masters", "US Open", "PGA Championship", "Open"])
accuracy = evaluate(test_events)  # Biased high
```

**✅ RIGHT:**
```python
# Test on representative distribution
test_events = all_events_in_dataset  # OR random sample across all tiers
# Ensure elite/medium/weak events proportionally represented
```

### Player Selection Bias

**❌ WRONG:**
```python
# Only testing on players with 20+ prior appearances at venue
test_players = filter_to(players_with_venue_history(n >= 20))
accuracy = high  # But meaningless for 90% of field
```

**✅ RIGHT:**
```python
# Include all players in field
# Separately report accuracy for (venue history, no venue history) groups
```

---

## Preventing Survivorship Bias

**Problem:** Only including players who "survived" to appear in dataset.

### Injury Bias

**❌ WRONG:**
```python
# Player injured mid-2024 excluded from 2024 eval
# Creates artificial accuracy (injured players can't surprise)
players_2024 = [p for p in all_players if p.played_in_2024]
```

**✅ RIGHT:**
```python
# Include injured players; model should predict their non-appearance
players_2024 = all_players_active_at_start_of_2024
# Separately report: withdrawal prediction accuracy
```

### Withdrawal Bias

**❌ WRONG:**
```python
# Testing only on players who completed tournament
results = filter_to(players_completed_tournament)
```

**✅ RIGHT:**
```python
# Include withdrawals at correct placement (missed cut = actual placement)
# Model should predict withdrawal likelihood
```

---

## Preventing Course Leakage

**Problem:** Using course setup information not available at prediction time.

### Pin Position Leakage

**❌ WRONG:**
```python
# Using actual pin severity (determined during tournament)
pin_severity = tournament.actual_pin_difficulty
# Model trained on unknown pin positions
```

**✅ RIGHT:**
```python
# Using estimated pin severity from:
# 1. Historical pin severity at this course
# 2. Tournament type (major vs. regular)
# 3. Course setup tier (PGA Tour vs. co-sanctioned)
```

### Setup Leakage

**✅ CORRECT TIMELINE:**
```
Monday 2026-08-06: Predict tournament 2026-08-10
- Available: Course design, historical setup
- Available: Setup sheet (released Friday before)
- NOT available: Pin positions (set during tournament)
- NOT available: Rough height (set during tournament)
- NOT available: Actual scoring (tournament ongoing)
```

---

## Preventing Weather Leakage

**Problem:** Using actual weather to predict tournament outcomes.

### Wind Leakage

**❌ WRONG:**
```python
# Using actual tournament wind speed (forecast unknown before event)
wind_forecast = tournament.actual_wind_speed
model = train(wind_forecast)
```

**✅ RIGHT:**
```python
# Using only forecast available at prediction time
# For tournaments 5+ days away: Use historical avg wind
# For tournaments 3-5 days away: Use weather forecast as of 5 days before
# For tournaments <3 days away: Use latest forecast (may update)
```

### Normalization Leakage

**❌ WRONG:**
```python
# Normalizing course difficulty by actual scores (uses outcome)
course_difficulty = mean(tournament.all_scores)  # Circular!
```

**✅ RIGHT:**
```python
# Normalizing by historical difficulty
course_difficulty = mean(all_prior_tournaments_at_course)
```

---

## Validation Windows

### Rolling Window Evaluation

**Standard Approach:**

```
2021 Tournaments 1-18 (Jan-May)
├─ Train on: 2021 Tournaments 1-4 (earlier history)
├─ Validate on: 2021 Tournaments 5-18
├─ Cutoff: 2 weeks before each tournament

2021 Tournaments 5-22 (Feb-June)
├─ Train on: 2021 Tournaments 1-8 (prior history)
├─ Validate on: 2021 Tournaments 9-22
├─ Cutoff: 2 weeks before each tournament

...continue through 2025
```

**Rationale:**
- Simulates real-world: model never sees future tournaments
- Respects temporal ordering (can't use tomorrow's data)
- Accumulates training data over time (realistic)

### Season Holdout

**Alternate Approach (for ML models):**

```
Train on: 2021-2023 seasons (225 tournaments)
Validate on: 2024 season (75 tournaments)
Test on: 2025 season (50+ tournaments)
```

**Rationale:** Prevents model from memorizing seasonal patterns.

---

## Venue Holdout (Optional for ML)

**Advanced Validation:**

```
For each unique venue:
  Train on: All tournaments EXCEPT this venue
  Validate on: All tournaments at this venue
  Measure: Does model generalize to new venues?
```

**Purpose:** Detect venue-specific overfitting.

---

## Player Holdout (Optional for ML)

**Advanced Validation:**

```
For each player:
  Train on: All tournaments where this player didn't appear
  Validate on: All tournaments where this player appeared
  Measure: Does model generalize to new players?
```

**Purpose:** Detect player-specific memorization.

---

## Statistical Power

**Minimum Sample Sizes:**

| Test | Minimum | Rationale |
|------|---------|-----------|
| Rank correlation | 3,000 cases | p<0.05, power=0.80 |
| Improvement over baseline | 300 tournaments | Detect 5% improvement |
| Segmentation (per segment) | 100 tournaments | Meaningful subgroup |
| Top-5 hit rate | 50 tournaments | Sufficient "5s" for power |
| Confidence calibration | 1,000 predictions | 10 deciles × 100 each |

**If power is insufficient:**
- Report findings as preliminary
- Flag for larger evaluation
- Do NOT make promotion decisions

---

## Regression Testing Checklist

**Before Each Version Promotion:**

- [ ] No metric worse than production (all gates passed)
- [ ] Rank correlation improvement ≥ 2% vs. baseline
- [ ] Top-5 hit rate improvement ≥ 2% vs. baseline
- [ ] Confidence calibration maintained (±2% variance OK)
- [ ] Explanations remain truthful (100%)
- [ ] No unexplained ranking drift for specific player/course combos
- [ ] No systematic bias by field strength
- [ ] No systematic bias by course type
- [ ] DFS value stable or improved
- [ ] 30-day production monitoring shows no degradation

---

## Documentation Requirements

**Every evaluation must record:**

```yaml
Evaluation ID: EVAL-2026-07-20-V1-BENCHMARK
Version: CaddieIQ Matching Engine v1.0
Evaluation Date: 2026-07-20
Baseline: SG Composite (0.30)

Training Data:
  Period: 2021-01-01 to 2026-07-13
  Tournaments: 378
  Players: 200+
  
Validation Data:
  Period: 2026-07-15 to 2026-08-15
  Tournaments: 8
  
Results:
  Spearman Correlation: 0.38 [0.35-0.41], p<0.001
  Top-5 Hit Rate: 48% [45%-51%]
  Cut Accuracy: 75% [72%-78%]
  
Regression vs. Production:
  Status: ✅ PASS (no regressions)
  
Approval: [Leadership sign-off required]
```

---

**This methodology ensures every evaluation is scientifically sound and free from self-deception.**
