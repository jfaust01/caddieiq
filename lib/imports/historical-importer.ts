/**
 * Historical Importer Interface
 *
 * Every historical data importer must implement this interface to guarantee:
 * - Idempotent persistence (safe to run multiple times)
 * - Temporal validation (no post-cutoff data leakage)
 * - Complete provenance tracking
 * - Deterministic, testable behavior
 *
 * Phase: 17.3B (Design only - no implementations yet)
 */

/**
 * Criteria for discovering and fetching historical data.
 */
export interface DiscoveryCriteria {
  /** Start date (inclusive) for data window */
  startDate: Date;
  /** End date (inclusive) for data window */
  endDate: Date;
  /** Optional: filter to specific tournament IDs */
  tournamentIds?: string[];
  /** Optional: filter to specific player IDs */
  playerIds?: string[];
  /** Optional: filter to specific providers (if multi-source) */
  providers?: string[];
}

/**
 * Result of discovery: metadata about what data is available.
 */
export interface DiscoveryResult {
  /** Name of the dataset */
  dataset: string;
  /** Primary data source (e.g., 'datagolf', 'draftkings') */
  provider: string;
  /** Estimated total records available for criteria */
  estimatedRecordCount: number;
  /** Date range in source system */
  sourceAvailableFrom: Date;
  sourceAvailableTo: Date;
  /** List of available sub-providers or data versions */
  availableVersions: string[];
  /** Whether discovery encountered any errors or warnings */
  discoveryHealthy: boolean;
  /** Diagnostic messages if not healthy */
  notes?: string[];
}

/**
 * Raw record as returned directly from source (no transformation).
 */
export interface RawRecord {
  /** Original provider ID (may be string, int, or compound) */
  providerRecordId: string;
  /** Complete raw payload (preserve exactly as received) */
  payload: Record<string, unknown>;
  /** Timestamp when source says this data is valid-from */
  sourceEffectiveTimestamp: Date;
  /** Provider versioning if applicable */
  providerVersion?: string;
}

/**
 * Normalized record after transformation to canonical schema.
 */
export interface NormalizedRecord {
  /** Internal canonical ID (usually player_id for player datasets) */
  canonicalId: string;
  /** Data source (e.g., 'datagolf', 'draftkings') */
  provider: string;
  /** Original provider's ID for this record */
  providerRecordId: string;
  /** When provider says data is effective-from */
  sourceEffectiveTimestamp: Date;
  /** Timestamp when we fetched it */
  retrievedTimestamp: Date;
  /** Provider's versioning if applicable */
  providerVersion?: string;
  /** SHA256 of this normalized record (for deduplication) */
  checksum: string;
  /** Start of validity window */
  validFrom: Date;
  /** End of validity window (null = current) */
  validTo: Date | null;
  /** Dataset-specific fields (e.g., for OWGR: rank, points) */
  fields: Record<string, unknown>;
  /** Metadata for tracking */
  metadata: {
    datasetName: string;
    rowIndex: number;
  };
}

/**
 * Result of validation: which records passed, which failed.
 */
export interface ValidationResult {
  /** Records that passed all validation */
  valid: NormalizedRecord[];
  /** Records that failed validation */
  rejected: RejectedRecord[];
  /** Overall validation healthy */
  isHealthy: boolean;
  /** Summary statistics */
  stats: {
    totalProcessed: number;
    passedCount: number;
    rejectedCount: number;
    duplicateCount: number;
    temporalViolationCount: number;
  };
}

/**
 * A record that failed validation with reasons.
 */
export interface RejectedRecord {
  /** The record that failed */
  record: NormalizedRecord;
  /** Why it was rejected */
  errors: string[];
  /** Category of error */
  errorCategory: 'temporal' | 'schema' | 'duplicate' | 'business-rule' | 'other';
}

/**
 * Result of persisting validated records to database.
 */
export interface PersistenceResult {
  /** Import job ID tracking this run */
  jobId: string;
  /** Records newly inserted */
  inserted: number;
  /** Records that already existed (skipped due to idempotency) */
  skipped: number;
  /** Records that replaced older versions (set valid_to on old) */
  updated: number;
  /** Overall success */
  success: boolean;
  /** Total execution time in milliseconds */
  executionTimeMs: number;
  /** Any errors encountered (but job still succeeded partially) */
  partialErrors?: string[];
}

/**
 * Result of verifying persisted records.
 */
export interface VerificationResult {
  /** Records verified count */
  recordsVerified: number;
  /** Integrity checks passed */
  integrityChecksPassed: boolean;
  /** Checksum verification passed */
  checksumVerified: boolean;
}

/**
 * Main interface all historical importers must implement.
 */
export interface HistoricalImporter<T extends NormalizedRecord = NormalizedRecord> {
  /** Get provider ID */
  getProviderId(): string;

  /** Get dataset type */
  getDatasetType(): string;
  readonly provider: string;

  /**
   * Discover available data without fetching.
   * Returns metadata about what exists in the source.
   */
  discover(criteria: DiscoveryCriteria): Promise<DiscoveryResult>;

  /**
   * Fetch raw records from source.
   * Returns exactly what source provided, unmodified.
   */
  fetch(criteria: DiscoveryCriteria): Promise<RawRecord[]>;

  /**
   * Transform raw records to normalized canonical form.
   * Pure function; no side effects.
   */
  normalize(raw: RawRecord[]): T[];

  /**
   * Validate normalized records against business rules.
   * Checks temporal boundaries, detects duplicates, enforces schema.
   */
  validate(normalized: T[], replayCutoff?: Date): Promise<ValidationResult>;

  /**
   * Persist validated records to database.
   * Guarantees idempotency: safe to run multiple times.
   *
   * @param validated - Records from validate()
   * @param jobId - Import job tracking ID
   * @returns Persistence result with counts
   */
  persist(validated: T[], jobId: string): Promise<PersistenceResult>;

  /**
   * Verify records persisted correctly.
   * Reads back from database, validates checksums and counts.
   */
  verify(jobId: string): Promise<VerificationResult>;
}

/**
 * Temporal validation helpers (shared across importers).
 */
export interface TemporalValidator {
  /**
   * Reject records with effective_timestamp > replay_cutoff.
   * Prevents data leakage after tournament lock.
   */
  isBeforeCutoff(
    effectiveTimestamp: Date,
    cutoff: Date
  ): boolean;

  /**
   * Reject records with future timestamps.
   * Catches data entry errors or clock skew.
   */
  isNotInFuture(timestamp: Date, asOf?: Date): boolean;

  /**
   * Detect duplicate records in a set.
   * Uses (provider, provider_record_id, checksum) as key.
   */
  findDuplicates(records: NormalizedRecord[]): {
    duplicates: NormalizedRecord[][];
    unique: NormalizedRecord[];
  };

  /**
   * Detect conflicts between providers.
   * Flags when different providers claim different values for same entity/date.
   */
  detectProviderConflicts(records: NormalizedRecord[]): {
    conflicts: Array<{
      canonicalId: string;
      timestamp: Date;
      providers: Record<string, unknown>;
    }>;
  };
}

/**
 * Dataset health dashboard API (internal only).
 */
export interface DatasetHealthService {
  /**
   * Get coverage % for dataset across active tournaments.
   */
  getCoverage(dataset: string): Promise<{
    dataset: string;
    coveragePercent: number;
    missingTournaments: string[];
    missingPlayers: string[];
  }>;

  /**
   * Get freshness of dataset (when was it last updated?).
   */
  getFreshness(dataset: string): Promise<{
    dataset: string;
    lastUpdated: Date | null;
    ageHours: number | null;
    isStale: boolean;
    staleSinceWhen?: Date;
  }>;

  /**
   * Detect missing fields in dataset.
   */
  getMissingFields(dataset: string): Promise<{
    dataset: string;
    missingFields: Array<{
      field: string;
      missingInTournamentCount: number;
      missingInPlayerCount: number;
    }>;
  }>;

  /**
   * Count duplicates by checksum across all imports.
   */
  getDuplicateCount(dataset: string): Promise<{
    dataset: string;
    duplicateCount: number;
    exampleDuplicates: Array<{ checksum: string; count: number }>;
  }>;

  /**
   * List validation failures from recent imports.
   */
  getValidationFailures(dataset: string): Promise<{
    dataset: string;
    recentFailures: Array<{
      jobId: string;
      errorType: string;
      failureCount: number;
      examples: string[];
    }>;
  }>;

  /**
   * Comprehensive health report for all datasets.
   */
  getComprehensiveHealth(): Promise<{
    timestamp: Date;
    datasets: Array<{
      name: string;
      provider: string;
      coverage: number;
      freshness: number;
      duplicates: number;
      validationFailures: number;
      overallHealth: 'healthy' | 'warning' | 'critical';
    }>;
  }>;
}

/**
 * Import job record (stored in database).
 */
export interface ImportJob {
  id: string;
  dataset: string;
  provider: string;
  recordsRead: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsRejected: number;
  executionTimeMs: number;
  importChecksum: string;
  errors: Record<string, string[]>;
  status: 'pending' | 'success' | 'partial' | 'failed';
  createdAt: Date;
  completedAt: Date | null;
}
