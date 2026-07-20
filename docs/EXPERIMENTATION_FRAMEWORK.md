# EXPERIMENTATION FRAMEWORK

Safe parallel testing of new models and features.

## Experimentation Modes

### Mode 1: Shadow Mode (Silent Evaluation)
- New version runs but predictions not shown
- Compared vs production version
- No user impact
- Duration: 1-4 weeks
- Metrics: Match rate, distribution, anomalies

### Mode 2: Feature Flag (Selective Users)
- New version shown to 5% of users
- Rest see production version
- User experience impact minimal
- Duration: 1-2 weeks
- Metrics: User feedback, adoption

### Mode 3: A/B Test (Champion vs Challenger)
- 50% users see version A
- 50% users see version B
- Randomized assignment
- Duration: 2-4 weeks
- Metrics: Accuracy, user preference

### Mode 4: Challenger Scenario (Defined Segments)
- Version A for segment X
- Version B for segment Y
- Predetermined split
- Duration: 4+ weeks
- Metrics: Segment-specific performance

## Experimentation Requirements

### Before Any Experiment
1. Clear hypothesis (what are we testing?)
2. Success criteria (how do we measure?)
3. Duration (how long will it run?)
4. Sample size (how many users?)
5. Rollback plan (what if it fails?)
6. Monitoring (what do we watch?)

### During Experiment
1. Daily monitoring (manual review)
2. Automated alerts (anomaly detection)
3. Statistical tracking (confidence intervals)
4. User feedback (are people happy?)
5. Ready to rollback (always prepared)

### After Experiment
1. Analyze results (did it work?)
2. Statistical test (significance?)
3. Decision (promote, iterate, reject?)
4. Document findings
5. Archive results

## Experimentation Governance

### Approval Required
- Data Scientist: Hypothesis and metrics sound?
- ML Lead: Experimental design sound?
- Product: Business value clear?
- CTO: Safe to roll out?

### Automatic Rollback
- Correlation drops > 5%: Automatic rollback
- Anomalies detected: Manual review
- User satisfaction drops: Investigate
- Errors increase > 2%: Rollback immediately

### Experimentation Metrics
- Match rate vs production
- Correlation with baselines
- Distribution of scores
- Prediction latency
- User satisfaction
- Adoption rate

## Experimentation Examples

### Example 1: Test New Feature
```
Hypothesis: Adding "course_year_opened" improves venue predictions
Experiment: Shadow mode, 4 weeks
Control: v1.1.0 (production)
Treatment: v1.1.1 (with new feature)
Metrics: Venue prediction accuracy (+5% target)
Result: +3% improvement, statistically significant → Promote to v1.1.2
```

### Example 2: Test ML Weights
```
Hypothesis: Gradient boosted weights beat hand-tuned weights
Experiment: A/B test, 2 weeks
Control: v1.x (hand-tuned)
Treatment: v2.0-beta (ML-optimized)
Sample: 50/50 random split
Metrics: Overall correlation (target: +7%)
Result: +6% improvement → Promote to v2.0 candidate phase
```

### Example 3: Test for Regression
```
Hypothesis: v1.1.2 introduced bug in putting predictions
Experiment: Challenger mode, 1 week
Production: v1.1.1 for 80%
Investigation: v1.1.2 for 20%
Metrics: Putting prediction accuracy, user complaints
Result: v1.1.2 worse → Rollback, debug, release v1.1.3
```

## Feature Flags

Separate feature deployment from model deployment.

**Feature Flags for:**
- New explanation template (old vs new)
- New confidence calculation (v1 vs v2)
- New score component (on vs off)
- Algorithm parameter (tuned vs default)

**Flag Lifecycle:**
1. Development: Disabled by default
2. Testing: Enable for internal
3. Beta: Enable for 5% users
4. Rollout: Enable for 25%, 50%, 100%
5. Stabilize: Remove flag (default on)
6. Cleanup: Remove flag code

## Experimentation Limits

### Single Experiment
- Maximum duration: 8 weeks
- Minimum sample size: 1% of users
- Maximum affected: 50% for A/B, higher for shadow

### Overlapping Experiments
- Maximum concurrent: 3 experiments
- Must use different user segments
- Cannot interfere with each other

### Risky Experiments
- Require VP Engineering approval
- Must have rollback procedure
- Must have fallback logic
- Must have incident response plan

## Experimentation Documentation

### Required Before Start
- Hypothesis document
- Metrics specification
- Sample size calculation
- Rollback procedure
- Communication plan

### Required During
- Daily status (automated)
- Weekly report (manual)
- Incident log (if any)
- User feedback

### Required After
- Final report (results)
- Statistical analysis
- Promotion decision
- Lessons learned
