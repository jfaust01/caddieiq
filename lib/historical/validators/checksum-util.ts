import { createHash } from "crypto";

/**
 * Deterministic checksum calculation for records
 * Ensures idempotency and duplicate detection
 */
export class ChecksumUtil {
  /**
   * Calculate SHA256 checksum of a normalized record
   * Order of fields matters for determinism
   */
  static calculateChecksum(record: {
    canonicalId: string;
    provider: string;
    providerRecordId: string;
    sourceEffectiveTimestamp: Date | string;
    fields: Record<string, unknown>;
  }): string {
    const normalized = {
      canonicalId: record.canonicalId,
      provider: record.provider,
      providerRecordId: record.providerRecordId,
      sourceEffectiveTimestamp:
        typeof record.sourceEffectiveTimestamp === "string"
          ? record.sourceEffectiveTimestamp
          : record.sourceEffectiveTimestamp.toISOString(),
      fields: JSON.stringify(record.fields, Object.keys(record.fields).sort()),
    };

    const input = JSON.stringify(normalized);
    return createHash("sha256").update(input).digest("hex");
  }

  /**
   * Verify checksum matches expected value
   */
  static verify(
    record: {
      canonicalId: string;
      provider: string;
      providerRecordId: string;
      sourceEffectiveTimestamp: Date | string;
      fields: Record<string, unknown>;
    },
    expectedChecksum: string
  ): boolean {
    return this.calculateChecksum(record) === expectedChecksum;
  }
}
