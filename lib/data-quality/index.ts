/**
 * Data Quality Layer.
 *
 * Evaluates mapped domain objects (`lib/domain`) before persistence: validation
 * (required fields, dates, numbers, country codes, coordinates), intra-batch
 * duplicate detection (identifiers, slugs), quality scoring, and structured
 * reporting. It writes nothing and fetches nothing — it is a pure gate the
 * import pipeline runs before handing validated objects to repositories.
 *
 * TODO(repositories): the import pipeline should consume `ValidationOutcome`,
 * persist only `report.isValid` entities (optionally above
 * `HIGH_QUALITY_THRESHOLD`), and resolve required relationships there.
 */

// Types
export type {
  EntityKind,
  IssueSeverity,
  IssueCode,
  QualityIssue,
  QualityReport,
  EvaluatedEntity,
  ValidationOutcome,
  QualityRule,
} from "./types"

// Errors
export {
  DataQualityError,
  ValidationError,
  DuplicateError,
  RelationshipError,
  QualityWarning,
} from "./errors"

// Scoring & reporting
export {
  computeQualityScore,
  buildQualityReport,
  averageScore,
  HIGH_QUALITY_THRESHOLD,
} from "./quality-report"

// Per-entity rules
export { validatePlayer, validateCourse, validateTournament } from "./rules"

// Validator orchestrator
export {
  evaluatePlayer,
  evaluateCourse,
  evaluateTournament,
  validatePlayers,
  validateCourses,
  validateTournaments,
} from "./validator"

// Tournament-field validation (focused; see field-validator.ts for rationale)
export { validateFieldEntries, type FieldValidationResult } from "./field-validator"
