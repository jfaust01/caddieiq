/**
 * Data Quality Layer — core types.
 *
 * This layer sits between the domain mappers (`lib/domain`) and the import
 * pipeline / repositories. It evaluates mapped domain objects and produces a
 * structured {@link QualityReport}. It performs no I/O, no persistence, and no
 * data fetching — every function here is pure and synchronous so it can be unit
 * tested without a database or network.
 *
 * TODO(repositories): repositories will consume {@link ValidationOutcome} —
 * persisting only entries whose report `isValid` is true (or above a configured
 * quality threshold), and surfacing warnings/errors to the Admin data-quality
 * surface.
 */

/** The kind of domain object a report describes. */
export type EntityKind = "player" | "course" | "tournament"

/** Severity of a single data-quality finding. */
export type IssueSeverity = "error" | "warning"

/**
 * Stable, machine-readable identifiers for the kinds of problem this layer
 * detects. Kept as a union (not free-form strings) so downstream consumers can
 * branch on them and so reporting stays consistent.
 */
export type IssueCode =
  | "REQUIRED_FIELD_MISSING"
  | "INVALID_DATE"
  | "DATE_RANGE_INVALID"
  | "INVALID_NUMBER"
  | "NUMBER_OUT_OF_RANGE"
  | "INVALID_COUNTRY_CODE"
  | "INVALID_COORDINATES"
  | "DUPLICATE_IDENTIFIER"
  | "DUPLICATE_SLUG"
  | "MISSING_RELATIONSHIP"
  | "SUSPECT_VALUE"

/**
 * A single finding about one field of one entity. Errors block persistence;
 * warnings are advisory and only reduce the quality score.
 */
export interface QualityIssue {
  code: IssueCode
  severity: IssueSeverity
  /** Dot-path to the offending field, when applicable (e.g. "startDate"). */
  path?: string
  /** Human-readable explanation, safe to surface in the Admin portal. */
  message: string
  /** The offending value, when useful for triage. Never contains secrets. */
  value?: unknown
}

/**
 * The result of evaluating a single domain object.
 *
 * `isValid` is true only when there are no `error`-severity issues; warnings do
 * not invalidate an entry. `score` is a 0–100 quality score (see
 * `quality-report.ts`).
 */
export interface QualityReport {
  entity: EntityKind
  /** Provider + external id of the evaluated object, for traceability. */
  reference: { source: string; externalId: string }
  isValid: boolean
  score: number
  errors: QualityIssue[]
  warnings: QualityIssue[]
}

/**
 * A domain object paired with the report produced for it. This is the unit the
 * import pipeline consumes — it can persist `entity` when `report.isValid`.
 */
export interface EvaluatedEntity<T> {
  entity: T
  report: QualityReport
}

/**
 * The aggregate result of evaluating a batch of one entity kind. Duplicate
 * detection (identifiers, slugs) is a batch-level concern and is reflected in
 * the individual reports as well as the summary counts here.
 */
export interface ValidationOutcome<T> {
  entity: EntityKind
  evaluated: EvaluatedEntity<T>[]
  summary: {
    total: number
    valid: number
    invalid: number
    withWarnings: number
    /** Mean quality score across the batch, rounded to an integer. */
    averageScore: number
  }
}

/**
 * A rule evaluates one already-mapped entity in isolation and returns any issues
 * it finds (empty array = clean). Rules are pure functions; cross-entity checks
 * such as duplicate detection are handled by the validator, not by rules.
 */
export type QualityRule<T> = (entity: T) => QualityIssue[]
