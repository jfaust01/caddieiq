# Historical Data Acquisition Interfaces

**Phase**: 17.3B (Infrastructure Design)  
**Status**: Interface Specification (Implementation follows)  

---

## Overview

The acquisition layer provides idempotent importer interfaces for each historical dataset. Each importer is **independently testable**, **temporally validated**, and **fully provenance-tracked**.

---

## Importer Interface Contract

Every importer must implement this interface:

```typescript
interface HistoricalImporter<T> {
  /**
   * Discover available data within date range and filter criteria.
   * Returns discovery metadata without fetching full payloads.
   *
   * @param criteria - Filter: { startDate, endDate, tournaments, players, providers }
   * @returns Discovery result with record counts, available providers, date ranges
   */
  discover(criteria: DiscoveryCriteria): Promise<DiscoveryResult>;

  /**
   * Fetch raw records from the external provider or archive.
   * No transformation; returns exactly what the provider returned.
   *
   * @param criteria - Same filters as discover()
   * @returns Raw records with source metadata
   */
  fetch(criteria: DiscoveryCriteria): Promise<RawRecord[]>;

  /**
   * Transform raw provider records into canonical schema.
   * Pure function; no side effects or persistence.
   *
   * @param raw - Records from fetch()
   * @returns Normalized records ready for validation and storage
   */
  normalize(raw: RawRecord[]): NormalizedRecord[];

  /**
   * Validate normalized records against business rules.
   * Detects duplicates, temporal violations, schema errors.
   *
   * @param normalized - From normalize()
   * @returns Validation result with rejected records + error details
   */
  validate(normalized: NormalizedRecord[]): ValidationResult;

  /**
   * Persist validated records to database.
   * Idempotent; safe to run multiple times on same data.
   * Increments counters in historical_import_jobs.
   *
   * @param validated - From validate()
   * @param jobId - Import job ID for tracking
   * @returns Persistence result with counts (inserted, updated, skipped)
   */
  persist(validated: NormalizedRecord[], jobId: string): Promise<PersistenceResult>;

  /**
   * Verify persisted records match expectations.
   * Reads back from database, validates checksums, row counts.
   *
   * @param jobId - Import job ID to verify
   * @returns Verification result (pass/fail) with diagnostics
   */
  verify(jobId: string): Promise<VerificationResult>;
}
```

---

## Idempotency Contract

Every importer must guarantee **idempotent persistence**:

1. **Same input = same output**: Running persist() twice with identical data
   - First run: inserts N records
   - Second run: skips all N (detects duplicates via checksum), inserts 0
   - Result: exactly N records in database both times

2. **Checksum-based deduplication**:
   - Compute SHA256 of normalized record
   - Check if (dataset, provider, provider_record_id, checksum) exists
   - If yes: skip (log as "already imported")
   - If no: insert

3. **No destructive updates**: Never delete or overwrite historical records
   - Exception: Set `valid_to` timestamp to mark superseded versions
   - Keeps complete audit trail

---

## Temporal Validation

Every importer must enforce temporal boundaries:

```typescript
interface TemporalValidation {
  /**
   * Reject any record with effective_timestamp > replay_cutoff.
   * Prevents post-event data leakage into historical datasets.
   *
   * replay_cutoff comes from: tournaments.lock_datetime
   */
  rejectPostCutoff(record: NormalizedRecord, cutoff: Date): boolean;

  /**
   * Reject any record with effective_timestamp in the future.
   * Catches data entry errors or clock skew.
   */
  rejectFutureDate(record: NormalizedRecord, asOf: Date): boolean;

  /**
   * Detect version collisions.
   * Same (dataset, player_id, effective_date, provider_version)?
   * Keep only one; reject duplicates.
   */
  detectDuplicates(records: NormalizedRecord[]): DuplicateDetectionResult;

  /**
   * Validate provider consistency.
   * If provider=A claims effective_timestamp T, but we also have
   * provider=B effective_timestamp T (different value), flag as conflict.
   * Log but don't reject (different providers can disagree).
   */
  detectProviderConflicts(records: NormalizedRecord[]): ConflictResult;
}
```

---

## Import Job Tracking

Every run creates a job record:

```typescript
interface ImportJob {
  id: string;                        // UUID
  dataset: string;                   // e.g., "owgr_rankings"
  provider: string;                  // e.g., "datagolf"
  records_read: number;              // Count from fetch()
  records_inserted: number;          // New records persisted
  records_updated: number;           // Existing records superseded
  records_rejected: number;          // Failed validation
  execution_time_ms: number;         // Total duration
  import_checksum: string;           // SHA256 of entire payload
  errors: Record<string, string[]>;  // { field: [error messages] }
  status: 'pending' | 'success' | 'partial' | 'failed';
  created_at: Date;
  completed_at: Date;
}
```

---

## Dataset Health Dashboard API

**Internal API** (no UI yet):

```typescript
interface DatasetHealthService {
  /**
   * Get coverage % for a dataset across all active tournaments.
   * Returns: { dataset, coverage_pct, missing_players, missing_tournaments }
   */
  getCoverage(dataset: string): Promise<CoverageReport>;

  /**
   * Get freshness of a dataset.
   * Returns: { dataset, last_updated, age_days, stale_threshold_exceeded }
   */
  getFreshness(dataset: string): Promise<FreshnessReport>;

  /**
   * Detect missing fields in a dataset.
   * Returns: { missing_fields: [{ field, tournament_count, player_count }] }
   */
  getMissingFields(dataset: string): Promise<MissingFieldsReport>;

  /**
   * Count duplicates detected by checksum.
   * Returns: { duplicate_count, example_ids }
   */
  getDuplicateCount(dataset: string): Promise<DuplicateReport>;

  /**
   * List validation failures from recent imports.
   * Returns: { errors: [{ job_id, error_type, count, examples }] }
   */
  getValidationFailures(dataset: string): Promise<ValidationFailureReport>;

  /**
   * Comprehensive health report for all datasets.
   * Returns dashboard data showing coverage, freshness, issues.
   */
  getComprehensiveHealth(): Promise<HealthDashboard>;
}
```

---

## Directory Structure

```
lib/imports/
├── README.md                           (this file)
├── historical-importer.ts              (interface definition)
├── temporal-validator.ts               (shared temporal validation)
├── health-service.ts                   (dataset health APIs)
│
├── datasets/
│   ├── owgr-rankings-importer.ts       (OWGR rankings importer)
│   ├── player-statistics-importer.ts   (SG components importer)
│   ├── dfs-salary-importer.ts          (DraftKings salary importer)
│   ├── betting-odds-importer.ts        (Betting odds importer)
│   ├── tournament-outcomes-importer.ts (Tournament results importer)
│   └── dfs-ownership-importer.ts       (Optional: DFS ownership)
│
├── __tests__/
│   ├── temporal-validator.test.ts
│   ├── owgr-rankings-importer.test.ts
│   ├── player-statistics-importer.test.ts
│   ├── dfs-salary-importer.test.ts
│   ├── betting-odds-importer.test.ts
│   ├── tournament-outcomes-importer.test.ts
│   └── idempotency.test.ts             (cross-importer idempotency tests)
│
└── integration-tests/
    └── full-replay-cycle.test.ts       (E2E import + replay verification)
```

---

## Integration Tests Required

### **Test 1: Idempotent Imports**
```
Given: OWGR rankings for 5 players (100 records)
When: Import run 1 → 100 inserted
When: Import run 2 (same data) → 0 inserted, 100 skipped
Then: Database has exactly 100 records (no duplicates)
```

### **Test 2: Temporal Validation**
```
Given: Replay cutoff = 2026-02-20T14:25:00Z
Given: Import has 50 valid records + 5 post-cutoff records
When: Import runs
Then: 50 inserted, 5 rejected with error "post_cutoff_violation"
```

### **Test 3: Duplicate Rejection**
```
Given: Two OWGR records for same (player, effective_date) with same provider
When: Import runs
Then: Both rejected with error "duplicate_provider_record"
```

### **Test 4: Checksum Verification**
```
Given: Record R with checksum C
When: Same record imported again
Then: Detected as duplicate via checksum, skipped
When: Record R modified (any field change)
Then: New checksum C', treated as new record, inserted
```

### **Test 5: Provider Conflict Detection**
```
Given: Provider A says player X OWGR rank = 15 on 2026-02-20
Given: Provider B says player X OWGR rank = 16 on 2026-02-20
When: Both imported
Then: Both stored (different providers can disagree), conflict flagged in logs
```

### **Test 6: Provenance Persistence**
```
Given: Import of OWGR records from DataGolf on 2026-07-20
When: Records inserted
Then: Each record has:
  - provider = 'datagolf'
  - retrieved_timestamp = 2026-07-20T... (import time)
  - source_effective_timestamp = (DataGolf's timestamp)
  - import_job_id = (job UUID)
  - checksum = SHA256(record)
```

### **Test 7: Full Replay Cycle**
```
Given: Empty database
When: Import OWGR rankings → outcomes → salaries → odds
When: Build course fit + rolling form (computed)
When: Run projection engine
Then: All 63 inputs available; model produces deterministic rankings
```

---

## Acceptance Criteria

Phase 17.3B is **COMPLETE** when:

- [ ] All 8 interfaces defined (7 importers + 1 health service)
- [ ] Temporal validator implemented
- [ ] Import job tracking schema created
- [ ] Health dashboard API specified (no implementation)
- [ ] All 7 integration tests written (tests may fail; we're writing the spec)
- [ ] Provenance schema finalized
- [ ] No placeholder implementations (only interfaces + tests)

Phase 17.3C begins when all above are in place and tests are passing against mock data.

