# Model Promotion Policy

**Author:** Chief Technology Officer  
**Date:** 2026-07-20  
**Purpose:** Define the lifecycle for model version progression through development to production

---

## Version Lifecycle

Every matching engine version follows this strict progression:

```
Development
    ↓
Experimental
    ↓
Internal Testing
    ↓
Historical Benchmark
    ↓
Candidate
    ↓
Production (Stable)
    ↓
Retired
```

---

## Stage 1: Development

**Purpose:** Build and iterate on the model.

**Conditions:**
- No user exposure
- No performance guarantees
- Rapid iteration encouraged

**Promotion Requirement to Experimental:**
- ✅ All baseline models available
- ✅ All evaluation metrics code written
- ✅ Model demonstrates improvement on development dataset (not held-out)

**Timeline:** 2-4 weeks

---

## Stage 2: Experimental

**Purpose:** Test on held-out data, identify overfitting.

**Conditions:**
- Still no user exposure
- Uses rolling window validation (prevents look-ahead bias)
- Measures against baselines

**Promotion Requirement to Internal Testing:**
- ✅ 5%+ improvement over baseline on held-out data
- ✅ No regression on any metric
- ✅ Statistical significance p<0.05
- ✅ Reproducible results (run twice, results match)

**Timeline:** 1-2 weeks

---

## Stage 3: Internal Testing

**Purpose:** Validate in realistic conditions with team feedback.

**Conditions:**
- Deployed to internal tools only
- Team uses model for analysis/predictions
- Collects qualitative feedback
- Monitors real-time performance

**Promotion Requirement to Historical Benchmark:**
- ✅ Team feedback positive (no major issues raised)
- ✅ No crashes or errors in production code
- ✅ Performance meets latency targets (50ms for 10k players)
- ✅ Explanations credible to human review

**Timeline:** 1-2 weeks

---

## Stage 4: Historical Benchmark

**Purpose:** Rigorous scientific validation on complete historical dataset.

**Conditions:**
- Full historical dataset (2021-2025, 378 tournaments)
- All evaluation metrics reported
- All regression tests performed
- Leadership review required

**Promotion Requirement to Candidate:**
- ✅ Spearman Correlation ≥ 0.35 (for V1) or 2%+ improvement (for V2+)
- ✅ All secondary metrics pass thresholds
- ✅ No regression below prior version
- ✅ Confidence calibration acceptable
- ✅ Explanations truthful and consistent
- ✅ Leadership approval obtained (data scientist + CTO + CEO)

**Timeline:** 2 weeks

---

## Stage 5: Candidate

**Purpose:** Pre-production staging area with real-time monitoring.

**Conditions:**
- Deployed to shadow production environment
- Processes real incoming tournament data
- Monitors actual vs. predicted performance
- Compare against current production in parallel

**Promotion Requirement to Production:**
- ✅ 30 days of data collected (or 3 tournaments minimum)
- ✅ Real-time performance matches historical projections (within 3%)
- ✅ No unexplained anomalies or failures
- ✅ Monitoring dashboards operational
- ✅ Rollback procedure tested and ready
- ✅ All stakeholders ready for launch

**Timeline:** 30 days (or 3+ real tournaments)

---

## Stage 6: Production (Stable)

**Purpose:** Live serving users.

**Conditions:**
- Deployed to all users
- Monitoring 24/7
- Alerts for anomalies
- Daily performance review

**Stability Metrics (to maintain Production status):**
- ✅ No regression below baseline on any metric
- ✅ <1 hour downtime per month
- ✅ All explanations remain truthful
- ✅ User complaints <1% of predictions

**If Stability Metrics Violated:**
- Alert team immediately
- Investigate root cause
- Potentially revert to prior version
- Address issue
- Re-benchmark if needed

**Timeline:** Until next version ready

---

## Stage 7: Retired

**Purpose:** Archive old versions for historical reference.

**Conditions:**
- Version has been replaced in production
- Kept for 1 year for historical comparison
- Cannot be promoted back to production

---

## Fast-Track Demotion

**If a version fails at any stage:**

❌ **Experimental Failure**
- Return to Development
- Identify issue
- Restart Experimental stage

❌ **Internal Testing Failure**
- Revert to previous stable version in Internal Testing
- Debug issue
- Restart Internal Testing after fix

❌ **Historical Benchmark Failure**
- Return to Internal Testing
- Address specific benchmark issues
- Re-benchmark before Candidate

❌ **Candidate Failure**
- Revert to Production version immediately
- Do not proceed to Production
- Investigate and fix issues
- Start over at Historical Benchmark

❌ **Production Failure**
- Revert to prior Production version immediately (within 1 hour)
- Escalate issue
- Root cause analysis
- Fix required before re-attempting

---

## Version Tagging

Every version is tagged in git:

```
v1.0-dev: Initial development
v1.0-exp-1: First experimental build
v1.0-internal-1: First internal testing
v1.0-candidate-1: First candidate
v1.0: Production release
v1.1-dev: Development of v1.1
v1.1-exp-1: Experimental v1.1
...
```

---

## Historical Comparison

When promoting V2+, must compare against:

- ✅ Current Production version
- ✅ Last-Known-Good version (if reverted)
- ✅ Best Historical version (best ever)

**Example:**

```
V1.0: Production (Correlation 0.38)
V2.0 Candidate: Correlation 0.40

V2.0 vs. V1.0: +0.02 improvement ✅
V2.0 vs. Best: +0.03 improvement ✅
→ Approved for Production
```

---

## Promotion Authority

| Promotion | Authority | Sign-off Required |
|-----------|-----------|------------------|
| Dev → Exp | Data Scientist | 1 person |
| Exp → Internal | Data Scientist + Product | 2 people |
| Internal → Benchmark | Principal Data Scientist | 1 person |
| Benchmark → Candidate | CTO + Principal Data Scientist | 2 people |
| Candidate → Production | CEO + CTO + Product | 3 people |
| Production → Retired | CTO | 1 person |

---

## No Version Jumping

**Rule:** Cannot skip stages.

❌ Cannot go Development → Production (requires path through 5 stages)  
❌ Cannot go Experimental → Candidate (requires Internal Testing + Benchmark)  
✅ Can go Experimental → Development if issues found  
✅ Can revert any version to prior version  

---

**This policy ensures every production version has been rigorously tested, measured, and approved.**
