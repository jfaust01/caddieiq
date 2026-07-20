# Historical Data Architecture: Phase 17.3A

**Date:** 2026-07-20  
**Phase:** 17.3A — Historical Data Foundation and Temporal Integrity  
**Status:** DESIGN AND IMPLEMENTATION  

---

## OBJECTIVE

Enable reproducible historical prediction snapshots by establishing a temporally correct, versioned data foundation that can answer:

> "What information was available for this player immediately before this tournament began?"

The system must support honest historical validation without look-ahead leakage, with complete provenance and immutability.

---

## CURRENT STATE ASSESSMENT

### Existing Infrastructure ✅

The CaddieIQ database has strong foundations:
- **Tournament model** — Tournament, TournamentCourse, TournamentField
- **Player model** — Player, PlayerTourHistory, PlayerSeasonStatistic
- **Results infrastructure** — Round, PlayerRound, RoundStatistic
- **Betting/Fantasy** — DfsSalary, OddsQuote, FantasyProjection, BettingEvent
- **Course context** — Course, CourseCharacteristic, CourseAnalytics
- **News/Intelligence** — NewsArticle, PlayerIntelligence

### Gaps for Historical Validation ❌

Critical missing components:

1. **Time-versioned player features** — Only current season statistics stored
2. **Historical rankings** — No time-stamped ranking snapshots
3. **Temporal feature queries** — No "as of" query capability
4. **Tournament lock datetime** — No enforcement of prediction cutoff
5. **Canonical identity mapping** — No provider ID tracking
6. **Immutability at persistence** — Only application-level controls
7. **Data provenance tracking** — Limited source tracking
8. **Pilot tournament loading** — No historical data imports

---

## ARCHITECTURE DESIGN

### 1. CANONICAL ENTITY IDENTIFIERS

#### Provider Mapping Registry

```typescript
// Table: provider_id_mappings
// Purpose: Map external provider IDs to canonical internal IDs

interface ProviderIDMapping {
  id: string;                          // Internal CUID
  entityType: string;                  // "player" | "tournament" | "course"
  internalId: string;                  // CaddieIQ internal ID
  providerId: string;                  // Provider-specific ID
  provider: string;                    // "sportsdataio" | "pga_tour" | "datagolf"
  providerRecordId: string;            // Original record ID from provider
  mappingStatus: "verified" | "pending" | "disputed" | "rejected";
  verificationSource: string;          // How mapping was verified
  verificationTimestamp: DateTime;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### Identity Resolution Service

```typescript
// Service: CanonicalIdentityResolver
// Purpose: Deterministic resolution of provider IDs to internal IDs

interface CanonicalIdentityResolver {
  resolvePlayerId(providerId: string, provider: string): Promise<string | null>;
  resolveTournamentId(providerId: string, provider: string): Promise<string | null>;
  resolveCourseId(providerId: string, provider: string): Promise<string | null>;
  
  mapPlayerIdentity(providerId: string, internalId: string, provider: string): Promise<void>;
  mapTournamentIdentity(providerId: string, internalId: string, provider: string): Promise<void>;
  mapCourseIdentity(providerId: string, internalId: string, provider: string): Promise<void>;
  
  getUnresolvedMappings(): Promise<ProviderIDMapping[]>;
  getCollisions(entityType: string): Promise<ProviderIDMapping[][]>;
}
```

---

### 2. TOURNAMENT EDITION SEPARATION

#### TournamentEdition Model

```typescript
// Current: Tournament (already good)
// Enhancement: Add temporal metadata

interface TournamentEnhanced {
  // ... existing fields
  
  // NEW: Temporal boundaries
  lockDatetime: DateTime;              // Predictions locked before this time
  startDatetime: DateTime;             // Tournament begins
  endDatetime: DateTime;               // Tournament ends
  
  // NEW: Edition identification
  editionSequence: number;             // Nth occurrence (1, 2, 3, ...)
  tournamentSeriesId: string;          // Links to historical series
  
  // NEW: Provider tracking
  providerEditionId: string;           // SportsDataIO event ID
  providerIdentifiers: Record<string, string>;  // Multi-provider mapping
  
  // NEW: Immutability enforcement
  lockDatetimeIsImmutable: boolean;    // DB constraint
}
```

#### Tournament Edition Query Service

```typescript
interface TournamentEditionService {
  // Find specific tournament occurrence
  getTournamentEdition(year: number, tournamentName: string): Promise<Tournament>;
  
  // Verify lock boundary not crossed
  verifyPreLockData(tournamentId: string, featureTimestamp: DateTime): Promise<boolean>;
  
  // Get lock datetime for snapshot query
  getLockDatetime(tournamentId: string): Promise<DateTime>;
}
```

---

### 3. HISTORICAL TOURNAMENT FIELD

#### Enhanced TournamentField

```typescript
// Current: TournamentField (good basics)
// Enhancement: Add temporal tracking

interface TournamentFieldEnhanced {
  // ... existing fields
  
  // NEW: Temporal tracking
  entryConfirmedAt: DateTime | null;   // When field confirmed
  withdrawalTimestamp: DateTime | null; // When withdrawal occurred
  withdrawalKnownTimestamp: DateTime | null; // When CaddieIQ learned of withdrawal
  entryStatusChangedAt: DateTime;      // Timestamp of last status change
  sourceEffectiveTimestamp: DateTime;  // When data became true in source
  
  // NEW: Alternate tracking
  alternateStatus: "primary" | "alternate" | "alternate_called" | null;
  alternateCallTimestamp: DateTime | null;
  
  // NEW: Provenance
  sourceProvider: string;              // "sportsdataio" | "pga_tour"
  sourceRecordId: string;              // Original provider record
  retrievedTimestamp: DateTime;        // When CaddieIQ fetched this data
}
```

#### Field Status Query

```typescript
// Determine field status as of specific datetime
interface FieldStatusAsOf {
  playerId: string;
  status: "confirmed" | "alternate" | "withdrawn" | "not_in_field" | "unknown";
  knownAsOf: DateTime;
  isPrimaryField: boolean;
  confidence: number;  // 0-1 based on data completeness
}

interface TournamentFieldService {
  // Get field status exactly as it was known before tournament lock
  getFieldAsOfLockTime(tournamentId: string): Promise<FieldStatusAsOf[]>;
  
  // Verify no post-lock data included
  verifyNoPostLockFieldChanges(tournamentId: string): Promise<boolean>;
  
  // Audit trail of all field changes
  getFieldChangeAuditTrail(tournamentId: string): Promise<FieldChange[]>;
}
```

---

### 4. BITEMPORAL FEATURE STORAGE

#### HistoricalPlayerFeature Model

```typescript
// NEW table: historical_player_features
// Purpose: Version all player feature values with temporal metadata

interface HistoricalPlayerFeature {
  id: string;                          // CUID
  
  // Identity
  playerId: string;                    // FK to Player
  featureKey: string;                  // "worldRanking", "recentForm", "drivingDistance"
  featureVersion: string;              // "16B.3-frozen" (matches model version)
  
  // Value
  featureValue: number | string | null;
  unit: string | null;                 // "strokes", "yards", "points"
  
  // Bitemporal timestamps
  validFrom: DateTime;                 // When value became true in source domain
  validTo: DateTime | null;            // When value stopped being true (null = current)
  systemRecordedAt: DateTime;          // When CaddieIQ recorded this value
  
  // Provenance
  sourceProvider: string;              // "sportsdataio", "datagolf", "pga_tour"
  sourceRecordId: string;              // Original provider record ID
  retrievalTimestamp: DateTime;        // When CaddieIQ fetched this
  rawPayloadChecksum: string;          // Hash of original data for audit
  
  // Quality tracking
  dataQualityStatus: "verified" | "estimated" | "partial" | "error";
  missingDataReason: string | null;    // If null, data is present
  
  // Transformation tracking
  transformationVersion: string;       // "1.0", "1.1" (formula used)
  
  // Immutability
  sealed: boolean;                     // Once sealed, cannot be updated
  sealedAt: DateTime | null;
  
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### Temporal Feature Query API

```typescript
interface TemporalFeatureQuery {
  // Core: "What feature values were known before this timestamp?"
  getFeaturesAsOfTime(
    playerId: string,
    asOfTimestamp: DateTime,
    featureKeys?: string[]
  ): Promise<HistoricalPlayerFeature[]>;
  
  // Strict: "What feature values were available AND known before this time?"
  getFeaturesAvailableAndKnownBefore(
    playerId: string,
    beforeTimestamp: DateTime,
    requiredFeatures?: string[]
  ): Promise<{
    features: HistoricalPlayerFeature[];
    excludedLateArrivals: HistoricalPlayerFeature[];
    missingFeatures: string[];
  }>;
  
  // History: "What were all versions of this feature?"
  getFeatureHistory(playerId: string, featureKey: string): Promise<HistoricalPlayerFeature[]>;
  
  // Validation: "Is this feature value eligible for this tournament?"
  verifyFeatureEligibility(
    playerId: string,
    featureKey: string,
    tournamentId: string
  ): Promise<{
    eligible: boolean;
    reason: string;
    effectiveValue?: number | string;
  }>;
}
```

---

### 5. FEATURE SNAPSHOT QUERY SERVICE

#### Deterministic Snapshot Generation

```typescript
interface HistoricalSnapshot {
  snapshotId: string;                  // CUID for immutable reference
  snapshotHash: string;                // Deterministic hash of snapshot
  
  // Identification
  tournamentId: string;
  playerId: string;
  lockTimestamp: DateTime;
  modelVersion: string;                // "16B.3-frozen"
  featureSetVersion: string;           // "v1.0"
  
  // Features
  features: Record<string, {
    value: number | string | null;
    sourceProvider: string;
    sourceTimestamp: DateTime;
    dataQuality: string;
  }>;
  
  // Metadata
  featuresIncluded: string[];          // List of features in snapshot
  featuresExcluded: string[];          // Features requested but unavailable
  lateArrivalsExcluded: HistoricalPlayerFeature[];  // Features rejected due to lock
  completenessScore: number;           // 0-1 (features present / total required)
  
  // Immutability
  sealed: boolean;
  sealedAt: DateTime | null;
  
  // Audit
  generatedAt: DateTime;
  generatedBy: string;                 // Service name
}

interface SnapshotService {
  // Generate deterministic snapshot with deduplication
  generateSnapshot(
    tournamentId: string,
    playerId: string,
    modelVersion: string,
    featureSetVersion: string
  ): Promise<HistoricalSnapshot>;
  
  // Verify snapshot is reproducible
  verifySnapshotDeterminism(
    snapshotId: string,
    regenerateAndCompare: boolean
  ): Promise<{
    deterministic: boolean;
    hashMatch: boolean;
    differences?: string[];
  }>;
  
  // Audit snapshot generation
  getSnapshotAuditTrail(snapshotId: string): Promise<AuditEvent[]>;
  
  // Seal snapshot immutably
  sealSnapshot(snapshotId: string): Promise<void>;
}
```

---

### 6. IMMUTABILITY AT PERSISTENCE LEVEL

#### Database Constraints

```sql
-- Once a snapshot is sealed, it becomes immutable
ALTER TABLE historical_snapshots
  ADD CONSTRAINT snapshot_sealed_immutable
  CHECK (
    (sealed = false) OR
    (sealed = true AND sealed_at IS NOT NULL)
  );

-- Historical features used in sealed snapshots cannot be updated
CREATE TRIGGER prevent_update_sealed_features
  BEFORE UPDATE ON historical_player_features
  FOR EACH ROW
  WHEN (OLD.sealed = true)
  BEGIN
    RAISE EXCEPTION 'Cannot update sealed historical feature';
  END;

-- Tournament lock datetime is immutable after any field is confirmed
ALTER TABLE tournaments
  ADD CONSTRAINT lock_datetime_immutable
  CHECK (
    -- Can only be set once; never changed
    (lock_datetime IS NULL) OR
    (lock_datetime_set_at IS NOT NULL)
  );
```

#### Append-Only Audit Log

```typescript
interface HistoricalDataAuditEvent {
  id: string;
  eventType: "feature_added" | "feature_updated" | "snapshot_sealed" | "lock_datetime_set";
  entityType: "player_feature" | "snapshot" | "tournament";
  entityId: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason: string;
  performedBy: string;
  performedAt: DateTime;
  createdAt: DateTime;
}
```

---

### 7. DATA QUALITY VALIDATION

#### Validation Rules

```typescript
interface DataQualityCheck {
  // Duplicate detection
  checkDuplicatePlayerMappings(): Promise<Duplicate[]>;
  checkDuplicateTournamentMappings(): Promise<Duplicate[]>;
  
  // Temporal validity
  checkImpossibleTimestamps(): Promise<TemporalAnomaly[]>;
  checkEffectiveAfterRetrieval(): Promise<TemporalAnomaly[]>;
  
  // Completeness
  checkMissingPlayerIds(): Promise<MissingField[]>;
  checkTournamentFieldMismatches(): Promise<FieldMismatch[]>;
  
  // Leakage detection
  checkPostLockFeatureLeakage(tournamentId: string): Promise<Leakage[]>;
  checkResultsWithoutField(tournamentId: string): Promise<ResultWithoutField[]>;
  
  // Consistency
  checkConflictingFinishPositions(tournamentId: string): Promise<Conflict[]>;
  checkSalaryOddsTimestampViolations(): Promise<TimestampViolation[]>;
}

interface DataQualityReport {
  reportId: string;
  importJobId: string;
  generatedAt: DateTime;
  
  totalChecksRun: number;
  checksPassedCount: number;
  checksFailedCount: number;
  
  details: {
    duplicatePlayerMappings: number;
    duplicateTournamentMappings: number;
    impossibleTimestamps: number;
    effectiveAfterRetrieval: number;
    missingPlayerIds: number;
    fieldMismatches: number;
    postLockLeakage: number;
    resultsWithoutField: number;
    conflictingPositions: number;
    salaryOddsViolations: number;
  };
  
  // Determination
  qualityStatus: "excellent" | "good" | "acceptable" | "degraded" | "failed";
  blockingIssues: Issue[];
  warningIssues: Issue[];
  recommendedActions: string[];
}
```

---

### 8. PILOT TOURNAMENT LOADING

#### Pilot Data Specification

**Selection Criteria:**
- Completed tournament (results known)
- Good data availability from SportsDataIO
- Relatively recent (2023-2026) for data availability
- Sufficient field size (100+ players typical)

**Example Pilot:** 2025 U.S. Open (if data available)

#### Pilot Verification

```typescript
interface PilotVerificationChecklist {
  tournamentEditionExists: boolean;
  officialFieldLoaded: boolean;
  playerIDsMapped: boolean;
  historicalFeaturesPresent: boolean;
  lockAwareSnapshotWorks: boolean;
  lateValuesExcluded: boolean;
  resultsStoredSeparately: boolean;
  provenanceComplete: boolean;
  snapshotHashesReproducible: boolean;
  immutabilityEnforced: boolean;
  
  allChecksPassed(): boolean;
}
```

---

## IMPLEMENTATION ROADMAP

### Phase 1: Schema Extensions (Current)
- Add `HistoricalPlayerFeature` table
- Add `HistoricalSnapshot` table
- Add `ProviderIDMapping` table
- Add temporal fields to existing tables
- Create immutability constraints

### Phase 2: Query Services
- Implement `TemporalFeatureQuery`
- Implement `SnapshotService`
- Implement `TournamentEditionService`
- Implement `DataQualityCheck`

### Phase 3: Pilot Loading
- Load one complete tournament
- Verify all infrastructure

### Phase 4: Validation
- Run automated tests
- Verify no look-ahead leakage
- Confirm reproducibility

---

## GOVERNANCE PRINCIPLES

1. **No Fabrication** — Never create data that wasn't provided by source
2. **Complete Provenance** — Every value traces to its source
3. **Temporal Accuracy** — Distinctions between "when true" and "when known"
4. **Immutability** — Once sealed, historical data is permanent
5. **Auditability** — Every change has an audit trail
6. **Testability** — Deterministic reproducibility validated by tests

---

**Status: Design Complete — Ready for Implementation**

