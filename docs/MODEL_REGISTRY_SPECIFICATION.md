# MODEL REGISTRY SPECIFICATION

Central registry recording every model version ever created.

## Registry Contents

Every model entry records:
- Model ID and version
- Status (development, active, archived, retired)
- Created/released/archived dates
- Owner and approvers
- Build IDs for reproducibility
- Benchmark results
- Validation gates (passed/failed)
- Deployment history
- Known limitations
- Documentation links

## Registry Queries

Query version history, compare performance across versions, find what was deployed on specific date, track benchmark improvements over time.

## Registry Updates

On version release, activation, deprecation, and archival - record all changes with timestamps.

## Registry Access

Everyone can read. Only ML Platform lead and CTO can write. Audit trail maintained.
