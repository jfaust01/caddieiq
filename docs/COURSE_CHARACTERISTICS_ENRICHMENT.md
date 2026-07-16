# Course Characteristics Enrichment Pipeline

## Overview

The **Course Characteristics Enrichment Pipeline** generates and maintains the `course_characteristics` table, which contains analytics and derived insights for every course in CaddieIQ's database.

Each `CourseCharacteristic` record is a one-to-one mapping to a `Course` and contains computed values like shot-importance weights, style classifications, and playing characteristics. These characteristics are consumed by Course Fit, DFS Value, Betting, and other downstream models.

## Design Principles

### 1. Unknown Stays Unknown

We **never fabricate or guess** characteristic values. Every field is either:
- **Verified**: Derived from reliable source data (e.g., course par, yardage)
- **Null**: No data source available

This principle is core to Course Intelligence and ensures model transparency.

### 2. Pure & Testable

The enrichment engine (`course-characteristics-engine.ts`) is a pure function with no side effects. It accepts a `Course` record and returns derived characteristics. This design:
- Makes testing trivial
- Allows safe reruns without duplicates (idempotent upserts)
- Enables deterministic validation

### 3. Derivation Rules

Current enrichment derives only what can be reliably computed from verified course data:

| Characteristic | Source | Rule | Status |
|---|---|---|---|
| `style` | par + yardage | Conservative: only classify extreme cases | **Null** (no reliable source) |
| `fairwayGrass` | — | Requires provider import | **Null** |
| `greenGrass` | — | Requires provider import | **Null** |
| `roughGrass` | — | Requires provider import | **Null** |
| `averageGreenSize` | — | Requires course design data | **Null** |
| `greenSpeed` | — | Requires PGA Tour analytics | **Null** |
| `fairwayWidth` | — | Requires course design data | **Null** |
| `roughLength` | — | Requires course design data | **Null** |
| `treeLined` | — | Requires course design data | **Null** |
| `waterHazards` | — | Requires course design data | **Null** |
| `windExposure` | — | Requires geographic analysis | **Null** |
| `elevationChange` | altitudeFt | If present, value is 0 (base elevation only) | **Conditional** |
| `walkingDifficulty` | — | Requires terrain analysis | **Null** |
| `drivingImportance` | par | Par-5: 0.50, Par-4: 0.35, Par-3: 0.15 | **Derived** |
| `approachImportance` | par | Par-5: 0.25, Par-4: 0.35, Par-3: 0.40 | **Derived** |
| `shortGameImportance` | par | Par-5: 0.15, Par-4: 0.15, Par-3: 0.20 | **Derived** |
| `puttingImportance` | par | Par-5: 0.10, Par-4: 0.15, Par-3: 0.25 | **Derived** |
| `scramblingDifficulty` | — | Requires course design data | **Null** |
| `birdieRate` | — | Requires tournament history | **Null** |
| `bogeyRate` | — | Requires tournament history | **Null** |
| `varianceRating` | — | Requires tournament history | **Null** |

## Running the Enrichment

### Command

```bash
# Full enrichment (creates/updates characteristics for all courses)
npx tsx scripts/enrich-course-characteristics.mts

# Dry-run (preview without persisting)
npx tsx scripts/enrich-course-characteristics.mts --dry-run

# Verbose logging (log every course processed)
npx tsx scripts/enrich-course-characteristics.mts --verbose
```

### Output

The script produces a summary report:

```
========== ENRICHMENT SUMMARY ==========
Total courses:     205
Enriched:          205
Skipped:           0
Created records:   205
Updated records:   0
=========================================
```

## Idempotency & Reruns

The enrichment is **idempotent**:
- Characteristics are keyed by `courseId` (unique constraint)
- Repeated runs update existing records rather than creating duplicates
- Safe to rerun after adding new courses or changing derivation logic

Example: If you add 10 new courses and run the script again, it will enrich only the new courses and skip existing ones.

## Integration with Import Pipeline

The enrichment pipeline is **separate from** the main course import:
1. `course-import.ts` imports raw course records from SportsDataIO
2. `enrich-course-characteristics.mts` runs independently to populate analytics

This separation allows:
- Characteristics to be regenerated without re-importing all courses
- New derivation rules to be tested safely
- Analytics to evolve independently of raw course data

**Recommended workflow**:
1. Import new courses: `npm run import:courses`
2. Geocode new courses: `npm run geocode:courses`
3. Enrich characteristics: `npx tsx scripts/enrich-course-characteristics.mts`

## Extending the Pipeline

To add new derived characteristics:

1. **Add derivation logic** to `enrichCourseCharacteristics()` in `course-characteristics-engine.ts`
   - Document the rule in a comment
   - Return `null` if insufficient data
   - Never guess or fabricate

2. **Update this documentation** with the new characteristic in the table above

3. **Test** with `--dry-run` before running the full pipeline

Example: To derive `windExposure` from geographic data:

```typescript
function deriveWindExposure(
  latitude: number | null,
  longitude: number | null,
  country: string | null,
): number | null {
  if (!latitude || !longitude) return null
  
  // Use external geo service to compute exposure...
  // Return 0–1 normalized score, or null if unavailable.
  return null // (placeholder)
}
```

## Monitoring & Validation

After enrichment, verify the pipeline completed successfully:

```sql
-- Check enrichment coverage
SELECT 
  COUNT(DISTINCT c.id) as total_courses,
  COUNT(cc.id) as courses_with_characteristics,
  ROUND(100.0 * COUNT(cc.id) / COUNT(DISTINCT c.id), 2) as coverage_pct
FROM courses c
LEFT JOIN course_characteristics cc ON c.id = cc."courseId"
WHERE c."deletedAt" IS NULL;

-- Sample enriched records
SELECT 
  c.name,
  cc."drivingImportance",
  cc."approachImportance",
  cc."shortGameImportance",
  cc."puttingImportance"
FROM courses c
JOIN course_characteristics cc ON c.id = cc."courseId"
WHERE c."deletedAt" IS NULL
LIMIT 10;

-- Find courses missing characteristics (should be 0)
SELECT c.id, c.name FROM courses c
LEFT JOIN course_characteristics cc ON c.id = cc."courseId"
WHERE c."deletedAt" IS NULL AND cc.id IS NULL;
```

## Performance Considerations

- **Batch size**: 500 records per batch (configurable in script)
- **Memory**: ~10 MB per 1,000 courses
- **Database**: Full table scan for source data; O(n) upsert operations
- **Runtime**: ~2–3 seconds for 200 courses

For larger databases, consider:
- Increasing `BATCH_SIZE` in the script
- Running during off-peak hours
- Using `--dry-run` to preview before committing

## Troubleshooting

**Script exits with error code 1**
- Check the errors section in the summary report
- Run with `--verbose` for per-course details
- Verify database connectivity

**No characteristics created**
- Run with `--dry-run` to see what would be created
- Verify courses exist: `SELECT COUNT(*) FROM courses WHERE "deletedAt" IS NULL;`

**Performance is slow**
- Reduce `BATCH_SIZE` to avoid memory pressure
- Run during off-peak hours
- Check database load and connection pool

## Future Work

- **Provider imports**: Add grass types, green speed from PGA Tour or provider data
- **Geographic enrichment**: Derive wind exposure, elevation change from map data
- **Tournament analytics**: Populate scoring rates from historical tournament results
- **Model feedback**: Refine shot-importance weights based on model performance
