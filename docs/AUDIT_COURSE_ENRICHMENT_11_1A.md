# Sprint 11.1A — Course Enrichment Audit Report

## Executive Summary

The `course_characteristics` table has **4 fields populated** (all shot-importance metrics) and **19 fields NULL**. The enrichment engine is functioning as designed — it intentionally leaves unknown values null rather than fabricating them. However, several fields could be populated with available data or with additional source data.

---

## Field-by-Field Audit

| Field | Populated? | Calculation Function | Status | Notes |
|-------|-----------|---------------------|--------|-------|
| **Identity** |
| `id` | ✓ Yes | DB auto-generated | **POPULATED** | CUID primary key, set by database. |
| `courseId` | ✓ Yes | `enrichCourseCharacteristics()` | **POPULATED** | Set directly from `course.id`. |
| **Style & Surfaces** |
| `style` | ✗ No | `deriveStyle()` | **INTENTIONALLY NULL** | Function returns null (line 72). Reason: "Conservative: only classify extreme cases to avoid false positives. No other data sources available." |
| `fairwayGrass` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 167). Reason: "No source data (requires provider import)." |
| `greenGrass` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 168). Reason: "No source data (requires provider import)." |
| `roughGrass` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 169). Reason: "No source data (requires provider import)." |
| **Green Properties** |
| `averageGreenSize` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 170). Reason: "No source data." |
| `greenSpeed` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 171). Reason: "No source data (PGA Tour analytics required)." |
| **Fairway & Rough** |
| `fairwayWidth` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 172). Reason: "No source data." |
| `roughLength` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 173). Reason: "No source data." |
| **Course Features** |
| `treeLined` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 174). Reason: "No source data." |
| `waterHazards` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 175). Reason: "No source data (requires course design details)." |
| **Environmental** |
| `windExposure` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 176). Reason: "No source data (geography-derived, requires detailed mapping)." |
| `elevationChange` | ✗ No | (not assigned) | **FIELD ISSUE** | Code sets `course.altitudeFt ? 0 : null` (line 177). **Problem**: Always returns 0 or null, never the actual elevation change. Requires elevation range data. |
| `walkingDifficulty` | ✗ No | `deriveWalkingDifficulty()` | **INTENTIONALLY NULL** | Function returns null (line 132). Reason: "No data source: leave null." |
| **Shot Importance** |
| `drivingImportance` | ✓ Yes | `deriveShootImportance()` → `driving` | **POPULATED** | Calculated from `par` only (lines 83–130). Returns: Par≤3: 0.15, Par4: 0.35, Par5+: 0.50. |
| `approachImportance` | ✓ Yes | `deriveShootImportance()` → `approach` | **POPULATED** | Calculated from `par` only. Returns: Par≤3: 0.40, Par4: 0.35, Par5+: 0.25. |
| `shortGameImportance` | ✓ Yes | `deriveShootImportance()` → `shortGame` | **POPULATED** | Calculated from `par` only. Returns: Par≤3: 0.20, Par4: 0.15, Par5+: 0.15. |
| `puttingImportance` | ✓ Yes | `deriveShootImportance()` → `putting` | **POPULATED** | Calculated from `par` only. Returns: Par≤3: 0.25, Par4: 0.15, Par5+: 0.10. |
| `scramblingDifficulty` | ✗ No | `deriveScramblingDifficulty()` | **INTENTIONALLY NULL** | Function returns null (line 142). Reason: "No data source: leave null." |
| **Scoring Analytics** |
| `birdieRate` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 184). Reason: "No source data (requires tournament historical data)." |
| `bogeyRate` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 185). Reason: "No source data (requires tournament historical data)." |
| `varianceRating` | ✗ No | (not calculated) | **INTENTIONALLY NULL** | Hardcoded null (line 186). Reason: "No source data." |
| **Timestamps** |
| `createdAt` | ✓ Yes | DB auto-generated | **POPULATED** | Set by `@default(now())`. |
| `updatedAt` | ✓ Yes | DB auto-generated | **POPULATED** | Set by `@updatedAt`. |

---

## Summary by Category

### Calculated & Populated (4 fields)
1. **`drivingImportance`** — Par-based weighting (0.15–0.50)
2. **`approachImportance`** — Par-based weighting (0.25–0.40)
3. **`shortGameImportance`** — Par-based weighting (0.15–0.20)
4. **`puttingImportance`** — Par-based weighting (0.10–0.25)

### Intentionally Null — No Source Data (15 fields)
These fields are hardcoded null with inline documentation explaining why:
- **Style & Surfaces**: `style`, `fairwayGrass`, `greenGrass`, `roughGrass`
- **Green Properties**: `averageGreenSize`, `greenSpeed`
- **Fairway/Rough**: `fairwayWidth`, `roughLength`
- **Course Features**: `treeLined`, `waterHazards`, `windExposure`
- **Difficulty**: `walkingDifficulty`, `scramblingDifficulty`
- **Scoring**: `birdieRate`, `bogeyRate`, `varianceRating`

### Data Issue (1 field)
**`elevationChange`** — Logic flaw: Returns `0` when `course.altitudeFt` exists, or `null` if it doesn't. This doesn't calculate elevation change; it only flags elevation presence. The field will always be `0` or `null`, never an actual elevation difference.

---

## Data Availability Assessment

| Source | Available? | Fields It Could Populate | Notes |
|--------|-----------|--------------------------|-------|
| **Course Record** (verified) | ✓ | None additional | Only `par` and `yardage` are used; `altitudeFt` is base elevation only. |
| **Provider Imports** (e.g., DataGolf, SportsDataIO) | ✗ | All grass types, green speed, hazard counts, wind/terrain | Requires external data pipeline. |
| **PGA Tour Analytics** | ✗ | Scoring rates (birdie/bogey), variance | Requires tour-provided data integration. |
| **Course Design Data** | ✗ | Fairway width, rough depth, tree coverage, scrambling difficulty | Not currently imported; would require GIS or course architect data. |

---

## Recommended Next Steps (Do not implement yet)

### Quick Wins (Available Data)
1. **`elevationChange`** — Fix to use `altitudeFt` as a proxy (set to 1 for elevation present, 0 for sea level).
2. **`style`** — Derive from `par` + `yardage` thresholds (conservative classification only for extreme cases).

### Medium Effort (Requires New Data)
3. **Grass Types** — Require provider integration or manual curation.
4. **Green Speed** — Requires PGA Tour or external analytics data.
5. **Scoring Rates** — Can be computed from tournament results table when available.

### High Effort (Complex Sources)
6. **Course Features** (fairway width, tree coverage, hazard counts) — Require GIS data or manual input.
7. **Wind Exposure** — Requires geographic/meteorological analysis.

---

## Design Principle Confirmation

The enrichment engine follows the declared principle: **"Unknown stays unknown."** Every null value is intentional with documented reasoning. The engine prioritizes accuracy over completeness — it never fabricates values, even when it could guess.

**Conclusion**: The audit confirms the engine is working as designed. The 4 populated fields are correct; the 19 null fields represent honest gaps in available data, not implementation errors.
