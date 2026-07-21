# Engineering Dashboards Specification

**Author:** Lead Analytics Engineer  
**Date:** 2026-07-20  
**Purpose:** Define internal dashboards for monitoring and validating matching engine performance

---

## Dashboard 1: Model Accuracy Dashboard (Daily)

**Purpose:** Track core model performance metrics over time.

**Update Frequency:** Daily (after each tournament)

**Metrics Displayed:**

- Spearman Rank Correlation (trended)
- NDCG@5 (trended)
- NDCG@10 (trended)
- Top-5 Hit Rate (trended)
- Top-10 Hit Rate (trended)
- Cut Prediction Accuracy (trended)

**Segmentation Options:**

- By tournament date (show trend)
- By course difficulty
- By field strength
- By event type

**Alerts:**

- If any metric drops >5% vs. prior week → Alert
- If correlation drops below 0.30 → Critical alert
- If confidence calibration error exceeds 7% → Alert

**Example View:**

```
SPEARMAN RANK CORRELATION TREND
────────────────────────────────
Current: 0.38 ✅
Last Week: 0.38 (no change)
30-Day Avg: 0.37
Target: 0.35+

CHART: Line graph showing daily correlation for last 90 days
  [0.35 ──────────┬──────────]
  [0.30 ─────────/█\─────────]
  [0.25 ────────/   \────────]
         Last 90 Days

Status: Stable ✅
```

---

## Dashboard 2: Benchmark Comparison Dashboard

**Purpose:** Compare current production model vs. all baseline models.

**Update Frequency:** Weekly (benchmark run once per week)

**Comparisons:**

| Model | Correlation | Top-5 Hit % | Top-10 Hit % | vs. Production |
|-------|-------------|-------------|--------------|----------------|
| Random | 0.00 | 4% | 9% | -100% |
| World Ranking | 0.22 | 28% | 33% | -42% |
| Recent Form | 0.25 | 30% | 38% | -34% |
| SG Composite | 0.30 | 34% | 40% | -21% |
| DataGolf | 0.35 | 40% | 45% | -8% |
| **CaddieIQ V1** | **0.38** | **48%** | **52%** | **BASE** |
| Vegas Odds | 0.42 | 52% | 56% | +11% |
| Expert | 0.33 | 38% | 45% | -13% |

**Alerts:**

- If CaddieIQ drops below any baseline → Critical alert
- If gap to Vegas closes < 5% → Alert (edge diminishing)

---

## Dashboard 3: Regression Dashboard (Hourly)

**Purpose:** Detect algorithmic regressions in real-time.

**Update Frequency:** After each prediction batch (real-time during events)

**Metrics:**

- Confidence drift (rolling 100-prediction window)
- Ranking stability (compare prediction-to-prediction)
- Explanation consistency (are explanations changing?)
- Performance vs. 7-day baseline

**Alerts:**

- If any metric deviates >10% from baseline → Alert
- If explanations become inconsistent → Alert
- If confidence suddenly drops → Alert

**Example:**

```
REAL-TIME PERFORMANCE MONITORING
─────────────────────────────────

Last 100 Predictions:
  Confidence avg: 0.62 (baseline: 0.61) ✅
  Ranking stability: 94% (baseline: 96%) ⚠️
  Explanation changes: 2% (baseline: <1%) ⚠️

Status: ACCEPTABLE (minor deviations, no alerts)
```

---

## Dashboard 4: Confidence Calibration Dashboard

**Purpose:** Monitor if confidence levels remain calibrated.

**Update Frequency:** Daily (after sufficient predictions)

**Metrics:**

- Calibration curve (predicted vs. actual accuracy)
- Overconfidence rate (predictions where conf > accuracy)
- Underconfidence rate (predictions where conf < accuracy)
- Coverage confidence correlation
- Signal quality confidence correlation

**Visualization:**

```
CONFIDENCE CALIBRATION

Actual Accuracy
     ▲
  95 │  ✅
  85 │  ✅ ─ Perfect calibration line
  75 │✅
  65 │✅
  55 │✅
  45 │✅
  35 │✅
  25 │✅
  15 │✅
   5 │✅
     └───────────────────────> Predicted Confidence

Calibration Error: 4% ✅ (target ≤5%)
Overconfidence: 8% ✅ (target <10%)
```

**Alerts:**

- If calibration error exceeds 7% → Alert
- If overconfidence exceeds 15% → Alert
- If correlation drops below 0.70 → Alert

---

## Dashboard 5: Version Comparison Dashboard

**Purpose:** Compare current production version vs. candidate version (before promotion).

**Update Frequency:** Real-time during evaluation

**Comparison Metrics:**

| Metric | Production | Candidate | Improvement | Status |
|--------|------------|-----------|-------------|--------|
| Spearman | 0.38 | 0.39 | +0.01 (+2.6%) | ✅ |
| NDCG@5 | 0.55 | 0.56 | +0.01 (+1.8%) | ✅ |
| Top-5 Hit % | 48% | 49% | +1% | ✅ |
| Confidence Cal | 4% error | 3% error | -1% | ✅ |
| Latency | 450ms | 460ms | +10ms | ⚠️ |

**Gate Status:**

- [ ] ≥2% improvement on primary metric
- [ ] No regression on secondary metrics
- [ ] Latency within acceptable range
- [ ] All regression tests pass

**Decision:**

- All gates pass → Ready for promotion
- Gates not pass → Return to development

---

## Dashboard 6: Feature Drift Dashboard

**Purpose:** Detect changes in input features that might affect model.

**Update Frequency:** Weekly

**Monitored:**

- Player SG distribution (is recent form changing dramatically?)
- Course difficulty distribution (are courses playing harder/easier?)
- Field strength distribution (are events stronger/weaker?)
- Withdrawal rates (are more players dropping out?)
- Data availability (are we losing data sources?)

**Example:**

```
FEATURE DRIFT ANALYSIS

Player SG Composite (last 30 tournaments):
  Mean: 0.82 (baseline: 0.85)
  StdDev: 1.43 (baseline: 1.40)
  Drift: -3.5% from baseline ⚠️

Interpretation:
  Players scoring slightly worse recently
  May indicate stronger fields or tougher setups
  Model should still perform well (accounts for difficulty)

Action: Monitor; no immediate action needed
```

**Alerts:**

- If any feature drifts >10% → Alert (investigate)
- If withdrawal rate doubles → Alert (data quality issue)
- If major data source becomes unavailable → Critical alert

---

## Dashboard 7: Historical Performance Dashboard

**Purpose:** Track long-term trends in model accuracy.

**Update Frequency:** Monthly

**Time Series:**

- 90-day accuracy trend
- Year-to-date performance
- Seasonal patterns (is model better in certain seasons?)
- Best/worst performing periods

**Comparison:**

- Current period vs. launch period (should be stable)
- Best historical period vs. current (is model degrading?)

**Example:**

```
HISTORICAL PERFORMANCE

2021: Avg Correlation 0.38 (established baseline)
2022: Avg Correlation 0.38 (maintained stable)
2023: Avg Correlation 0.39 (slight improvement)
2024: Avg Correlation 0.38 (returned to baseline)
2025 YTD: Avg Correlation 0.39 (on track)

Trend: Stable, consistent performance ✅
Conclusion: Model remains reliable 5 years post-launch
```

---

## Dashboard 8: User Experience Dashboard (Post-Launch)

**Purpose:** Monitor how real users are interacting with predictions.

**Update Frequency:** Weekly

**Metrics:**

- Prediction requests per day
- User acceptance rate (% of predictions user acts on)
- User satisfaction (ratings, feedback)
- Appeal rate (% of predictions user challenges)
- Conversion (% of predictions that result in player selection)

**Example:**

```
WEEKLY USER ENGAGEMENT

Total Predictions: 12,450
Viewed: 11,200 (90%)
Acted Upon: 8,900 (79%)
User Satisfaction: 4.2/5.0 ⭐
Appeals: 45 (0.4%)

Trend: Improving acceptance rate (78% → 79%)
Conclusion: Users increasingly trusting predictions ✅
```

---

## Dashboard Access

**Internal Only** (not for public)

- Data Science team: All dashboards
- Analytics team: Accuracy, Benchmark, Regression
- Engineering team: Performance, Feature Drift
- Leadership: Accuracy, Benchmark, Version Comparison
- On-call: Regression, Confidence (real-time)

---

## Alert Thresholds

**Critical Alerts** (immediate page on-call):
- Correlation drops below 0.30
- Latency exceeds 2 seconds
- Confidence calibration error >10%
- Data source unavailable
- System down >1 hour

**High Alerts** (investigate same day):
- Correlation drops >5% vs. baseline
- Latency exceeds 1 second
- Overconfidence rate >15%
- Feature drift >10%
- Accuracy regression without explanation

**Medium Alerts** (investigate within 1 week):
- Correlation drops 2-5% vs. baseline
- Latency increased 100ms
- User satisfaction drops >0.5 points
- Explanation consistency <90%

---

## Dashboard Implementation

**Technology Stack:**

- Dashboard tool: Metabase or Grafana
- Data source: PostgreSQL (benchmark results)
- Update: SQL jobs on schedule
- Alerting: PagerDuty integration

**Cost:**

- Metabase: ~$5k/year for team
- Grafana: ~$3k/year for team
- Integration: ~40 hours engineering

---

**These dashboards are the control room. Glance at them daily. If red lights appear, pause and investigate.**
