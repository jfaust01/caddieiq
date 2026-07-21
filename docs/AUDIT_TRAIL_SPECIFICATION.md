# AUDIT TRAIL SPECIFICATION

Complete traceability for every prediction.

## Prediction Metadata

Every prediction records:
- prediction_id: Unique identifier
- model_version: Which model (X.Y.Z)
- build_id: Which build (reproducible)
- feature_set_version: Which features
- score_definition_version: Which formula
- course_profile_version: Course data as-of date
- player_profile_version: Player data as-of date
- confidence_model_version: Confidence calculation
- explanation_model_version: Explanation template
- benchmark_version: Which benchmarks were used
- validation_report_version: Which validation passed
- created_timestamp: When computed
- user_context: Who requested, from where
- explanation: Full narrative
- confidence_score: Data quality assessment
- outcome: Actual finish (after tournament)
- accuracy: How correct the prediction was

## Traceability Questions Answered

1. **Which model created this prediction?** → model_version
2. **Can I recreate this prediction?** → build_id (yes, always)
3. **What explanation was generated?** → explanation_model_version + full text
4. **How confident should I be?** → confidence_score + confidence_model_version
5. **What benchmarks validated this?** → validation_report_version
6. **Was this version tested?** → validation_report_version → gates passed/failed
7. **When was this deployed?** → model_registry lookup
8. **Who approved this?** → model_registry → approvals
9. **How accurate was this?** → outcome + accuracy

## Audit Trail Uses

### Use Case 1: Reproduce 5-Year-Old Prediction
```
Request: What was Rory's prediction for 2023 Masters?
Answer: Version 1.0.0, Build c4c1de1e-..., Rank 5
Recreate: Load build, recompute with 2023 data
Result: Same prediction verified
```

### Use Case 2: Compare Version Predictions
```
Request: How would v2.0 have predicted 2023 Masters?
Answer: Load v2.0 build, run on 2023 data
Compare: v1.0 = Rank 5, v2.0 = Rank 3
Result: v2.0 was more accurate (Rory finished T12)
```

### Use Case 3: Trace Prediction Error
```
Request: Why was Rory predicted Rank 5?
Answer: Explanation + confidence + model version
Breakdown: skill_fit (high), form (neutral), venue (low), confidence (medium)
Result: Venue history was missing (first Masters appearance simulation)
```

## Audit Trail Immutability

Once created, never modified:
- Predictions frozen
- Explanations frozen
- Confidence frozen
- Outcomes recorded
- Accuracy computed

Changes require new prediction (not historical modification).

## Audit Trail Storage

All prediction metadata stored:
- Database (queryable)
- Archive (historical)
- Backups (redundant)
- Retention: Minimum 10 years

## Compliance

Audit trail supports:
- Regulatory compliance (SEC, FINRA for betting)
- User transparency (explain any prediction)
- Model validation (verify all steps)
- Reproducibility (recreate at any time)
- Accountability (who approved, when, why)
