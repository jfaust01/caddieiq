# MODEL GOVERNANCE DECISION RECORDS

Key decisions that define the governance model.

## Decision 1: Semantic Versioning for All Models

**Decision:** Use MAJOR.MINOR.PATCH for all model versioning.

**Rationale:**
- Clear compatibility semantics
- Industry standard
- Users understand implications
- Enables automation

**Status:** APPROVED

---

## Decision 2: Immutable Historical Predictions

**Decision:** Historical predictions can never be rewritten. New versions create new records.

**Rationale:**
- Accountability (who made this prediction?)
- Audit trail (full history preserved)
- Reproducibility (can verify any prediction)
- Prevents gaming (can't tweak history)

**Status:** APPROVED

---

## Decision 3: 26 Explicit Acceptance Gates

**Decision:** Every model must pass all 26 gates before production.

**Rationale:**
- Objective criteria (no "looks good enough")
- Multiple dimensions (prevents single-metric gaming)
- Prevents bad releases
- Leadership alignment

**Status:** APPROVED

---

## Decision 4: Build Reproducibility Mandatory

**Decision:** Every prediction must be recreatable from build ID.

**Rationale:**
- Scientific reproducibility
- Enables historical revalidation
- Supports debugging
- Meets regulatory requirements

**Status:** APPROVED

---

## Decision 5: Feature Ownership Required

**Decision:** Every feature must have an owner.

**Rationale:**
- Clear accountability
- Quality responsibility
- Maintenance plan
- Supports governance

**Status:** APPROVED

---

## Decision 6: Confidence Orthogonal to Accuracy

**Decision:** Confidence measures data quality, NOT prediction accuracy.

**Rationale:**
- Prevents false precision
- Enables informed decisions
- Honest uncertainty quantification
- Users understand limitations

**Status:** APPROVED

---

## Decision 7: Experimentation in Shadow Mode

**Decision:** New models run silently before exposure to users.

**Rationale:**
- Risk reduction
- Early issue detection
- User safety
- Confidence building

**Status:** APPROVED

---

## Decision 8: 30-Day Deprecation Period Minimum

**Decision:** Features/models deprecated require 30 days notice before retirement.

**Rationale:**
- User migration time
- Dependency updates
- Rollback if issues found
- Communication window

**Status:** APPROVED

---

## Decision 9: All Models Support Future ML

**Decision:** Governance structure supports evolution from hand-tuned to AI without redesign.

**Rationale:**
- Future-proof
- Avoid rewrites
- Enable innovation
- Maintain governance

**Status:** APPROVED

---

## Decision 10: Governance as Permanent Constitution

**Decision:** Architecture Invariants cannot be suspended or waived.

**Rationale:**
- Ensures consistency
- Prevents shortcuts
- Maintains standards
- Long-term trust

**Status:** APPROVED

---

## Future Decisions to Make (Phase 16B+)

1. Should historical predictions be rescored with new versions?
2. Should we support rollback to versions > 1 year old?
3. Should we allow parallel deployment of competing models?
4. Should we use canary deployments for large version jumps?
5. Should we offer model customization per golf league?
