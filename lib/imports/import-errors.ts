/**
 * Import pipeline error taxonomy.
 *
 * Each stage of the pipeline (fetch → map → validate → persist) has a
 * corresponding typed error so a failure is always attributable to the layer
 * that produced it. Every error carries the `entity` and `stage` it occurred
 * in and serializes to a compact, secret-free JSON shape for the ImportReport.
 *
 * These errors wrap — they never replace — the underlying layer errors
 * (`ProviderError`, `DataQualityError`, `RepositoryError`). The pipeline does
 * not re-implement any layer's error handling; it only tags failures with
 * pipeline context.
 */

import type { EntityKind } from "@/lib/data-quality"

/** The pipeline stage a failure occurred in. */
export type ImportStage = "fetch" | "map" | "validate" | "persist"

/** A compact, serializable view of an import failure for the report. */
export interface SerializedImportError {
  name: string
  stage: ImportStage
  entity: EntityKind
  provider: string
  code: string
  message: string
  /** Stable reference (e.g. slug or external id) for correlation, when known. */
  reference?: string
}

/** Options shared by every import error. */
export interface ImportErrorOptions {
  entity: EntityKind
  provider: string
  /** A stable identifier for the offending record, when known. */
  reference?: string
  /** The underlying layer error being wrapped. */
  cause?: unknown
  /** Stable machine-readable code; defaults to the wrapped error's code. */
  code?: string
}

/** Extract a `code` from an arbitrary wrapped error, when it exposes one. */
function codeOf(cause: unknown, fallback: string): string {
  if (cause && typeof cause === "object" && "code" in cause) {
    const value = (cause as { code?: unknown }).code
    if (typeof value === "string" && value.length > 0) return value
  }
  return fallback
}

/** Extract a human-readable message from an arbitrary wrapped error. */
function messageOf(cause: unknown, fallback: string): string {
  if (cause instanceof Error && cause.message) return cause.message
  if (typeof cause === "string" && cause) return cause
  return fallback
}

/**
 * Base class for every pipeline failure. Concrete subclasses fix the `stage`
 * so callers can branch on the failing layer.
 */
export abstract class ImportError extends Error {
  abstract readonly stage: ImportStage
  readonly entity: EntityKind
  readonly provider: string
  readonly reference?: string
  readonly code: string
  readonly cause?: unknown

  constructor(message: string, options: ImportErrorOptions) {
    super(message)
    this.name = new.target.name
    this.entity = options.entity
    this.provider = options.provider
    this.reference = options.reference
    this.cause = options.cause
    this.code = options.code ?? codeOf(options.cause, "IMPORT_ERROR")
  }

  /** Serialize to a compact, secret-free shape for the ImportReport. */
  toJSON(): SerializedImportError {
    return {
      name: this.name,
      stage: this.stage,
      entity: this.entity,
      provider: this.provider,
      code: this.code,
      message: this.message,
      reference: this.reference,
    }
  }
}

/** A failure fetching raw data from the provider (stage: fetch). */
export class ProviderImportError extends ImportError {
  readonly stage = "fetch" as const

  static wrap(cause: unknown, options: Omit<ImportErrorOptions, "cause">): ProviderImportError {
    return new ProviderImportError(
      messageOf(cause, "Provider fetch failed."),
      { ...options, cause },
    )
  }
}

/** A failure translating a raw record into a domain object (stage: map). */
export class MappingImportError extends ImportError {
  readonly stage = "map" as const

  static wrap(cause: unknown, options: Omit<ImportErrorOptions, "cause">): MappingImportError {
    return new MappingImportError(
      messageOf(cause, "Domain mapping failed."),
      { ...options, cause },
    )
  }
}

/**
 * A data-quality rejection (stage: validate). Raised for entities whose report
 * is not valid; carries the failing report's issue messages.
 */
export class ValidationImportError extends ImportError {
  readonly stage = "validate" as const
  /** Human-readable issue messages from the quality report. */
  readonly issues: string[]

  constructor(message: string, options: ImportErrorOptions & { issues?: string[] }) {
    super(message, { code: "VALIDATION_REJECTED", ...options })
    this.issues = options.issues ?? []
  }
}

/** A failure persisting a validated object through a repository (stage: persist). */
export class RepositoryImportError extends ImportError {
  readonly stage = "persist" as const

  static wrap(cause: unknown, options: Omit<ImportErrorOptions, "cause">): RepositoryImportError {
    return new RepositoryImportError(
      messageOf(cause, "Repository persistence failed."),
      { ...options, cause },
    )
  }
}
