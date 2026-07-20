import { describe, it, expect, beforeEach } from "vitest";
import {
  DiscoveryCriteria,
  DiscoveryResult,
  HistoricalImporter,
  NormalizedRecord,
  RawRecord,
  ValidationResult,
  PersistenceResult,
  VerificationResult,
} from "@/lib/imports/historical-importer";
import { ImporterExecutor } from "@/lib/historical/importer-executor";
import { ImportJobRepository } from "@/lib/historical/repositories/import-job-repository";

/**
 * Mock importer for testing
 */
class MockImporter implements HistoricalImporter {
  getProviderId(): string {
    return "test_provider";
  }

  getDatasetType(): string {
    return "TEST_DATASET";
  }

  async discover(criteria: DiscoveryCriteria): Promise<DiscoveryResult> {
    return {
      dataset: "TEST_DATASET",
      provider: "test_provider",
      estimatedRecordCount: 2,
      sourceAvailableFrom: new Date("2025-01-01"),
      sourceAvailableTo: new Date("2025-02-28"),
      availableVersions: ["1.0"],
      discoveryHealthy: true,
    };
  }

  async fetch(criteria: DiscoveryCriteria): Promise<RawRecord[]> {
    return [
      {
        providerRecordId: "raw_1",
        payload: { id: "1", value: 100 },
        sourceEffectiveTimestamp: new Date("2025-02-19"),
      },
      {
        providerRecordId: "raw_2",
        payload: { id: "2", value: 200 },
        sourceEffectiveTimestamp: new Date("2025-02-19"),
      },
    ];
  }

  normalize(raws: RawRecord[]): NormalizedRecord[] {
    return raws.map((raw, idx) => ({
      canonicalId: `player_${raw.payload.id}`,
      provider: "test_provider",
      providerRecordId: raw.providerRecordId,
      sourceEffectiveTimestamp: raw.sourceEffectiveTimestamp,
      retrievedTimestamp: new Date(),
      checksum: "a".repeat(64),
      validFrom: new Date("2025-02-19"),
      validTo: null,
      fields: raw.payload as Record<string, unknown>,
      metadata: {
        datasetName: "TEST_DATASET",
        rowIndex: idx,
      },
    }));
  }

  async validate(normalized: NormalizedRecord[]): Promise<ValidationResult> {
    // All records are valid in mock
    return {
      valid: normalized,
      rejected: [],
      isHealthy: true,
      stats: {
        totalProcessed: normalized.length,
        passedCount: normalized.length,
        rejectedCount: 0,
        duplicateCount: 0,
        temporalViolationCount: 0,
      },
    };
  }

  async persist(
    records: NormalizedRecord[],
    jobId: string
  ): Promise<PersistenceResult> {
    return {
      inserted: records.length,
      updated: 0,
      skipped: 0,
    };
  }

  async verify(jobId: string): Promise<VerificationResult> {
    return {
      recordsVerified: 2,
      integrityChecksPassed: true,
      checksumVerified: true,
    };
  }
}

describe("ImporterExecutor", () => {
  let executor: ImporterExecutor;
  let repository: ImportJobRepository;
  let importer: MockImporter;
  const cutoffDateTime = new Date("2025-02-20T14:25:00Z");

  beforeEach(async () => {
    repository = new ImportJobRepository();
    importer = new MockImporter();
    executor = new ImporterExecutor(importer, repository, cutoffDateTime);
  });

  it("executes a complete import successfully", async () => {
    const criteria: DiscoveryCriteria = {
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-02-28"),
    };

    const result = await executor.execute(criteria);

    expect(result.success).toBe(true);
    expect(result.job).toBeDefined();
    expect(result.job.recordsRead).toBe(2);
    expect(result.job.recordsInserted).toBe(2);
    expect(result.job.validationErrors).toBe(0);
    expect(result.job.completedAt).toBeDefined();
  });

  it("records job start and completion", async () => {
    const criteria: DiscoveryCriteria = {
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-02-28"),
    };

    const result = await executor.execute(criteria);

    expect(result.job.startedAt).toBeDefined();
    expect(result.job.completedAt).toBeDefined();
    expect(result.job.duration).toBeGreaterThan(0);
  });

  it("generates deterministic idempotency key", async () => {
    const criteria: DiscoveryCriteria = {
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-02-28"),
    };

    const result1 = await executor.execute(criteria);
    const result2 = await executor.execute(criteria);

    // Same source checksum = same idempotency key
    expect(result1.job.sourceChecksum).toBe(result2.job.sourceChecksum);
  });

  it("tracks import job in repository", async () => {
    const criteria: DiscoveryCriteria = {
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-02-28"),
    };

    const result = await executor.execute(criteria);
    const foundJob = await repository.findById(result.job.id);

    expect(foundJob).toBeDefined();
    expect(foundJob?.jobId).toBe(result.job.jobId);
    expect(foundJob?.providerId).toBe("test_provider");
  });

  it("handles import failures gracefully", async () => {
    class FailingImporter extends MockImporter {
      async fetch(): Promise<RawRecord[]> {
        throw new Error("Network error");
      }
    }

    const failingImporter = new FailingImporter();
    const failingExecutor = new ImporterExecutor(failingImporter, repository, cutoffDateTime);

    const criteria: DiscoveryCriteria = {
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-02-28"),
    };

    const result = await failingExecutor.execute(criteria);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.job.completedAt).toBeDefined();
  });
});
