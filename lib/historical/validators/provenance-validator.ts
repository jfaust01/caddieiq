/**
 * Provenance validation for historical records
 * Ensures provider metadata and traceability
 */

export interface ProvenanceValidationError {
  recordIndex: number;
  field: string;
  error: string;
  value?: unknown;
}

export class ProvenanceValidator {
  /**
   * Validate that provider record ID is present and non-empty
   */
  static validateProviderRecordId(
    providerRecordId: string | null | undefined,
    recordIndex: number = 0,
    errors: ProvenanceValidationError[] = []
  ): ProvenanceValidationError[] {
    if (!providerRecordId || providerRecordId.trim() === "") {
      errors.push({
        recordIndex,
        field: "providerRecordId",
        error: "Provider record ID is required and must be non-empty",
        value: providerRecordId,
      });
    }
    return errors;
  }

  /**
   * Validate that provider is recognized
   */
  static validateProvider(
    provider: string | null | undefined,
    validProviders: string[] = [
      "sportsdataio",
      "datagolf",
      "draftkings",
      "geniussports",
      "internal_coursefit",
      "internal_rollingform",
    ],
    recordIndex: number = 0,
    errors: ProvenanceValidationError[] = []
  ): ProvenanceValidationError[] {
    if (!provider || !validProviders.includes(provider)) {
      errors.push({
        recordIndex,
        field: "provider",
        error: `Provider "${provider}" not recognized. Valid: ${validProviders.join(", ")}`,
        value: provider,
      });
    }
    return errors;
  }

  /**
   * Validate provider version consistency if specified
   */
  static validateProviderVersion(
    providerVersion: string | null | undefined,
    recordIndex: number = 0,
    errors: ProvenanceValidationError[] = []
  ): ProvenanceValidationError[] {
    // Provider version is optional but if present must be non-empty
    if (providerVersion === "") {
      errors.push({
        recordIndex,
        field: "providerVersion",
        error: "Provider version must be non-empty if specified",
        value: providerVersion,
      });
    }
    return errors;
  }

  /**
   * Validate checksum is present and valid SHA256
   */
  static validateChecksum(
    checksum: string | null | undefined,
    recordIndex: number = 0,
    errors: ProvenanceValidationError[] = []
  ): ProvenanceValidationError[] {
    if (!checksum) {
      errors.push({
        recordIndex,
        field: "checksum",
        error: "Checksum is required",
        value: checksum,
      });
      return errors;
    }

    // SHA256 produces 64-character hex string
    if (!/^[a-f0-9]{64}$/i.test(checksum)) {
      errors.push({
        recordIndex,
        field: "checksum",
        error: "Checksum must be a valid SHA256 hex string (64 characters)",
        value: checksum,
      });
    }

    return errors;
  }

  /**
   * Detect duplicate provider record IDs in a batch
   */
  static detectDuplicates(
    records: Array<{ providerRecordId: string; index: number }>,
    errors: ProvenanceValidationError[] = []
  ): ProvenanceValidationError[] {
    const seen = new Map<string, number>();

    for (const record of records) {
      const existing = seen.get(record.providerRecordId);
      if (existing !== undefined) {
        errors.push({
          recordIndex: record.index,
          field: "providerRecordId",
          error: `Duplicate provider record ID found (also at index ${existing})`,
          value: record.providerRecordId,
        });
      }
      seen.set(record.providerRecordId, record.index);
    }

    return errors;
  }

  /**
   * Batch validation of provenance metadata
   */
  static validateBatch(
    records: Array<{
      provider: string;
      providerRecordId: string;
      providerVersion?: string;
      checksum: string;
      index: number;
    }>,
    validProviders?: string[]
  ): ProvenanceValidationError[] {
    const errors: ProvenanceValidationError[] = [];

    // Validate each record
    for (const record of records) {
      this.validateProvider(record.provider, validProviders, record.index, errors);
      this.validateProviderRecordId(record.providerRecordId, record.index, errors);
      this.validateProviderVersion(record.providerVersion, record.index, errors);
      this.validateChecksum(record.checksum, record.index, errors);
    }

    // Detect duplicates
    this.detectDuplicates(
      records.map((r) => ({ providerRecordId: r.providerRecordId, index: r.index })),
      errors
    );

    return errors;
  }
}
