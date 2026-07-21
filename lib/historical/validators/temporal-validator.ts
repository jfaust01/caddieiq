/**
 * Temporal validation for historical records
 * Ensures data integrity around effective dates and validity windows
 */

export interface TemporalValidationError {
  recordIndex: number;
  field: string;
  error: string;
  value?: unknown;
}

export class TemporalValidator {
  /**
   * Validate that source effective timestamp is not in the future
   */
  static validateSourceNotFuture(
    sourceEffective: Date,
    errors: TemporalValidationError[] = []
  ): TemporalValidationError[] {
    if (sourceEffective > new Date()) {
      errors.push({
        recordIndex: 0,
        field: "sourceEffectiveTimestamp",
        error: "Source effective timestamp is in the future",
        value: sourceEffective.toISOString(),
      });
    }
    return errors;
  }

  /**
   * Validate that record is not past the cutoff (lock datetime)
   */
  static validateNotPastCutoff(
    sourceEffective: Date,
    cutoffDateTime: Date,
    recordIndex: number = 0,
    errors: TemporalValidationError[] = []
  ): TemporalValidationError[] {
    if (sourceEffective > cutoffDateTime) {
      errors.push({
        recordIndex,
        field: "sourceEffectiveTimestamp",
        error: `Record effective date (${sourceEffective.toISOString()}) is after cutoff (${cutoffDateTime.toISOString()})`,
        value: sourceEffective.toISOString(),
      });
    }
    return errors;
  }

  /**
   * Validate validity window: validFrom < validTo (if provided)
   */
  static validateValidityWindow(
    validFrom: Date,
    validTo: Date | null,
    recordIndex: number = 0,
    errors: TemporalValidationError[] = []
  ): TemporalValidationError[] {
    if (validTo !== null && validFrom >= validTo) {
      errors.push({
        recordIndex,
        field: "validity_window",
        error: `validFrom (${validFrom.toISOString()}) must be before validTo (${validTo?.toISOString()})`,
      });
    }
    return errors;
  }

  /**
   * Validate that validity window does not overlap with existing records
   * (Simplified - in production would check database)
   */
  static validateNoOverlap(
    canonicalId: string,
    provider: string,
    validFrom: Date,
    validTo: Date | null,
    existingRecords: Array<{
      validFrom: Date;
      validTo: Date | null;
    }> = [],
    recordIndex: number = 0,
    errors: TemporalValidationError[] = []
  ): TemporalValidationError[] {
    for (const existing of existingRecords) {
      const overlap =
        validFrom < (existing.validTo || new Date(9999, 0, 1)) &&
        (validTo || new Date(9999, 0, 1)) > existing.validFrom;
      if (overlap) {
        errors.push({
          recordIndex,
          field: "validity_window",
          error: `Validity window overlaps with existing record for ${canonicalId}/${provider}`,
        });
      }
    }
    return errors;
  }

  /**
   * Batch validation of multiple records against a cutoff
   */
  static validateBatch(
    records: Array<{
      sourceEffectiveTimestamp: Date;
      validFrom: Date;
      validTo: Date | null;
      index: number;
    }>,
    cutoffDateTime: Date
  ): TemporalValidationError[] {
    const errors: TemporalValidationError[] = [];

    for (const record of records) {
      this.validateSourceNotFuture(record.sourceEffectiveTimestamp, errors);
      this.validateNotPastCutoff(
        record.sourceEffectiveTimestamp,
        cutoffDateTime,
        record.index,
        errors
      );
      this.validateValidityWindow(
        record.validFrom,
        record.validTo,
        record.index,
        errors
      );
    }

    return errors;
  }
}
