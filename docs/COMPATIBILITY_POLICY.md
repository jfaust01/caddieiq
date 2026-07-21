# COMPATIBILITY POLICY

Rules for comparing predictions across versions.

## Version Comparability

### Comparable Versions
- Versions with same MAJOR number
- Example: v1.0, v1.1, v1.2, v1.9 all comparable
- Forward AND backward compatible

### Incomparable Versions
- Versions with different MAJOR numbers
- Example: v1.x CANNOT compare vs v2.x
- Breaking changes prevent comparison

### Partial Compatibility
- Version 1.2 can understand v1.0 predictions (features added)
- Version 1.0 cannot understand v1.2 predictions (may be missing features)

## Historical Rescoring Rules

### Rule 1: Can Rescore with Same Major Version
```
Tournament: 2023 Masters
Original version: 1.0.0
Rescore with: 1.2.0
Result: OK (can compare both versions)
```

### Rule 2: Cannot Rescore with Higher Major Version
```
Tournament: 2023 Masters
Original version: 1.9.0
Rescore with: 2.0.0
Result: NOT ALLOWED (different formula)
```

### Rule 3: Never Overwrite Historical Predictions
```
Original prediction: Rory rank 5 (v1.0.0)
Rescore result: Rory rank 3 (v1.2.0)
Historical record: v1.0.0 result stays
New result: Stored separately with v1.2.0 tag
```

## Feature Deprecation Rules

### If Feature Removed in v2.0
- Cannot score with v1.x logic in v2.x codebase
- Must have separate v2.0 implementation
- v1.x users: migrate or stay on v1.x

### If Feature Added in v1.1
- v1.0 predictions still valid
- v1.1 predictions may be slightly different
- Both can coexist

## Deprecated Feature Handling

### Scenario: Feature Removed from v1.8 to v2.0
```
Feature: player_amateur_record
Status: Deprecated v1.8, Removed v2.0

For v1.x models:
  Use value from player_profile (if available)
  Or default to 0

For v2.0+ models:
  Feature does not exist
  Use replacement: player_experience_tier
```

## Attribute Disappearance Handling

### If Course Attribute Becomes Unavailable
Example: Course fairway width data deleted

```
Old models (v1.0-1.5):
  Used fairway_width
  Now missing

New models (v2.0):
  Do not require fairway_width
  Use alternative: course_difficulty_rating

Transition:
  v1.6-1.9: Fairway width is optional (default if missing)
  v2.0: Fairway width removed, not computed
```

## User-Facing Compatibility

### Display Rules
- Show only compatible versions together
- Example: Show v1.0, v1.1, v1.2, v1.9 on same screen
- Do not show v1.9 vs v2.0 side-by-side (confusing)

### Explanation Rules
- Version-specific explanations
- Compare only same-major versions
- Caveat: "Different versions may not be directly comparable"

### Historical Comparisons
- Can compare prediction accuracy across compatible versions
- Example: Both v1.0 and v1.2 predicted Rory rank 5, Rory finished T12
- Cannot: v1.x predictions vs v2.x predictions

## Migration Path for Breaking Changes

### When v2.0 Has Breaking Change
```
Timeline:

Month 1: v2.0 released, shadow mode
Month 2: v2.0 candidate phase
Month 3: v2.0 production (v1.x deprecated)
Months 4-6: v1.x still available, users migrating
Month 7: v1.x support ended (archived)
```

### User Communication
- Announce v2.0 with migration guide
- Explain incompatibility
- Provide side-by-side comparison tool
- Gradual sunset

## Technical Implementation

### Version Adapter Pattern
```python
# Generic prediction interface
def predict(player_id, course_id, version):
  if version.major == 1:
    return v1_predictor.predict(...)
  elif version.major == 2:
    return v2_predictor.predict(...)
  else:
    raise IncompatibleVersionError()
```

### Build-Specific Recreation
```python
# Load historical build, recreate prediction exactly
build = artifact_registry.get_build(build_id)
prediction = build.compute_score(player_id, course_id, date)
# Result matches historical prediction
```
