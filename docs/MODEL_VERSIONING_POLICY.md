# MODEL VERSIONING POLICY

Semantic versioning governance for all matching engine models.

## Version Format

**MAJOR.MINOR.PATCH-metadata**

Example: `1.2.3-hand-tuned-v1`

## Version Components

### MAJOR Version
Incremented when:
- Breaking changes to score formula
- Player attributes removed or redefined
- Course attributes removed or redefined
- Confidence framework changed
- Explainability structure modified
- Score ranges changed (e.g., 0-100 → 0-1)
- Incompatible with previous version

**Examples:**
- 1.0 → 2.0: Moved from 5-component to 7-component score
- 2.0 → 3.0: Confidence measured differently

### MINOR Version
Incremented when:
- New features added (not removed)
- New score components (not removed)
- Algorithm improved (same structure)
- Calibration adjustments
- Confidence thresholds refined
- Documentation improved
- Backward compatible

**Examples:**
- 1.0 → 1.1: Added form bonus component
- 1.1 → 1.2: Improved calibration

### PATCH Version
Incremented when:
- Bug fixes
- Minor calibration
- Documentation corrections
- Code style changes
- Performance optimizations
- No logic changes
- Fully backward compatible

**Examples:**
- 1.2.3 → 1.2.4: Fixed edge case handling
- 1.2.4 → 1.2.5: Optimized feature computation

## Metadata Tags

Optional additional info appended to version:

**Development Status:**
- `-alpha`: Early development, may change
- `-beta`: Feature complete, testing
- `-rc`: Release candidate
- (no tag): Production release

**Algorithm:**
- `-hand-tuned`: Human-optimized weights
- `-gradient-boosted`: ML-optimized
- `-ensemble`: Multiple models combined
- `-llm-enhanced`: LLM-assisted reasoning

**Calibration:**
- `-v1-calibrated`: Calibrated on 2021-2023
- `-v2-calibrated`: Calibrated on 2021-2024
- `-seasonal`: Seasonal variants

**Examples:**
- `1.0.0`: Production hand-tuned
- `1.1.0-beta`: Features added, still testing
- `2.0.0-gradient-boosted-v1-calibrated`: Major version with ML, new calibration

## When Version Numbers MUST Change

### MAJOR (Always)
- Score formula changed (any input removed)
- Player attribute removed
- Course attribute removed
- Confidence framework redesigned
- Score range changed
- Explainability redesigned
- Historical predictions incomparable

### MINOR (Always)
- Feature added
- Score component added
- Confidence thresholds changed
- Calibration curves adjusted
- Algorithm improved (same structure)
- Backward compatible

### PATCH (Always)
- Bug fixed
- Edge case handled
- Documentation updated
- Performance optimized
- No logic change

### NO VERSION CHANGE
- Code formatting
- Comment updates
- Internal refactoring
- README updates
- Metadata only

## Version Comparison Rules

**Incomparable:**
- 1.x cannot compare vs 2.x (different formula)
- Versions with different MAJOR numbers

**Comparable:**
- 1.1 can compare vs 1.0 (features added)
- 1.2 can compare vs 1.1 (calibration improved)
- 1.2.1 can compare vs 1.2.0 (bug fix)

**Historical Rescoring:**
- Version N can rescore tournament with Version M if N ≥ M (same major)
- Version N cannot rescore with Version M if N < M (downgrade not allowed)
- Version 1 predictions with Version 2 not permitted

## Breaking Change Policy

A breaking change requires MAJOR version increment.

**Examples of Breaking Changes:**
1. Removing an input feature
2. Changing score formula (same inputs)
3. Redefining an attribute meaning
4. Changing score range
5. Modifying confidence calculation
6. Changing explainability template

**Process for Breaking Changes:**
1. Justify in design doc
2. Propose in architecture review
3. Get CTO approval
4. New MAJOR version tagged
5. 30-day deprecation notice
6. Migration guide written
7. Old version archived after 90 days

## Feature Addition Policy

Adding features increments MINOR version.

**Process:**
1. Design feature in development
2. Add to feature set
3. Increment MINOR
4. Backward compatible
5. Can run alongside previous version
6. Tag as version

## Release Schedule

No fixed schedule; release when ready:
- Development: Continuous
- Version tagging: On demand
- Validation: 2-4 weeks per model
- Production release: 1-2 weeks

Emergency hotfixes:
- Bug in production: PATCH immediately
- Critical issue: Possible rollback + PATCH

## Version Metadata

Every version must record:
```
version: "1.2.3"
date_created: 2026-07-20
date_released: 2026-08-15
created_by: "jane@caddieiq.com"
approved_by: "cto@caddieiq.com"
parent_version: "1.2.2"
is_major_change: false
breaking_changes: []
new_features: ["form_bonus_v2"]
bug_fixes: ["edge_case_handling"]
calibration_changes: ["confidence_thresholds"]
documentation: "Full release notes"
```

## Version Lifecycle

```
1.0.0-alpha (development)
  ↓
1.0.0-beta (feature complete)
  ↓
1.0.0-rc (release candidate)
  ↓
1.0.0 (production)
  ↓
1.1.0-beta (next feature)
  ↓
1.1.0 (production)
  ↓
1.2.0 (next feature)
  ↓
2.0.0 (major breaking change)
```

## End of Support Policy

| Version | Support Period | Archived | Retired |
|---------|---|---|---|
| Current Major | Indefinite | N/A | N/A |
| Previous Major | 12 months | +90 days | +2 years |
| Older | 6 months | +90 days | +2 years |

Example:
- Version 2.0 released: Version 1.x gets 12-month support
- After 12 months: Version 1.x deprecated
- After 30 days: Users migrated
- After 90 days: Archived
- After 2 years: Retired
