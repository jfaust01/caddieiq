/**
 * Repository-layer errors.
 *
 * A small, typed hierarchy for persistence failures. These are distinct from
 * provider errors (`lib/providers`) and data-quality errors (`lib/data-quality`)
 * — they describe things that go wrong while *writing to the database*, and they
 * carry enough structured context for import jobs to report precisely without
 * ever leaking secrets or raw driver internals.
 */

/** Discriminating code for a repository error. */
export type RepositoryErrorCode =
  | "PERSISTENCE_ERROR"
  | "CONFLICT_ERROR"
  | "RELATIONSHIP_ERROR"

/** Structured, log-safe context attached to a repository error. */
export interface RepositoryErrorContext {
  /** The entity kind involved (e.g. "player", "course", "tournament"). */
  entity?: string
  /** The operation that failed (e.g. "upsert", "delete"). */
  operation?: string
  /** A non-sensitive natural key for correlation (e.g. a slug). */
  reference?: string
  /** Additional non-sensitive detail. Never place credentials here. */
  [key: string]: unknown
}

/** Base class for all repository failures. */
export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode
  readonly context: RepositoryErrorContext
  /** The original throwable, preserved for diagnostics (never logged raw). */
  readonly cause?: unknown

  constructor(
    message: string,
    options: {
      code?: RepositoryErrorCode
      context?: RepositoryErrorContext
      cause?: unknown
    } = {},
  ) {
    super(message)
    this.name = "RepositoryError"
    this.code = options.code ?? "PERSISTENCE_ERROR"
    this.context = options.context ?? {}
    this.cause = options.cause
  }
}

/**
 * A generic persistence failure — the write reached the database but could not
 * be completed (driver error, timeout, constraint we don't model explicitly).
 */
export class PersistenceError extends RepositoryError {
  constructor(message: string, options: { context?: RepositoryErrorContext; cause?: unknown } = {}) {
    super(message, { ...options, code: "PERSISTENCE_ERROR" })
    this.name = "PersistenceError"
  }
}

/**
 * A uniqueness conflict — e.g. two records resolve to the same unique `slug`.
 * Distinct from a benign upsert (which updates) because it represents a genuine
 * collision the caller must resolve.
 */
export class ConflictError extends RepositoryError {
  /** The unique field(s) that collided, when known. */
  readonly fields?: string[]

  constructor(
    message: string,
    options: { context?: RepositoryErrorContext; cause?: unknown; fields?: string[] } = {},
  ) {
    const { fields, ...rest } = options
    super(message, { ...rest, code: "CONFLICT_ERROR" })
    this.name = "ConflictError"
    this.fields = fields
  }
}

/**
 * A required relationship could not be satisfied — e.g. a tournament references
 * a `tourId` that does not exist, violating a foreign key. The persistence was
 * refused because the graph would be left inconsistent.
 */
export class RelationshipError extends RepositoryError {
  /** The relationship/field that failed (e.g. "tourId"). */
  readonly relation?: string

  constructor(
    message: string,
    options: { context?: RepositoryErrorContext; cause?: unknown; relation?: string } = {},
  ) {
    const { relation, ...rest } = options
    super(message, { ...rest, code: "RELATIONSHIP_ERROR" })
    this.name = "RelationshipError"
    this.relation = relation
  }
}

/**
 * Coerce an unknown throwable into a typed {@link RepositoryError}, mapping
 * well-known Prisma error codes onto the taxonomy:
 *
 * - `P2002` (unique constraint) → {@link ConflictError}
 * - `P2003` / `P2025` (FK / record-not-found) → {@link RelationshipError}
 * - everything else → {@link PersistenceError}
 *
 * The original throwable is preserved as `cause` but never logged raw.
 */
export function toRepositoryError(error: unknown, context: RepositoryErrorContext = {}): RepositoryError {
  if (error instanceof RepositoryError) return error

  const prismaCode = extractPrismaCode(error)
  const message = error instanceof Error ? error.message : String(error)

  switch (prismaCode) {
    case "P2002": {
      const fields = extractTargetFields(error)
      return new ConflictError("Unique constraint violation", { context, cause: error, fields })
    }
    case "P2003":
      return new RelationshipError("Foreign key constraint failed", {
        context,
        cause: error,
        relation: extractFieldName(error),
      })
    case "P2025":
      return new RelationshipError("Required related record not found", { context, cause: error })
    default:
      return new PersistenceError(message || "Persistence failed", { context, cause: error })
  }
}

/** Read a Prisma known-request error code (e.g. "P2002") off an unknown value. */
function extractPrismaCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === "string" ? code : undefined
  }
  return undefined
}

/** Pull the `meta.target` field list off a Prisma P2002 error, if present. */
function extractTargetFields(error: unknown): string[] | undefined {
  if (error && typeof error === "object" && "meta" in error) {
    const meta = (error as { meta?: unknown }).meta
    if (meta && typeof meta === "object" && "target" in meta) {
      const target = (meta as { target?: unknown }).target
      if (Array.isArray(target)) return target.map(String)
      if (typeof target === "string") return [target]
    }
  }
  return undefined
}

/** Pull a related field name off a Prisma FK error's meta, if present. */
function extractFieldName(error: unknown): string | undefined {
  if (error && typeof error === "object" && "meta" in error) {
    const meta = (error as { meta?: unknown }).meta
    if (meta && typeof meta === "object" && "field_name" in meta) {
      const field = (meta as { field_name?: unknown }).field_name
      return typeof field === "string" ? field : undefined
    }
  }
  return undefined
}
