# FEATURE GOVERNANCE

Every feature must have governance: ownership, documentation, lifecycle.

## Feature Registry

Central registry of all features:

```
Feature ID: player_sg_composite
Name: Player Scoring Average
Category: Player Attributes
Status: Active
Owner: jane@caddieiq.com
Created: 2024-01-15
Version: 2.1.0

Definition:
  Player's scoring average in last 50 rounds
  Measured in shots below/above par
  Range: -3.0 to +3.0

Data Source:
  PGA Tour ShotLink
  Updated: Daily after rounds posted

Dependencies:
  - PGA Tour rounds database
  - ShotLink processor

Validation:
  - Non-null 95% of players
  - Correlates 0.75+ with OWGR
  - No outliers > ±5

Deprecation:
  None (stable feature)

History:
  - v1.0 (2024-01-15): Initial
  - v2.0 (2024-08-20): Changed source to direct API
  - v2.1.0 (2026-06-15): Expanded to 100 rounds for stability
```

## Feature Lifecycle

### Stage 1: Proposed
- Owner submits proposal
- Use case documented
- Data source identified
- Estimated maintenance effort

### Stage 2: Development
- Implement feature computation
- Validate data quality
- Test edge cases
- Document definition

### Stage 3: Beta
- Use in experimental models
- Monitor stability
- Collect usage metrics
- Refine definition

### Stage 4: Active
- Deployed in production models
- Monitored continuously
- Owner responsible
- Documentation complete

### Stage 5: Deprecated
- New feature replaces it
- 30-day deprecation notice
- Usage tracked
- Migration plan provided

### Stage 6: Retired
- Removed from all models
- Archived for history
- No new usage allowed
- Kept for reproducibility

## Feature Ownership

Every feature has an owner.

**Owner Responsibilities:**
1. Maintain definition documentation
2. Monitor data quality
3. Fix bugs promptly
4. Plan deprecation when needed
5. Answer questions
6. Lead improvements

**Owner Authority:**
- Can propose modifications
- Cannot unilaterally change
- Requires review for breaking changes
- Self-approval for minor updates

## Feature Definition

Every feature must document:

```yaml
feature_id: player_sg_composite
name: Player Scoring Average
owner: jane@caddieiq.com

definition: |
  Player's scoring average in last 50 rounds,
  measured in shots below/above par.
  
calculation: |
  SG = (score - course_par) - field_average_adjustment
  avg_sg = mean(SG for last 50 rounds)

range: [-3.0, 3.0]
units: shots
missing_handling: "Use 50-round average or default to 0"

data_source:
  name: PGA Tour ShotLink
  api: shotlink.pgatour.com/player/{id}/stats
  update_frequency: daily

dependencies:
  - pga_tour_rounds
  - shotlink_processor
  - field_adjustment_model

validation_rules:
  - "95% of active players have data"
  - "Correlation with OWGR >= 0.75"
  - "No outliers > ±5"

version_history:
  - v1.0: Initial (50 rounds)
  - v2.0: Changed data source (100 rounds)
  - v2.1.0: Expanded window for stability

deprecation_status: active
```

## Feature Dependencies

Some features depend on others.

**Example:**
```
Feature: player_form_score
Depends on:
  - player_sg_composite
  - player_sg_app
  - player_sg_short
  - player_sg_putt
```

**Constraint:** Cannot deprecate player_sg_composite while player_form_score active.

**Deprecation Process:**
1. Identify all dependent features
2. Propose replacement
3. Plan migration
4. Deprecate dependent first
5. Then deprecate underlying

## Feature Modification

### Minor Changes (Self-Approved)
- Documentation updates
- Definition clarifications
- Range expansions

### Major Changes (Requires Review)
- Calculation changes
- Data source changes
- New dependencies
- Range restrictions

**Process:**
1. Propose in design doc
2. Architecture review
3. Data quality validation
4. Versioning decision
5. Approve or reject

### Breaking Changes
- Requires major version of model
- 30-day deprecation notice
- Migration guide provided

## Feature Data Quality

Monitor continuously:

**Metrics:**
- Data availability (% of players)
- Freshness (hours since update)
- Completeness (% non-null)
- Consistency (range violations)
- Drift (distribution changes)

**Quality Tiers:**
- **Tier 1 (Critical):** 99% availability, hourly updates
- **Tier 2 (Important):** 95% availability, daily updates
- **Tier 3 (Supporting):** 80% availability, weekly updates

**Alerts:**
- Availability < threshold
- Update delay > SLA
- Drift > 2 sigma
- Range violations > 0.1%

## Feature Versioning

Features have independent versions.

**Format:** X.Y.Z (semantic versioning)

- MAJOR: Calculation changed, data source changed, meaning redefined
- MINOR: Range expanded, dependencies added, definition clarified
- PATCH: Documentation updated, bug fixed, nothing material changed

**Example:**
```
Feature: player_sg_composite

v1.0: Initial (50 rounds, ShotLink API)
v1.1: Definition clarified (4 comments added)
v2.0: Data source changed (direct DB vs API) → MAJOR
v2.1: Range expanded (-4.0 to 4.0) → MINOR
v2.1.1: Documentation fixed typo → PATCH
```

## Feature Deprecation

When feature becomes obsolete:

**30-Day Deprecation:**
1. Day 1: Send deprecation notice
2. Days 1-7: Accept questions
3. Days 8-20: Users migrate
4. Days 21-30: Monitoring
5. Day 31: Retired

**During Deprecation:**
- Mark as "deprecated" in registry
- Show warning in code
- Log all accesses
- Provide migration path

**After Retirement:**
- No new usage allowed
- Archived for reproducibility
- Keep for 10 years minimum

## Feature Categories

### Player Attributes (Proposed: 50, Core: 9)
- Driving distance/accuracy
- Approach accuracy/proximity
- Short game
- Putting
- Course history
- Recent form
- Recovery
- Volatility
- DFS characteristics

### Course Attributes (Proposed: 60, Core: 18)
- Course difficulty
- Fairway/green difficulty
- Hazard severity
- Elevation changes
- Grass type
- Wind exposure
- Course management
- Scoring difficulty

### Derived Features
- Form bonus
- Venue history score
- Confidence multiplier

### Meta Features
- Tournament field strength
- Weather conditions
- Player confidence
- Model version
