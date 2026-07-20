# Version 1 Benchmark Plan

**Author:** Principal Data Scientist  
**Date:** 2026-07-20  
**Purpose:** Exact benchmark procedure Version 1 must execute before launch

---

## Overview

This document specifies the **exact steps** Version 1 of the matching engine must complete to prove readiness for production.

No shortcuts. No exceptions. This is the gate.

---

## Pre-Benchmark Verification (Week 1 of Phase 16B)

**Before any evaluation begins:**

- [ ] Historical dataset audit complete (HISTORICAL_DATASET_SPECIFICATION.md)
- [ ] Dataset contains 378+ tournaments (2021-2025)
- [ ] 18,500+ player-tournament records
- [ ] All metrics code written and tested
- [ ] Baseline models implemented and validated
- [ ] Evaluation framework code reviewed
- [ ] Regression testing procedure documented

**Owner:** Lead Data Scientist  
**Timeline:** 3 days  
**Blockers:** Must resolve before proceeding

---

## Evaluation Phase (Weeks 2-4 of Phase 16B)

### Phase 1: Baseline Model Validation

**Objective:** Confirm baseline models are correctly implemented.

**Steps:**

1. **SG Composite Baseline (Baseline 5)**
   - Calculate 52-week rolling SG average for all 18,500 records
   - Rank players by SG Composite
   - Measure Rank Correlation vs. actual
   - **Expected:** 0.28-0.32
   - **If result outside range:** Debug baseline, do not proceed

2. **Vegas Odds Baseline (Baseline 7)**
   - Obtain opening Vegas odds for 50 tournaments
   - Convert to implied probability
   - Rank by probability
   - Measure Rank Correlation
   - **Expected:** 0.38-0.45
   - **If result outside range:** Investigate odds data source

3. **DataGolf Baseline (Baseline 6)**
   - Retrieve DataGolf historical rankings for 50 tournaments
   - Measure Rank Correlation
   - **Expected:** 0.32-0.38

**Owner:** Analytics Lead  
**Timeline:** 1 week  
**Success Criteria:** All baselines within expected ranges

### Phase 2: Version 1 Evaluation

**Objective:** Measure CaddieIQ V1 performance against baselines.

**Steps:**

1. **Rolling Window Evaluation**
   - For each tournament 2021-2025:
     - Use data through 14 days before tournament
     - Generate predictions for all players in field
     - Measure against actual results
   - **Sample Size:** 378 tournaments

2. **Primary Metrics Calculation**
   - Spearman Rank Correlation
   - NDCG@5, NDCG@10
   - Top-5 Hit Rate
   - Top-10 Hit Rate
   - Cut Prediction Accuracy

3. **Segmentation Analysis**
   - By course difficulty (easy/medium/hard)
   - By field strength (elite/strong/medium/weak)
   - By event type (major/signature/regular)
   - By venue type (links/parkland/desert)
   - By player skill (elite/strong/average/weak)

4. **Statistical Significance**
   - 95% confidence intervals for all metrics
   - p-values vs. baselines
   - Power analysis for all tests

**Owner:** Principal Data Scientist  
**Timeline:** 2 weeks  
**Success Criteria:**

- [ ] Spearman Correlation ≥ 0.35 (vs. 0.30 baseline)
- [ ] NDCG@5 ≥ 0.55
- [ ] NDCG@10 ≥ 0.50
- [ ] Top-5 Hit Rate ≥ 45%
- [ ] Top-10 Hit Rate ≥ 50%
- [ ] Cut Accuracy ≥ 72%
- [ ] All improvements statistically significant (p<0.05)
- [ ] No regression below baseline in any segment

### Phase 3: Regression Testing

**Objective:** Ensure V1 doesn't break existing functionality.

**Steps:**

1. **Baseline Regression**
   - Compare V1 to SG Composite baseline
   - Ensure improvement on all 6 primary metrics
   - No metric should regress

2. **Vegas Odds Regression**
   - Compare V1 to Vegas odds baseline
   - Should not significantly underperform Vegas
   - Expected: ±3% deviation acceptable

3. **Historical Consistency**
   - Measure V1 performance across different seasons
   - Ensure no catastrophic drop in specific year
   - Acceptable: 2% variance across years

4. **Player Skill Consistency**
   - Measure across elite/strong/average/weak players
   - Should not systematically underperform any skill group
   - Acceptable: 5% variance by skill level

**Owner:** Analytics Lead  
**Timeline:** 3-4 days  
**Success Criteria:** All regression gates passed

---

## Acceptance Testing (Week 4 of Phase 16B)

### Explainability Validation

**Objective:** Ensure explanations are truthful, consistent, relevant.

**Steps:**

1. **Truthfulness Audit**
   - Generate explanations for 50 random predictions
   - Manual review: Flag any false statements
   - **Target:** 0 false statements (100% truthful)
   - **Acceptable:** 0 false statements
   - **Failure threshold:** >1 false statement

2. **Consistency Test**
   - Generate explanation for 10 random predictions 5 times each
   - Compare consistency
   - **Target:** 95%+ identical/equivalent explanations
   - **Acceptable:** 90%+
   - **Failure threshold:** <85%

3. **Relevance Assessment**
   - Extract top 3 factors from 30 explanations
   - Compare to actual top 3 score components
   - **Target:** 80%+ overlap
   - **Acceptable:** 75%+
   - **Failure threshold:** <70%

**Owner:** Product + Data Science  
**Timeline:** 1 week  
**Success Criteria:** All 3 tests pass

### Confidence Validation

**Objective:** Ensure confidence levels are calibrated.

**Steps:**

1. **Confidence Calibration**
   - Generate 1,000 predictions with confidence scores
   - Divide into 10 confidence deciles
   - For each decile, measure actual prediction accuracy
   - Plot predicted vs. actual confidence
   - **Target:** Linear relationship (R² > 0.85)
   - **Acceptable:** R² > 0.80
   - **Failure threshold:** R² < 0.70

2. **Overconfidence Detection**
   - Measure cases where confidence > actual accuracy
   - **Target:** <10% overconfidence
   - **Acceptable:** <15%
   - **Failure threshold:** >20%

**Owner:** Principal Data Scientist  
**Timeline:** 3-5 days  
**Success Criteria:** Both calibration tests pass

---

## Leadership Review (Week 5 of Phase 16B)

**Required Sign-offs:**

- [ ] Principal Data Scientist: Model performance adequate
- [ ] VP Engineering: No technical blockers
- [ ] Product Manager: Metrics meet business requirements
- [ ] CEO: Ready for market launch

**Decision Points:**

**✅ PASS:** All metrics meet targets, all gates passed, all sign-offs obtained  
→ Proceed to production launch

**⚠️ CONDITIONAL PASS:** 1-2 metrics slightly below target, all gates passed, leadership approves  
→ Proceed with known limitations, plan mitigation for V2

**❌ FAIL:** >2 metrics below target, OR regression detected, OR gates not passed  
→ Return to Phase 16B development, identify issues, iterate

---

## Launch Preparation (Week 6 of Phase 16B)

**If PASS or CONDITIONAL PASS:**

- [ ] Production deployment procedure documented
- [ ] Monitoring dashboards configured
- [ ] Fallback procedures if V1 underperforms
- [ ] Baseline comparison dashboard live
- [ ] User communication prepared
- [ ] Launch date confirmed

---

## Post-Launch Monitoring (Week 1+ of Deployment)

**After V1 Goes Live:**

- [ ] Daily dashboard review (is performance matching expected?)
- [ ] Weekly metric tracking (trends over time)
- [ ] User feedback collection (is ranking quality matching expectations?)
- [ ] Anomaly detection (if metric drops 5%+, alert team)
- [ ] Rollback procedure ready (if critical issue)

**30-Day Holdout:** No Phase 16B changes for 30 days post-launch to establish baseline.

---

## Budget & Timeline

**Total Benchmark Timeline:** 6 weeks (assuming sequential Phase 16B)

| Phase | Timeline | Budget (Hours) | Owner |
|-------|----------|----------------|-------|
| Pre-Benchmark | Week 1 | 60 | Data Science |
| Baseline Validation | Week 2 | 80 | Analytics |
| V1 Evaluation | Weeks 3-4 | 200 | Data Science |
| Regression Testing | Week 4 | 60 | Analytics |
| Explainability | Week 4 | 80 | Data Science |
| Confidence | Week 4 | 60 | Data Science |
| Leadership Review | Week 5 | 40 | All |
| Launch Prep | Week 6 | 60 | Ops |
| **TOTAL** | **6 weeks** | **640 hours** | — |

---

## Decision Criteria

**V1 Benchmark PASS Requires:**

✅ Spearman Correlation ≥ 0.35  
✅ NDCG@5 ≥ 0.55  
✅ Top-5 Hit Rate ≥ 45%  
✅ All improvements statistically significant (p<0.05)  
✅ No regression below SG Composite baseline  
✅ Explanations 100% truthful  
✅ Confidence calibration R² ≥ 0.80  
✅ All leadership sign-offs obtained  

**If any requirement fails: Return to Phase 16B development.**

---

## Version 1 Success

Upon completion of this benchmark plan and approval of all gates:

✅ **Version 1 is production-ready**  
✅ **Can launch to market**  
✅ **Positioned for competitive advantage vs. baselines**  
✅ **Ready to pursue Phase 16B improvements**  

---

**This plan is the gate. Execute it completely. Do not launch without passing.**
