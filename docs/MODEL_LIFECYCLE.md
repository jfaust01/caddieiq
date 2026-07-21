# MODEL LIFECYCLE

Detailed specification of each stage in the model lifecycle.

## Stage 1: Development

**Purpose:** Active development of new model.

**Entry Requirements:**
- Problem statement documented
- Data sources identified
- Owner assigned
- Initial roadmap created

**Activities:**
- Develop model logic
- Implement features
- Build scoring
- Create initial tests
- Document assumptions

**Exit Requirements:**
- Code complete and documented
- Initial testing passed
- Development branch ready
- Release notes prepared
- Owner sign-off

**Duration:** Variable (days to weeks)

**Rollback:** Delete development branch

---

## Stage 2: Version

**Purpose:** Tag model for release.

**Entry Requirements:**
- Development complete
- Code review passed
- Unit tests passing
- Owner ready to release

**Activities:**
- Assign version number (MAJOR.MINOR.PATCH)
- Create version tag
- Document breaking changes
- Archive feature definitions
- Lock score formula

**Exit Requirements:**
- Version tagged in git
- Change summary written
- Features locked
- Build ready

**Duration:** < 1 day

**Rollback:** Delete tag, continue development

---

## Stage 3: Build

**Purpose:** Create reproducible artifact.

**Entry Requirements:**
- Version tagged
- All features locked
- Dependencies frozen
- Build environment ready

**Activities:**
- Create build ID (uuid)
- Capture all versions:
  - Feature set version
  - Score definition version
  - Confidence version
  - Explainability version
  - Benchmark version
- Compute build hash (SHA256)
- Archive build manifest
- Create historical snapshot

**Exit Requirements:**
- Build ID assigned
- Build artifact created
- Build hash computed
- Reproducibility verified
- Manifest archived

**Duration:** < 1 hour

**Rollback:** Delete build artifact

---

## Stage 4: Validation

**Purpose:** Evaluate against benchmarks.

**Entry Requirements:**
- Build complete
- Benchmark infrastructure ready
- Historical dataset prepared
- Baseline models ready

**Activities:**
- Run on historical dataset (2021-2025)
- Compute 14 evaluation metrics
- Compare vs 10 baselines
- Run regression tests
- Validate explanations
- Validate confidence
- Produce benchmark report

**Exit Requirements:**
- All metrics computed
- All gates evaluated
- Report written
- Data scientist review passed

**Duration:** 2-4 weeks

**Rollback:** Reject build, return to development

---

## Stage 5: Candidate

**Purpose:** Real-time validation against live data.

**Entry Requirements:**
- Validation gates passed
- Benchmark report approved
- Shadow mode ready
- Monitoring configured

**Activities:**
- Deploy to shadow environment
- Make silent predictions (not shown to users)
- Compare vs production model
- Monitor for distribution shift
- Check for anomalies
- Validate confidence calibration

**Exit Requirements:**
- Shadow mode stable (7 days)
- No distribution shift detected
- Confidence calibration verified
- No anomalies found
- Ready for production

**Duration:** 2-4 weeks

**Rollback:** Keep in shadow mode or delete build

---

## Stage 6: Active

**Purpose:** Production deployment.

**Entry Requirements:**
- Candidate period complete
- CTO approval
- Product approval
- Rollback plan ready
- Communication ready

**Activities:**
- Deploy to production
- Route 5% traffic (day 1)
- Route 25% traffic (day 2)
- Route 50% traffic (day 3)
- Route 100% traffic (day 4)
- Monitor all metrics
- Ready for rollback

**Exit Requirements:**
- 100% traffic routed
- Stable for 7 days
- No regressions detected
- User acceptance good
- Mark as stable

**Duration:** 1-2 weeks

**Rollback:** Switch traffic to previous version

---

## Stage 7: Deprecated

**Purpose:** Mark for eventual retirement.

**Entry Requirements:**
- Newer version in Active
- Minimum 30-day notice
- User communication sent
- Rollback plan archived

**Activities:**
- Mark as deprecated
- Show deprecation warnings
- Log usage metrics
- Prepare retirement
- Archive documentation

**Exit Requirements:**
- 30 days deprecated
- Usage < 1%
- No critical issues
- Archive complete

**Duration:** Minimum 30 days

**Rollback:** Reactivate if issues found

---

## Stage 8: Archived

**Purpose:** Historical reference, not used.

**Entry Requirements:**
- Deprecated for 30 days
- Usage < 1%
- Documentation complete
- No active users

**Activities:**
- Archive all artifacts
- Preserve all metadata
- Maintain reproducibility
- Keep audit trail
- Disable new activations

**Exit Requirements:**
- All artifacts archived
- Reproducibility verified
- Metadata complete
- Retirement date set

**Duration:** Minimum 90 days

**Rollback:** Restore and reactivate if needed

---

## Stage 9: Retired

**Purpose:** End of support.

**Entry Requirements:**
- Archived for 90 days
- Support period ended
- Documentation transferred
- Legal requirements met

**Activities:**
- Remove from active systems
- Transfer to historical archive
- Preserve for compliance
- Document retirement
- Notify stakeholders

**Exit Requirements:**
- Retired from production
- Historical archive maintained
- Compliance records kept
- Support ended

**Duration:** Permanent

**Rollback:** Restore from archive (rare)

---

## Transitions

### Normal Path
```
Development → Version → Build → Validation → Candidate → Active → Deprecated → Archived → Retired
```

### Early Exit Paths
```
Development → (abandoned)
Version → Development (back to dev)
Build → Development (restart)
Validation → Build (restart validation)
Candidate → Build (extended testing)
Active → Deprecated (replaced)
```

### Emergency Paths
```
Active → (Emergency Rollback) → Previous Active
Active → (Emergency Disable) → Archived
```

## SLA by Stage

| Stage | SLA |
|-------|-----|
| Development | No SLA |
| Version | < 1 day |
| Build | < 1 hour |
| Validation | 2-4 weeks |
| Candidate | 2-4 weeks |
| Active | > 30 days |
| Deprecated | 30 days |
| Archived | 90 days |
| Retired | Permanent |
