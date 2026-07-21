# ARCHITECTURE INVARIANTS

Rules that can NEVER be violated. The constitution of CaddieIQ governance.

## Invariant 1: No Prediction Without Version

**Rule:** Every prediction must include model version.

**Why:** Enables reproducibility and traceability.

**Enforcement:**
- Prediction object requires version field
- No version = no score returned
- API rejects unversioned requests

**Violation Example:**
```python
# WRONG - This cannot happen
score = compute_score(player_id, course_id)  # No version!

# CORRECT - Always include version
score = compute_score(player_id, course_id, version="1.2.0")
```

---

## Invariant 2: No Explanation Without Evidence

**Rule:** Every explanation must cite the input features that led to it.

**Why:** Users must understand why scores are generated.

**Enforcement:**
- Explanation must reference at least 3 specific inputs
- Example: "Rory's strong SG App (top 2%) combined with poor venue history here"
- False statements rejected (audit trail)

---

## Invariant 3: No Confidence Without Provenance

**Rule:** Confidence score must come from documented calculation method.

**Why:** Confidence represents data quality; must be defensible.

**Enforcement:**
- Confidence calculated per CONFIDENCE_FRAMEWORK.md
- Version tagged for calculation method
- Validation required before deployment

---

## Invariant 4: No Benchmark Skipping

**Rule:** Every production model must pass all 26 acceptance gates.

**Why:** Quality assurance prevents bad releases.

**Enforcement:**
- Cannot deploy without documented gate results
- Must pass minimum thresholds (correlation ≥0.35)
- Exception process: CTO + CEO approval only

---

## Invariant 5: No Silent Score Changes

**Rule:** Score formula changes must be version-controlled and logged.

**Why:** Users expect predictions to remain stable within a version.

**Enforcement:**
- Score formula locked at version creation
- Any formula change = new version required
- Calibration changes tracked separately

---

## Invariant 6: No Overwriting Historical Predictions

**Rule:** Historical predictions are immutable.

**Why:** Enables accountability and historical accuracy.

**Enforcement:**
- Historical table immutable (database constraint)
- New predictions create new records
- Modifications create new versions

---

## Invariant 7: No Model Activation Without Approval

**Rule:** Only approved models can be deployed to production.

**Why:** Prevents rogue releases.

**Enforcement:**
- Deployment requires CTO + Product sign-off
- Automatic checks: gates passed, no regressions
- Audit trail logs all approvals

---

## Invariant 8: No Rollback Without Traceability

**Rule:** Rollback must be logged with reason, timestamp, and impact.

**Why:** Incident response and audit compliance.

**Enforcement:**
- Rollback action creates audit entry
- Reason required (field)
- Impact estimation performed
- All stakeholders notified

---

## Invariant 9: Every Feature Has Owner

**Rule:** Feature registry must list owner for every feature.

**Why:** Accountability for data quality and maintenance.

**Enforcement:**
- FEATURE_GOVERNANCE.md specifies every owner
- Owner contacted for modification approval
- Unowned features blocked from production

---

## Invariant 10: Every Build Is Reproducible

**Rule:** Every score can be recreated from its build ID.

**Why:** Enables historical validation and scientific reproducibility.

**Enforcement:**
- Build manifest complete (all versions)
- Build hash computed and verified
- Artifact storage redundant
- Reproducibility test passed

---

## Invariant 11: Version Numbers Follow Semantic Versioning

**Rule:** MAJOR.MINOR.PATCH with defined meaning.

**Why:** Users can understand compatibility from version number alone.

**Enforcement:**
- Version format enforced by schema
- Breaking changes MUST increment MAJOR
- Features MUST increment MINOR
- Patches MUST NOT change logic

---

## Invariant 12: No Feature Deprecation Without Notice

**Rule:** 30-day minimum deprecation period before feature removal.

**Why:** Allows dependent systems time to migrate.

**Enforcement:**
- Deprecation date set
- User communication sent
- Migration path provided
- Usage monitored

---

## Invariant 13: Confidence Is Orthogonal to Accuracy

**Rule:** High confidence does not mean high accuracy; measure separately.

**Why:** Prevents false precision and user overconfidence.

**Enforcement:**
- Confidence = data quality
- Accuracy = prediction correct
- Always displayed separately
- Cannot be conflated

---

## Invariant 14: Historical Explanations Remain Valid

**Rule:** Old explanations must still explain old scores.

**Why:** Users want to understand past predictions.

**Enforcement:**
- Explanation versioned
- Historical explanations never deleted
- Explainability engine version immutable
- Can recreate historical explanation

---

## Invariant 15: No Backdating of Scores

**Rule:** Predictions use data as-of scoring date (14-day look-ahead cutoff).

**Why:** Prevents look-ahead bias and ensures fair evaluation.

**Enforcement:**
- Scoring date locked
- Cannot use future data
- Enforced at prediction time
- Audit trail verifies

---

## Enforcement Mechanisms

### Automatic
- API validation (version required)
- Database constraints (immutability)
- Code review (no feature removal)

### Manual
- Approval gates (gates must pass)
- Governance board (major decisions)
- Audit reviews (quarterly)

### Detection
- Monitoring dashboards (track metrics)
- Regression testing (catch changes)
- Alert thresholds (anomaly detection)

---

## Violation Response

If invariant violated:

1. **Immediate:** Disable affected component
2. **Alert:** Page on-call engineer
3. **Review:** Incident post-mortem
4. **Correct:** Fix root cause
5. **Prevent:** Add detection to prevent recurrence
6. **Document:** Invariant clarification if ambiguous

---

## Invariant Evolution

These invariants are permanent. Cannot be removed or weakened.

Can be clarified or refined, but only by:
1. Architecture Review Board approval
2. CTO + CEO sign-off
3. Team-wide discussion
4. Documentation update

No invariant can be suspended or waived.
