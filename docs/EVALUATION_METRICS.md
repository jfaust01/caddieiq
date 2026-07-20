# Evaluation Metrics

**Author:** Principal Statistician  
**Date:** 2026-07-20  
**Purpose:** Formal definitions of all metrics used to evaluate matching engine

---

## Core Ranking Metrics

### Metric 1: Spearman Rank Correlation

**Definition:** Non-parametric measure of monotonic relationship between predicted rank and actual finish.

**Formula:**
```
ρ = 1 - (6 * Σ(d_i^2)) / (n * (n^2 - 1))

where:
  d_i = difference in rank for player i
  n = number of players in field
```

**Interpretation:**
- Range: -1 to +1
- ρ = 1: Perfect ranking
- ρ = 0: No relationship
- ρ = -1: Inverse ranking

**Target for CaddieIQ V1:** 0.35+  
**Target for V2:** 0.45+  
**Baseline (SG Composite):** 0.30  

**Why This Metric:**
- Robust to outliers (unlike Pearson)
- Meaningful for ranking tasks
- Interpretable (0.35 = "moderate positive relationship")

---

### Metric 2: Kendall Tau Rank Correlation

**Definition:** Non-parametric measure based on concordant and discordant pairs.

**Formula:**
```
τ = (C - D) / n(n-1)/2

where:
  C = number of concordant pairs
  D = number of discordant pairs
  n = number of players
```

**Interpretation:**
- Range: -1 to +1
- More conservative than Spearman
- Better for tied ranks

**Target:** 0.05-0.10 lower than Spearman  

**Why:** As confirmation metric; should correlate with Spearman.

---

### Metric 3: NDCG @ 5 (Normalized Discounted Cumulative Gain)

**Definition:** Measures ranking quality of top 5 predictions vs. actual top 5.

**Formula:**
```
NDCG@5 = DCG@5 / IDCG@5

where:
  DCG@5 = Σ(i=1 to 5) rel_i / log_2(i+1)
  rel_i = relevance of rank i (1 if actual top-5, 0 otherwise)
  IDCG@5 = ideal DCG (all 5 are actual top-5)
```

**Interpretation:**
- Range: 0 to 1
- 1.0 = Perfect top 5
- 0.5 = 2.5 of top 5 predicted
- 0.0 = None of top 5 predicted

**Target for V1:** 0.55+  
**Target for V2:** 0.65+  

**Why:** Emphasizes top finishers (where most player interest lies).

---

### Metric 4: NDCG @ 10

**Definition:** Same as NDCG@5 but for top 10.

**Target for V1:** 0.50+  
**Target for V2:** 0.60+  

**Why:** Tests consistency of predictions beyond top 5.

---

## Prediction Accuracy Metrics

### Metric 5: Top-5 Hit Rate

**Definition:** Percentage of actual tournament top-5 finishers that were predicted in top 10.

**Formula:**
```
Hit@5 = (Number of actual top-5 in predicted top-10) / 5
```

**Interpretation:**
- Range: 0% to 100%
- 100% = All actual top 5 were in predicted top 10
- 40% = 2 of actual top 5 were in predicted top 10

**Target for V1:** 45%+  
**Target for V2:** 55%+  
**Baseline (SG Comp):** 34%  

**Why:** Directly ties to user value (can they find eventual winners?).

---

### Metric 6: Top-10 Hit Rate

**Definition:** Percentage of actual top 10 finishers predicted in top 20.

**Formula:**
```
Hit@10 = (Number of actual top-10 in predicted top-20) / 10
```

**Target for V1:** 50%+  
**Target for V2:** 60%+  

---

### Metric 7: Cut Prediction Accuracy

**Definition:** Accuracy of predicting which players make or miss the cut.

**Formula:**
```
Accuracy = (TP + TN) / (TP + TN + FP + FN)

where:
  TP = correctly predicted made cut
  TN = correctly predicted missed cut
  FP = incorrectly predicted made cut
  FN = incorrectly predicted missed cut
```

**Target for V1:** 72%+  
**Target for V2:** 78%+  
**Baseline (Random):** 50%  

**Why:** Different from finish prediction; important for field assessment.

---

## Segmentation Metrics

**Each primary metric must be reported separately for:**

### By Course Difficulty
- Easy (scoring average > par + 1)
- Medium (scoring average = par to +1)
- Hard (scoring average < par)

**Hypothesis:** CaddieIQ should excel on hard courses (more discrimination).

### By Field Strength
- Elite (avg ranking top 15)
- Strong (avg ranking 15-50)
- Medium (avg ranking 50-100)
- Weak (avg ranking 100+)

**Hypothesis:** Performance should improve with stronger fields (more signal).

### By Major Championships vs. Regular Events
- Majors (4 per year)
- Signature Events (8 per year, 2023+)
- Regular Events (remainder)

**Hypothesis:** Majors should have higher predictability (better fields).

### By Venue Type
- Links (typical: Royal Lytham, Carnoustie)
- Parkland (typical: Augusta, Oakmont)
- Desert (typical: Waste Management, Phoenix)

**Hypothesis:** Different course types favor different skills; CaddieIQ should adapt.

### By Player Skill Quartile
- Elite (ranking 1-50)
- Strong (ranking 51-150)
- Average (ranking 151-300)
- Weak (ranking 300+)

**Hypothesis:** Elite players may be more predictable (fewer surprises).

---

## DFS-Specific Metrics

### Metric 8: DFS Value Score

**Definition:** Expected value per dollar of salary.

**Formula:**
```
DFS Value = (Predicted Points) / (Salary / 1000) * 10

Target: 1.5x - 2.0x better than Vegas odds baseline
```

**Measurement:**
- Calculate predicted points using CaddieIQ model
- Compare to DraftKings salary
- Backtest against actual DFS points
- Calculate realized ROI

---

## Betting Metrics

### Metric 9: Odds Calibration

**Definition:** How well predicted probability matches actual winning probability.

**Method:**
1. Divide predictions into 10 deciles by probability
2. For each decile, calculate actual win rate
3. Plot predicted vs. actual (perfect = y=x line)
4. Measure deviation from perfect line

**Target:** ±2% calibration error  

**Example:**
- Decile 1 (0-10% predicted): Should have 0-10% actual win rate
- Decile 5 (40-50% predicted): Should have 40-50% actual win rate

---

## Explainability Metrics

### Metric 10: Explanation Truthfulness

**Definition:** Percentage of generated explanations with zero false statements.

**Measurement:**
- Generate explanation for 50 random predictions
- Manual review: Does each statement have data backing?
- Flag any contradiction vs. scoring profile

**Target:** 100% (0% false statements)

---

### Metric 11: Explanation Consistency

**Definition:** How stable explanations are across multiple runs.

**Measurement:**
- Generate explanation for same player/course 10 times
- Compare explanations for semantic equivalence
- Measure variation

**Target:** 95%+ identical or equivalent explanations

---

### Metric 12: Explanation Relevance

**Definition:** Do stated drivers match actual score component weights?

**Measurement:**
- Extract top 3 factors from explanation
- Compare to top 3 factors in score calculation
- Calculate overlap percentage

**Target:** 80%+ overlap

---

## Confidence Metrics

### Metric 13: Confidence Calibration

**Definition:** Whether stated confidence levels are statistically deserved.

**Measurement:**
1. Generate prediction with stated confidence for 1,000 predictions
2. Divide by confidence deciles
3. For each decile, calculate actual accuracy
4. Plot predicted confidence vs. actual accuracy

**Target:** Linear relationship (y ≈ x)

---

### Metric 14: Overconfidence Rate

**Definition:** Percentage of cases where confidence > actual accuracy.

**Formula:**
```
Overconfidence Rate = (Cases where conf > accuracy) / Total cases
```

**Target:** <10% (acceptable overconfidence is natural)

---

## Statistical Significance

**All metrics must be reported with:**

- Point estimate
- 95% confidence interval
- p-value vs. baseline
- Sample size

**Example:**
```
Spearman Correlation: 0.38 [95% CI: 0.35-0.41], p<0.001, n=18,500
(Baseline: 0.30, improvement = 8 percentage points)
```

---

## Dashboard Requirements

**All metrics must be:**

✅ Calculated automatically after each evaluation run  
✅ Trended over time (version comparison)  
✅ Segmented by category (course type, field strength, etc.)  
✅ Flagged for regression (alert if metric drops)  
✅ Exported for leadership review  

---

**These metrics are the scientific evidence for all claims about matching engine quality.**
