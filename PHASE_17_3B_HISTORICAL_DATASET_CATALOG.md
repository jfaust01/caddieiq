# Historical Dataset Catalog

**Phase**: 17.3B Data Acquisition Layer  
**Status**: Specification (no data acquisition yet)  
**Date**: 2026-07-20

---

## DATASET 1: Historical Player Rankings (OWGR)

| Property | Value |
|----------|-------|
| **Dataset Name** | Historical Player Rankings (OWGR) |
| **Purpose** | Provide week-specific player OWGR rank and points as of replay cutoff |
| **Provider** | DataGolf (OWGR historical archive) or OWGR API |
| **Historical Depth** | 5+ years (weekly snapshots) |
| **Update Frequency** | Weekly (Thursday release) |
| **Primary Keys** | `player_id` + `effective_date` |
| **Temporal Keys** | `effective_date` (ranking release date, UTC) |
| **Versioning Strategy** | No updates; weekly new records only |
| **Retention Strategy** | Permanent (historical reference) |
| **Expected Record Count** | ~50K (50 years of PGA = 2,600 weeks × ~20 active players) |
| **Required for Replay?** | YES (seed rankings, field strength calc) |
| **Required for Projection?** | YES (live rankings for current tournament) |
| **Required for Explainability?** | YES (rank sensitivity analysis) |
| **Schema** | `historical_player_rankings(player_id UUID, effective_date TIMESTAMP, owgr_rank INT, owgr_points DECIMAL, provider_name TEXT)` |
| **Provenance Fields** | provider, provider_record_id, source_effective_timestamp, retrieved_timestamp, checksum |
| **Validation Rules** | effective_date ≤ replay_cutoff; rank > 0; no duplicates per (player_id, effective_date, provider) |
| **Merge Strategy** | Idempotent: ignore if (player_id, effective_date, provider, checksum) already exists |

---

## DATASET 2: Historical Player Statistics (Strokes Gained)

| Property | Value |
|----------|-------|
| **Dataset Name** | Historical Player Statistics (SG) |
| **Purpose** | Player-level skill metrics (SG-Driving, SG-Approach, SG-Putting, SG-Around Green, SG-Total) |
| **Provider** | SportsDataIO (primary) or DataGolf (fallback) |
| **Historical Depth** | 3+ years (rolling weekly updates) |
| **Update Frequency** | Weekly (season-dependent) |
| **Primary Keys** | `player_id` + `valid_from` (start of measurement window) |
| **Temporal Keys** | `valid_from` (start of window), `valid_to` (end of window) |
| **Versioning Strategy** | Immutable; new version = new (valid_from, valid_to) pair |
| **Retention Strategy** | Permanent (historical reference) |
| **Expected Record Count** | ~500K (50K players × 10 years × 1 per week avg) |
| **Required for Replay?** | YES (core model input) |
| **Required for Projection?** | YES (live stat updates) |
| **Required for Explainability?** | YES (feature breakdown) |
| **Schema** | `historical_player_features(player_id UUID, feature_key TEXT, feature_value DECIMAL, valid_from TIMESTAMP, valid_to TIMESTAMP)` |
| **Provenance Fields** | provider, provider_record_id, source_effective_timestamp, retrieved_timestamp, checksum, feature_version |
| **Validation Rules** | valid_from < valid_to; valid_from ≤ replay_cutoff; no overlaps per (player_id, feature_key); -100 < sg_value < 100 |
| **Merge Strategy** | Idempotent: ignore if (player_id, valid_from, feature_key, provider, checksum) exists |

---

## DATASET 3: Historical DraftKings Salaries

| Property | Value |
|----------|-------|
| **Dataset Name** | Historical DFS Salaries (DraftKings) |
| **Purpose** | Player salary on lock_datetime for DFS pricing board and value calculations |
| **Provider** | DraftKings Public API (historical data via manual capture or archiving service) |
| **Historical Depth** | 3+ years (one snapshot per tournament) |
| **Update Frequency** | Per-tournament (static after lock) |
| **Primary Keys** | `tournament_id` + `player_id` |
| **Temporal Keys** | `effective_at` (should equal tournament.lock_datetime) |
| **Versioning Strategy** | No updates; one record per tournament per player |
| **Retention Strategy** | Permanent (model input dependency) |
| **Expected Record Count** | ~35K (5 years × 52 weeks × 133 avg field size) |
| **Required for Replay?** | YES (DFS value board) |
| **Required for Projection?** | YES (live salary display) |
| **Required for Explainability?** | NO (context only) |
| **Schema** | `historical_salary_odds_snapshots(tournament_id UUID, player_id UUID, salary INT, effective_at TIMESTAMP, sport TEXT = 'golf')` |
| **Provenance Fields** | provider='draftkings', provider_record_id (contest_id), source_effective_timestamp, retrieved_timestamp, checksum |
| **Validation Rules** | effective_at = tournament.lock_datetime; salary > 0; salary < 20000 (sanity); no duplicates |
| **Merge Strategy** | Idempotent: ignore if (tournament_id, player_id, provider, checksum) exists |

---

## DATASET 4: Historical Betting Odds

| Property | Value |
|----------|-------|
| **Dataset Name** | Historical Betting Odds |
| **Purpose** | Win odds and closing lines for model alignment and sentiment tracking |
| **Provider** | Genius Sports API (primary) or BetRivers historical API |
| **Historical Depth** | 3+ years (multiple snapshots per tournament) |
| **Update Frequency** | Per-tournament (pre-lock, at-lock, closing) |
| **Primary Keys** | `tournament_id` + `player_id` + `snapshot_type` |
| **Temporal Keys** | `captured_at` (when odds were retrieved) |
| **Versioning Strategy** | Multiple snapshots per tournament (opening, updates, closing) |
| **Retention Strategy** | Permanent (model input, audit trail) |
| **Expected Record Count** | ~200K (5 years × 52 tournaments × 133 players × 2-3 snapshots) |
| **Required for Replay?** | YES (model input, smart money signals) |
| **Required for Projection?** | YES (live odds) |
| **Required for Explainability?** | YES (model alignment tracking) |
| **Schema** | `historical_odds_snapshots(tournament_id UUID, player_id UUID, win_odds DECIMAL, ou_finish DECIMAL, captured_at TIMESTAMP, snapshot_type TEXT)` |
| **Provenance Fields** | provider, provider_record_id, source_effective_timestamp, retrieved_timestamp, checksum, vig |
| **Validation Rules** | win_odds > 0; ou_finish > 0; captured_at ≤ replay_cutoff; no duplicates per (tournament_id, player_id, snapshot_type, captured_at) |
| **Merge Strategy** | Idempotent: ignore if (tournament_id, player_id, snapshot_type, captured_at, provider, checksum) exists |

---

## DATASET 5: Historical DFS Ownership

| Property | Value |
|----------|-------|
| **Dataset Name** | Historical DFS Ownership |
| **Purpose** | Player ownership % at various points (OPTIONAL, context only) |
| **Provider** | DraftKings historical data or external archive |
| **Historical Depth** | 2+ years (best-effort) |
| **Update Frequency** | Per-tournament (multiple snapshots if available) |
| **Primary Keys** | `tournament_id` + `player_id` |
| **Temporal Keys** | `captured_at` (snapshot time) |
| **Versioning Strategy** | Multiple snapshots per tournament if captured |
| **Retention Strategy** | Optional; expire after 2 years if needed |
| **Expected Record Count** | ~50K (if only at-lock snapshots) |
| **Required for Replay?** | NO (optional context) |
| **Required for Projection?** | NO (informational only) |
| **Required for Explainability?** | NO |
| **Schema** | `historical_ownership_snapshots(tournament_id UUID, player_id UUID, ownership_pct DECIMAL, captured_at TIMESTAMP)` |
| **Provenance Fields** | provider='draftkings', provider_record_id, source_effective_timestamp, retrieved_timestamp, checksum |
| **Validation Rules** | ownership_pct >= 0 AND ownership_pct <= 1; captured_at ≤ replay_cutoff |
| **Merge Strategy** | Idempotent: ignore if (tournament_id, player_id, captured_at, provider, checksum) exists |

---

## DATASET 6: Historical Tournament Outcomes (prerequisite)

| Property | Value |
|----------|-------|
| **Dataset Name** | Historical Tournament Outcomes |
| **Purpose** | Final positions and scores (required for rolling form calculation) |
| **Provider** | SportsDataIO (primary) or PGA Tour API |
| **Historical Depth** | 5+ years (complete rounds) |
| **Update Frequency** | Per-tournament (live during event, finalized post-event) |
| **Primary Keys** | `tournament_id` + `player_id` |
| **Temporal Keys** | `tournament.end_date` (finalized date) |
| **Versioning Strategy** | Immutable post-publication |
| **Retention Strategy** | Permanent |
| **Expected Record Count** | ~350K (5 years × 52 tournaments × 133 avg field) |
| **Required for Replay?** | YES (required for computing rolling form) |
| **Required for Projection?** | YES (live leaderboard) |
| **Required for Explainability?** | YES (historical performance context) |
| **Schema** | `historical_tournament_outcomes(tournament_id UUID, player_id UUID, finish_position INT, total_score INT, rounds_completed INT, status TEXT)` |
| **Provenance Fields** | provider, provider_record_id, source_effective_timestamp, retrieved_timestamp, checksum |
| **Validation Rules** | finish_position > 0 OR status IN ('withdrew', 'disqualified'); no duplicates per (tournament_id, player_id) |
| **Merge Strategy** | Idempotent: ignore if (tournament_id, player_id, provider, checksum) exists |

---

## DATASET 7: Historical Course Fit (COMPUTED DATASET)

| Property | Value |
|----------|-------|
| **Dataset Name** | Historical Course Fit (Computed) |
| **Purpose** | Per-player, per-course strokes gained comparisons |
| **Provider** | INTERNAL (computed from datasets 2, 6 + historical data) |
| **Historical Depth** | 3+ years |
| **Update Frequency** | Per-tournament (computed on-demand during replay) |
| **Primary Keys** | `player_id` + `course_id` + `measurement_period` |
| **Temporal Keys** | `valid_from` (start of 3-year lookback) |
| **Versioning Strategy** | Computed fresh for each replay (not stored) |
| **Retention Strategy** | N/A (computed on-the-fly) |
| **Expected Record Count** | ~50K (computed, not stored) |
| **Required for Replay?** | YES (core to fit board) |
| **Required for Projection?** | YES (live fit display) |
| **Required for Explainability?** | YES (course affinity analysis) |
| **Computation Logic** | (1) Get all tournament outcomes where course=X, player=Y, within 3 years; (2) Compute mean SG across those rounds; (3) Compare to player's global mean SG |
| **Dependencies** | Dataset 2 (Player Stats), Dataset 6 (Outcomes) |
| **Validation** | No NaN; sample_size ≥ 3 rounds for "fit_found"; -20 < sg_vs_field < +20 |

---

## DATASET 8: Historical Rolling Form (COMPUTED DATASET)

| Property | Value |
|----------|-------|
| **Dataset Name** | Historical Rolling Form (Computed) |
| **Purpose** | Recent finishes and consistency metrics for trend analysis |
| **Provider** | INTERNAL (computed from dataset 6) |
| **Historical Depth** | Rolling 4-week windows |
| **Update Frequency** | Per-tournament (computed on-demand) |
| **Primary Keys** | `player_id` + `as_of_date` |
| **Temporal Keys** | `as_of_date` (cutoff for rolling window) |
| **Versioning Strategy** | Computed fresh for each replay |
| **Retention Strategy** | N/A (computed on-the-fly) |
| **Expected Record Count** | ~50K (computed) |
| **Required for Replay?** | YES (field strength, trending) |
| **Required for Projection?** | YES (live form display) |
| **Required for Explainability?** | YES (momentum analysis) |
| **Computation Logic** | (1) Get all tournament outcomes for player within 4 weeks of replay cutoff; (2) Compute: finish positions (list), avg finish, top-10 count, win indicator, consistency (std dev) |
| **Dependencies** | Dataset 6 (Outcomes) |
| **Validation** | No NaN; windows may have 0-10 tournaments (valid); finishes are positive integers |

---

## SUMMARY TABLE

| # | Dataset | Status | Provider | Depth | Priority | Dependencies |
|---|---------|--------|----------|-------|----------|--------------|
| 1 | OWGR Rankings | ❌ MISSING | DataGolf | 5+ yrs | 🔴 CRITICAL | None |
| 2 | Player Statistics (SG) | ❌ MISSING | SportsDataIO | 3+ yrs | 🔴 CRITICAL | None |
| 3 | DK Salaries | ❌ MISSING | DraftKings | 3+ yrs | 🔴 CRITICAL | None |
| 4 | Betting Odds | ❌ MISSING | Genius Sports | 3+ yrs | 🟡 HIGH | None |
| 5 | DFS Ownership | ❌ MISSING | DraftKings | 2+ yrs | 🟢 LOW (optional) | None |
| 6 | Tournament Outcomes | ❌ MISSING | SportsDataIO | 5+ yrs | 🔴 CRITICAL | None (prerequisite for #7, #8) |
| 7 | Course Fit | ✓ COMPUTED | Internal | 3+ yrs | 🔴 CRITICAL | #2, #6 |
| 8 | Rolling Form | ✓ COMPUTED | Internal | Rolling | 🟡 HIGH | #6 |

---

## PROVENANCE SCHEMA (Applies to All Imported Datasets)

Every historical record must store provenance:

```sql
CREATE TABLE historical_import_jobs (
  id UUID PRIMARY KEY,
  dataset TEXT NOT NULL,                 -- Dataset name (e.g., 'owgr_rankings')
  provider TEXT NOT NULL,                -- Data source (e.g., 'datagolf')
  records_read INT,                      -- Count read from source
  records_inserted INT,                  -- Count successfully stored
  records_updated INT,                   -- Count updated (for idempotent runs)
  records_rejected INT,                  -- Count failed validation
  execution_time_ms INT,                 -- Duration
  import_checksum TEXT,                  -- SHA256 of entire import payload
  errors JSONB,                          -- { field: [error messages] }
  status TEXT,                           -- 'pending' | 'success' | 'partial' | 'failed'
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Attached to every record:
provider TEXT NOT NULL,                  -- e.g., 'datagolf'
provider_record_id TEXT,                 -- External ID (e.g., 'datagolf_owgr_20260720')
provider_version TEXT,                   -- Provider's versioning (e.g., 'v2.1')
source_effective_timestamp TIMESTAMP,    -- When provider says data is valid-from
retrieved_timestamp TIMESTAMP,           -- When we fetched it
import_job_id UUID,                      -- Foreign key to import jobs
checksum TEXT,                           -- SHA256 of record (detect changes)
valid_from TIMESTAMP,                    -- When this record becomes valid
valid_to TIMESTAMP                       -- When this record expires (NULL = current)
```

---

## Acquisition Priority

**Phase 17.3B**: Design acquisition interfaces (no data import yet)  
**Phase 17.3C** (next): Build live importers for datasets 1, 2, 3, 6 (critical path)  
**Phase 17.3D** (future): Add datasets 4, 5 (odds, ownership)

