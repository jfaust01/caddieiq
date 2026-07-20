import { createHash } from "crypto";

/**
 * Idempotency utilities for import jobs
 * Ensures that running the same import twice produces identical results
 */

export class IdempotencyUtil {
  /**
   * Generate deterministic idempotency key from import parameters
   * Same parameters always produce same key
   */
  static generateIdempotencyKey(params: {
    provider: string;
    datasetType: string;
    startDate: Date | string;
    endDate: Date | string;
    tournamentIds?: string[];
    playerIds?: string[];
  }): string {
    const normalized = {
      provider: params.provider,
      datasetType: params.datasetType,
      startDate:
        typeof params.startDate === "string"
          ? params.startDate
          : params.startDate.toISOString(),
      endDate:
        typeof params.endDate === "string"
          ? params.endDate
          : params.endDate.toISOString(),
      tournamentIds: params.tournamentIds ? [...params.tournamentIds].sort() : [],
      playerIds: params.playerIds ? [...params.playerIds].sort() : [],
    };

    const input = JSON.stringify(normalized);
    return createHash("sha256").update(input).digest("hex");
  }

  /**
   * Create a job ID from provider, dataset, and timestamp
   * Used to track unique import runs
   */
  static generateJobId(
    provider: string,
    datasetType: string,
    timestamp: Date = new Date()
  ): string {
    const parts = [
      provider,
      datasetType,
      timestamp.toISOString().replace(/[:.Z]/g, ""),
      Math.random().toString(36).substring(2, 8),
    ];
    return parts.join("_");
  }

  /**
   * Extract timestamp from a job ID (reverse operation)
   */
  static extractTimestampFromJobId(jobId: string): Date | null {
    try {
      const parts = jobId.split("_");
      if (parts.length < 3) return null;

      // Third part is timestamp in format: YYYYMMDDTHHmmss
      const timestamp = parts[2];
      if (!/^\d{8}T\d{6}$/.test(timestamp)) return null;

      const year = parseInt(timestamp.substring(0, 4));
      const month = parseInt(timestamp.substring(4, 6));
      const day = parseInt(timestamp.substring(6, 8));
      const hour = parseInt(timestamp.substring(9, 11));
      const minute = parseInt(timestamp.substring(11, 13));
      const second = parseInt(timestamp.substring(13, 15));

      return new Date(year, month - 1, day, hour, minute, second);
    } catch {
      return null;
    }
  }

  /**
   * Check if two imports are idempotent (same idempotency key)
   */
  static isIdempotent(
    key1: string,
    key2: string
  ): boolean {
    return key1 === key2;
  }

  /**
   * Create checksum of import parameters for comparison
   */
  static checksumParameters(params: Record<string, unknown>): string {
    const input = JSON.stringify(params, Object.keys(params).sort());
    return createHash("sha256").update(input).digest("hex");
  }
}
