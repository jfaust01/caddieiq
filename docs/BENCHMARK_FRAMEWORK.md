# Benchmark & Evaluation Framework

**Author:** Principal Data Scientist  
**Date:** 2026-07-20  
**Status:** Framework Specification for Phase 16A.2  
**Governance:** This framework governs ALL future model versions

---

## Executive Summary

This document defines **how CaddieIQ will scientifically measure whether Version 2 is better than Version 1.**

Every model change must pass this framework before production release. No algorithm advances without measurable evidence.

The framework is organized into 6 evaluation domains:
- **Course Fit** (primary: ranking accuracy)
- **Tournament Prediction** (secondary: field strength prediction)
- **DFS Performance** (tertiary: salary efficiency)
- **Betting Performance** (tertiary: odds calibration)
- **Explainability** (tertiary: explanation quality)
- **Confidence** (tertiary: uncertainty quantification)

---

## 1. Course Fit Evaluation

**Goal:** Measure how well the matching engine ranks players relative to actual tournament outcomes.

### Success Metrics

**Primary Metrics:**
- **Rank Correlation (Spearman)** — How well predicted rank matches actual finish
  - Target V1: 0.35+
  - Target V2: 0.45+
  - Baseline: 0.20 (recent form only)
  
- **Rank Correlation (Kendall Tau)** — Non-parametric rank agreement
  - Target: Slightly lower than Spearman (more conservative)
  
- **NDCG@5** — Normalized Discounted Cumulative Gain (top 5 ranking quality)
  - Target V1: 0.55+
  - Target V2: 0.65+
  - Measures: How well top 5 predictions compress actual top 5

- **NDCG@10** — Top 10 ranking quality
  - Target V1: 0.50+
  - Target V2: 0.60+

**Secondary Metrics:**
- **Top-5 Hit Rate** — % of actual top-5 finishers predicted in top 10
  - Target V1: 45%+
  - Target V2: 55%+
  
- **Top-10 Hit Rate** — % of actual top-10 finishers predicted in top 20
  - Target V1: 50%+
  - Target V2: 60%+

- **Cut Prediction Accuracy** — How well we predict who makes/misses cut
  - Target V1: 72%+
  - Target V2: 78%+

**Segmentation Metrics (to prevent averaging):**
- By course difficulty (easy/medium/hard)
- By field strength (weak/medium/strong)
- By major championships vs. regular events
- By venue type (links/parkland/desert)
- By player skill quartile (elite/strong/average/weak)

### Business Alignment

- **Why:** Ranking accuracy is the primary value proposition for players researching courses
- **Stakes:** Accuracy that exceeds Vegas odds creates competitive advantage
- **Threshold:** Must beat DataGolf public rankings or market credibility suffers

---

## 2. Tournament Prediction Evaluation

**Goal:** Evaluate how well the matching engine predicts tournament-level outcomes (field strength, winner characteristics, field distribution).

### Success Metrics

**Field Strength Prediction:**
- **Scoring Difficulty vs. Prediction** — How well our predicted field quality matches actual scoring
  - Measured as correlation between predicted field average and actual scoring average
  - Target: 0.60+

**Winner Characteristics:**
- **Top Finish Profile Match** — Do actual winners match predicted winner profile?
  - Top 1 finisher skill assessment accuracy
  - Top 10 average skill vs. prediction
  - Target: 70%+ consistency

**Field Distribution:**
- **Score Distribution Prediction** — How well we predict tournament score distribution
  - Actual vs. predicted: scores under par, par, over par
  - Target: Within 3% accuracy

---

## 3. DFS Performance Evaluation

**Goal:** Measure how well the matching engine performs in DFS environments (contest context, salary optimization, value scoring).

### Success Metrics

**Salary Efficiency:**
- **DFS Value Score** (Core Metric)
  - Formula: (Predicted Points) / (Salary) × 10,000
  - Compare: Our predictions vs. actual DFS outcomes
  - Target V1: 1.5x Vegas odds accuracy
  - Target V2: 2.0x Vegas odds accuracy

- **Salary-Adjusted ROI**
  - Track model performance across different salary tiers
  - Ensure high-salary and low-salary picks both improve

**Contest Performance:**
- **Tournament Win Rate** — % of contests won by our top picks
  - Track across 100-entry contests, 1,000-entry contests, GPPs
  - Target: 5-8% win rate (vs. 1% random baseline)

- **Cash Rate** — % of lineups that cash (top 50%)
  - Target: 60%+ (vs. 50% random baseline)

**GPP Performance:**
- **Max Value Coverage** — How often our picks are in GPP-winning lineups
  - Track actual GPP winners and measure overlap with our model recommendations

---

## 4. Betting Performance Evaluation

**Goal:** Measure how well the matching engine calibrates against sportsbook odds.

### Success Metrics

**Prediction vs. Odds:**
- **Odds Calibration**
  - When we say 8:1, do those players actually win 1 in 9?
  - Measure actual win % vs. implied probability
  - Target: ±2% calibration error

- **Expected Value (EV)**
  - If we identify +EV bets vs. Vegas, what's our actual ROI?
  - Track: To-Win bets, Top-5, Top-10, Top-20
  - Target V1: +5% ROI on identified edge
  - Target V2: +10% ROI on identified edge

**Regression Testing:**
- **No Odds Breakage** — Don't create negative EV in categories where we had edge before
- **Consistency** — EV should hold across different books

---

## 5. Explainability Evaluation

**Goal:** Measure the quality, truthfulness, and consistency of generated explanations.

### Success Metrics

**Explanation Properties:**
- **Truthfulness** — Each explanation must reference actual scoring data
  - No statement without data backing
  - No contradictions vs. scoring profile
  - Target: 100% truthful (0% false statements)

- **Consistency** — Same player/course always generates same core explanation (if data unchanged)
  - Run same evaluation 10 times
  - Measure explanation stability
  - Target: 95%+ consistency

- **Relevance** — Do explanations reflect actual match score drivers?
  - Extract top 3 factors from explanation
  - Check if those are actually top 3 factors in score formula
  - Target: 80%+ relevance

**Explanation Coverage:**
- **Components Explained** — Does explanation cover all major score components?
  - Skill fit explanation
  - Form bonus reasoning
  - Venue history context
  - Confidence statement
  - Risk assessment
  - Target: All 5 components in 95% of explanations

---

## 6. Confidence Evaluation

**Goal:** Measure whether stated confidence levels are statistically deserved.

### Success Metrics

**Confidence Calibration:**
- **Calibration Curve** — Plot predicted confidence vs. actual outcome variance
  - Divide predictions into confidence deciles
  - For high-confidence predictions, measure actual accuracy
  - Target: High confidence → High accuracy (linear relationship)

- **Reliability Diagram**
  - Predicted vs. observed frequency
  - Perfect calibration: y=x line
  - Target: Within ±5% of perfect calibration

**Confidence Components:**
- **Coverage Confidence Validation**
  - High coverage confidence → Low data gaps
  - Measurement: Do high-coverage players actually have better prediction accuracy?
  - Target: 70%+ correlation

- **Signal Quality Confidence Validation**
  - High quality confidence → Low measurement noise
  - Measurement: Do high-quality signals actually reduce prediction variance?
  - Target: 65%+ correlation

- **Overconfidence Detection**
  - Identify cases where confidence > accuracy
  - Should be rare (target: <10% of cases)

---

## Version Promotion Gates

Each metric must pass specific thresholds before promotion to next stage:

| Stage | Gate | Requirement |
|-------|------|-------------|
| Development | Basic Pass | All metrics non-negative |
| Experimental | Statistical Significance | p < 0.05 on primary metrics |
| Internal Test | Improvement Verified | 2%+ improvement over baseline |
| Historical | No Regression | No metric worse than production |
| Candidate | Business Approved | Leadership approves metric improvements |
| Production | Performance Baseline | Real-time SLA met (50ms for 10k players) |
| Stable | 30-day Hold | No performance degradation in production |

---

## Anti-Patterns to Prevent

❌ **Metric Gaming** — Optimizing for metric, not outcome
- Prevention: Multiple independent metrics for each domain
- Review: Ensure metric improvements align with business value

❌ **Statistical Noise** — Small sample, false significance
- Prevention: Minimum sample sizes (see Phase 16A.2 dataset spec)
- Review: Power analysis required for all new metrics

❌ **Publication Bias** — Only reporting positive results
- Prevention: Pre-register all metrics before evaluation
- Review: Report all metrics, including regressions

❌ **P-Hacking** — Multiple comparisons inflate false positives
- Prevention: Bonferroni correction for multiple tests
- Review: Significance threshold adjusted for metric count

---

## Success Definition

### Version 1 Launch Readiness

Version 1 is ready to launch when:

✅ Course Fit Rank Correlation ≥ 0.35 (Spearman)  
✅ All secondary metrics pass thresholds  
✅ No unverified confidence claims  
✅ All explanations are truthful  
✅ All gates passed in promotion lifecycle  
✅ Historical backtesting complete  
✅ No regression vs. baseline models  

### Version 2+ Advancement Criteria

Version 2+ advancement requires:

✅ 2%+ improvement on primary metric over V1  
✅ No regression on any secondary metric  
✅ Confidence calibration maintained or improved  
✅ Explanation quality maintained or improved  
✅ All gates passed  
✅ Historical backtesting on new dataset  

---

## Framework Evolution

This framework is itself versioned:

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-20 | Initial framework for V1 launch |
| 1.1 | TBD | Added DFS metrics |
| 1.2 | TBD | Added betting metrics |
| 2.0 | TBD | Added ML-specific metrics |

---

**This framework is the scientific constitution of the matching engine. All future versions are bound by it.**
