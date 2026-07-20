# BUILD REPRODUCIBILITY

Every build must be reproducible. Every prediction must be recreatable.

## Build Artifact

Every version creates one or more builds.

**Build ID:** UUID (e.g., `c4c1de1e-7ea3-4d1a-a49c-c4d8e4b8a4a5`)

**Build Hash:** SHA256 of all inputs (reproducibility proof)

**Build Manifest:** JSON recording all versions/dependencies

## Build Manifest

```json
{
  "build_id": "c4c1de1e-7ea3-4d1a-a49c-c4d8e4b8a4a5",
  "model_version": "1.2.3",
  "build_date": "2026-07-20T15:30:00Z",
  "model_owner": "jane@caddieiq.com",
  "model_code_hash": "sha256:abc123...",
  
  "feature_set": {
    "version": "3.1.0",
    "features": 47,
    "hash": "sha256:def456..."
  },
  
  "score_definition": {
    "version": "2.0.1",
    "components": 5,
    "formula": "skill_fit + form_bonus + venue + confidence_mult * volatility",
    "hash": "sha256:ghi789..."
  },
  
  "dataset_version": "2021-2025-v1",
  "course_profile_version": "2026-07-15",
  "player_profile_version": "2026-07-15",
  "weather_data_version": "2026-07-15",
  "rules_version": "2.1.0",
  "confidence_definition_version": "1.5.2",
  "explainability_engine_version": "1.2.0",
  
  "dependencies": {
    "postgres": "15.2",
    "python": "3.11.3",
    "numpy": "1.24.3",
    "pandas": "2.0.3"
  },
  
  "build_hash": "sha256:jkl012...",
  "reproducibility_verified": true,
  "verification_date": "2026-07-20T15:31:00Z"
}
```

## Versioned Components

Everything has a version:

### Feature Set Version
- New features → new minor version
- Feature removed → new major version
- Feature redefined → new major version
- Example: `3.1.0` = 47 features

### Score Definition Version
- Formula change → new major version
- Component added → new minor version
- Bug fix → new patch version
- Example: `2.0.1` = 5 components

### Dataset Version
- Covers exact historical dataset
- Example: `2021-2025-v1` = Seasons 2021-2025

### Course Profile Version
- All course attributes as of date
- Updated weekly
- Example: `2026-07-15` = As of July 15, 2026

### Player Profile Version
- All player attributes/statistics
- Updated daily
- Example: `2026-07-15` = As of July 15, 2026

### Weather Data Version
- Historical weather data
- Example: `2026-07-15` = As of July 15, 2026

### Rules Version
- Tournament rules, field eligibility
- Example: `2.1.0` = USGA rules 2.1, patch 0

### Confidence Definition Version
- How confidence is calculated
- Example: `1.5.2` = Third calibration of version 1

### Explainability Engine Version
- Explanation template and logic
- Example: `1.2.0` = Minor improvement

## Reproducibility Verification

### Build Phase
1. Lock all versions
2. Compute manifests
3. Build artifact created
4. Build hash computed
5. Store in artifact repository

### Reproducibility Test
Later, verify any prediction is recreatable:

```python
# 5 years later...
build = artifact_repo.get_build(build_id="c4c1de1e...")

# Recreate score for Rory McIlroy at Pebble Beach 2026-01-25
score = compute_score(
  build=build,
  player_id="rory",
  course_id="pebble",
  tournament_date="2026-01-25",
  scoring_date="2026-01-23"  # 14-day look-ahead cutoff
)

# Verify it matches original prediction
assert score == original_score
```

### What's Preserved
1. Player profile (as of 2026-01-23)
2. Course profile (as of 2026-01-23)
3. Weather data (actual tournament week)
4. Rules (tournament setup)
5. Feature definitions (how SG computed)
6. Score formula (exact calculation)
7. Confidence model (exact calculation)
8. Explainability engine (exact output)

### What's NOT Preserved
1. User interface (display may change)
2. Ranking algorithm (may change independently)
3. Future predictions (scoring date locked)
4. Real-time updates (locked at build time)

## Historical Recreation

### Scenario 1: Rescore Tournament with Different Version

```
Tournament: 2026 Masters
Original version: 1.0.0
Want to rescore with: 1.2.0

Question: Can we compare?

Answer: YES
- Version 1.2.0 is MINOR upgrade (features added)
- Features are backward compatible
- Can compute both 1.0 and 1.2 on same data
- Can compare predictions

Cannot rescore with: 2.0.0
- Version 2.0 is MAJOR change
- Different formula
- Cannot compare historical predictions
```

### Scenario 2: Recreate 5-Year-Old Score

```
Tournament: 2023 US Open
Player: Rory McIlroy
Original prediction: Rank 5 (correlation 0.35)

5 years later in 2028:
Want to know: Was this prediction good?

Steps:
1. Get original build ID
2. Load build manifest
3. Retrieve all versioned data
4. Recompute score
5. Compare vs original
6. Compute 2023 accuracy (Rory finished T12)

Result: Prediction verified, accurate record maintained
```

### Scenario 3: Compare Adjacent Versions

```
Production: Version 1.0.0
Candidate: Version 1.1.0

Tournament: 2026 Masters (real-time)

Steps:
1. Build both versions
2. Create both predictions
3. Compare rankings
4. Monitor differences
5. Choose to promote or not

Historical recreation later:
Can recreate either version from build ID
Can explain difference to users
```

## Artifact Storage

All build artifacts stored permanently:

**Path Structure:**
```
/builds/
  /v1.0.0/
    /c4c1de1e-7ea3-4d1a-a49c-c4d8e4b8a4a5/
      - manifest.json
      - model.pkl
      - features.pkl
      - score_formula.py
      - confidence_model.pkl
      - explainability_template.json
      - metadata.yaml
  /v1.1.0/
    /[build_id]/
      - ...
```

**Storage Requirements:**
- Minimum 10 years retention
- Redundant storage (3 copies)
- Immutable once created
- Checksums verified annually
- Access logged

## Reproducibility Checklist

For every build:
- [ ] All versions recorded
- [ ] All dependencies frozen
- [ ] Build hash computed
- [ ] Manifest complete
- [ ] Artifact created
- [ ] Reproducibility tested
- [ ] Historical snapshot archived
- [ ] Stored redundantly
