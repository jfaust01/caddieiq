import { describe, it, expect, beforeEach } from "@jest/globals";
import { ChecksumUtil } from "@/lib/historical/validators/checksum-util";
import { TemporalValidator } from "@/lib/historical/validators/temporal-validator";
import { ProvenanceValidator } from "@/lib/historical/validators/provenance-validator";
import { IdempotencyUtil } from "@/lib/historical/validators/idempotency-util";

describe("Historical Validators", () => {
  describe("ChecksumUtil", () => {
    it("produces deterministic checksums", () => {
      const record = {
        canonicalId: "player_123",
        provider: "sportsdataio",
        providerRecordId: "rec_456",
        sourceEffectiveTimestamp: new Date("2025-02-20T00:00:00Z"),
        fields: { rank: 1, score: 100 },
      };

      const checksum1 = ChecksumUtil.calculateChecksum(record);
      const checksum2 = ChecksumUtil.calculateChecksum(record);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("produces different checksums for different data", () => {
      const record1 = {
        canonicalId: "player_123",
        provider: "sportsdataio",
        providerRecordId: "rec_456",
        sourceEffectiveTimestamp: new Date("2025-02-20T00:00:00Z"),
        fields: { rank: 1 },
      };

      const record2 = {
        canonicalId: "player_124",
        provider: "sportsdataio",
        providerRecordId: "rec_456",
        sourceEffectiveTimestamp: new Date("2025-02-20T00:00:00Z"),
        fields: { rank: 1 },
      };

      const checksum1 = ChecksumUtil.calculateChecksum(record1);
      const checksum2 = ChecksumUtil.calculateChecksum(record2);

      expect(checksum1).not.toBe(checksum2);
    });

    it("verifies checksums correctly", () => {
      const record = {
        canonicalId: "player_123",
        provider: "sportsdataio",
        providerRecordId: "rec_456",
        sourceEffectiveTimestamp: new Date("2025-02-20T00:00:00Z"),
        fields: { rank: 1 },
      };

      const checksum = ChecksumUtil.calculateChecksum(record);
      expect(ChecksumUtil.verify(record, checksum)).toBe(true);
      expect(ChecksumUtil.verify(record, "invalid")).toBe(false);
    });
  });

  describe("TemporalValidator", () => {
    it("rejects future timestamps", () => {
      const future = new Date(Date.now() + 86400000); // 1 day in future
      const errors: any[] = [];

      TemporalValidator.validateSourceNotFuture(future, errors);

      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe("sourceEffectiveTimestamp");
    });

    it("accepts past timestamps", () => {
      const past = new Date(Date.now() - 86400000); // 1 day ago
      const errors: any[] = [];

      TemporalValidator.validateSourceNotFuture(past, errors);

      expect(errors.length).toBe(0);
    });

    it("rejects records past cutoff", () => {
      const cutoff = new Date("2025-02-20T14:25:00Z");
      const pastCutoff = new Date("2025-02-20T14:26:00Z");
      const errors: any[] = [];

      TemporalValidator.validateNotPastCutoff(pastCutoff, cutoff, 0, errors);

      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe("sourceEffectiveTimestamp");
    });

    it("validates validity windows", () => {
      const validFrom = new Date("2025-02-20T00:00:00Z");
      const validTo = new Date("2025-02-21T00:00:00Z");
      const errors: any[] = [];

      TemporalValidator.validateValidityWindow(validFrom, validTo, 0, errors);

      expect(errors.length).toBe(0);
    });

    it("rejects inverted validity windows", () => {
      const validFrom = new Date("2025-02-21T00:00:00Z");
      const validTo = new Date("2025-02-20T00:00:00Z");
      const errors: any[] = [];

      TemporalValidator.validateValidityWindow(validFrom, validTo, 0, errors);

      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe("validity_window");
    });
  });

  describe("ProvenanceValidator", () => {
    it("validates provider record IDs", () => {
      const errors: any[] = [];

      ProvenanceValidator.validateProviderRecordId("", 0, errors);

      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe("providerRecordId");
    });

    it("validates provider names", () => {
      const errors: any[] = [];

      ProvenanceValidator.validateProvider("unknown_provider", undefined, 0, errors);

      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe("provider");
    });

    it("validates checksums", () => {
      const errors: any[] = [];

      ProvenanceValidator.validateChecksum("invalid", 0, errors);

      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe("checksum");
    });

    it("accepts valid SHA256 checksums", () => {
      const validChecksum = "a".repeat(64); // Valid hex string
      const errors: any[] = [];

      ProvenanceValidator.validateChecksum(validChecksum, 0, errors);

      expect(errors.length).toBe(0);
    });

    it("detects duplicate provider record IDs", () => {
      const records = [
        { providerRecordId: "rec_1", index: 0 },
        { providerRecordId: "rec_1", index: 1 },
        { providerRecordId: "rec_2", index: 2 },
      ];
      const errors: any[] = [];

      ProvenanceValidator.detectDuplicates(records, errors);

      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe("providerRecordId");
    });
  });

  describe("IdempotencyUtil", () => {
    it("generates deterministic idempotency keys", () => {
      const params = {
        provider: "sportsdataio",
        datasetType: "RANKINGS",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-02-01"),
      };

      const key1 = IdempotencyUtil.generateIdempotencyKey(params);
      const key2 = IdempotencyUtil.generateIdempotencyKey(params);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("produces different keys for different parameters", () => {
      const params1 = {
        provider: "sportsdataio",
        datasetType: "RANKINGS",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-02-01"),
      };

      const params2 = {
        provider: "datagolf",
        datasetType: "RANKINGS",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-02-01"),
      };

      const key1 = IdempotencyUtil.generateIdempotencyKey(params1);
      const key2 = IdempotencyUtil.generateIdempotencyKey(params2);

      expect(key1).not.toBe(key2);
    });

    it("generates unique job IDs", () => {
      const jobId1 = IdempotencyUtil.generateJobId("sportsdataio", "RANKINGS");
      const jobId2 = IdempotencyUtil.generateJobId("sportsdataio", "RANKINGS");

      // Job IDs should be different (due to timestamp or random component)
      expect(jobId1).not.toBe(jobId2);
      expect(jobId1).toMatch(/^sportsdataio_RANKINGS_/);
    });
  });
});
