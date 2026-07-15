/**
 * Data Quality Layer — typed errors.
 *
 * These model *findings* about data, not runtime failures of the layer itself.
 * They are constructed from {@link QualityIssue} records and can be thrown by a
 * strict caller (e.g. a repository that refuses to persist an invalid entity) or
 * simply inspected. Every error carries the structured issue(s) it represents so
 * callers never have to parse message strings.
 *
 * The hierarchy mirrors the provider error taxonomy in `lib/providers/shared`
 * in spirit (a single base class with narrow subclasses), but is intentionally
 * independent: data-quality findings are a different concern from provider I/O
 * failures.
 */

import type { EntityKind, IssueCode, IssueSeverity, QualityIssue } from "./types"

/** Base class for every data-quality finding surfaced as an error. */
export class DataQualityError extends Error {
  /** Machine-readable code, aligned with {@link IssueCode}. */
  readonly code: IssueCode
  readonly severity: IssueSeverity
  /** Which entity kind the finding relates to, when known. */
  readonly entity?: EntityKind
  /** The structured issues backing this error. */
  readonly issues: QualityIssue[]

  constructor(
    message: string,
    options: {
      code: IssueCode
      severity?: IssueSeverity
      entity?: EntityKind
      issues?: QualityIssue[]
    },
  ) {
    super(message)
    this.name = "DataQualityError"
    this.code = options.code
    this.severity = options.severity ?? "error"
    this.entity = options.entity
    this.issues = options.issues ?? []
  }
}

/**
 * A required field is missing or a value fails a validity check (bad date,
 * out-of-range number, invalid country code / coordinates, …).
 */
export class ValidationError extends DataQualityError {
  constructor(
    message: string,
    options: { code?: IssueCode; entity?: EntityKind; issues?: QualityIssue[] } = {},
  ) {
    super(message, {
      code: options.code ?? "REQUIRED_FIELD_MISSING",
      severity: "error",
      entity: options.entity,
      issues: options.issues,
    })
    this.name = "ValidationError"
  }
}

/**
 * Two or more entities in a batch collide on an identifier or slug that must be
 * unique. Carries the colliding key for triage.
 */
export class DuplicateError extends DataQualityError {
  /** The duplicated value (identifier or slug). */
  readonly duplicateKey: string

  constructor(
    message: string,
    options: {
      duplicateKey: string
      code?: IssueCode
      entity?: EntityKind
      issues?: QualityIssue[]
    },
  ) {
    super(message, {
      code: options.code ?? "DUPLICATE_IDENTIFIER",
      severity: "error",
      entity: options.entity,
      issues: options.issues,
    })
    this.name = "DuplicateError"
    this.duplicateKey = options.duplicateKey
  }
}

/**
 * A required relationship is unresolved (e.g. a tournament with no venue, a
 * player with no nationality). Relationship *resolution* happens in the
 * repository layer; this error flags the precondition that must hold first.
 */
export class RelationshipError extends DataQualityError {
  constructor(
    message: string,
    options: { entity?: EntityKind; issues?: QualityIssue[] } = {},
  ) {
    super(message, {
      code: "MISSING_RELATIONSHIP",
      severity: "error",
      entity: options.entity,
      issues: options.issues,
    })
    this.name = "RelationshipError"
  }
}

/**
 * A non-blocking, advisory finding — data is usable but suspect (missing
 * optional field, implausible-but-not-impossible value). Modeled as an Error
 * subclass for a consistent taxonomy, but callers typically collect rather than
 * throw these.
 */
export class QualityWarning extends DataQualityError {
  constructor(
    message: string,
    options: { code?: IssueCode; entity?: EntityKind; issues?: QualityIssue[] } = {},
  ) {
    super(message, {
      code: options.code ?? "SUSPECT_VALUE",
      severity: "warning",
      entity: options.entity,
      issues: options.issues,
    })
    this.name = "QualityWarning"
  }
}
