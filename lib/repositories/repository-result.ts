/**
 * Repository result types.
 *
 * Every repository write returns one of these structured results instead of a
 * raw Prisma record or a thrown exception, so import jobs get a uniform,
 * inspectable outcome. `RepositoryResult` describes a single-record operation;
 * `BulkRepositoryResult` aggregates a batch.
 *
 * These types are persistence-layer concerns and intentionally know nothing
 * about providers, mapping, or validation.
 */

import type { RepositoryError } from "./errors"

/** What a write did to a single record. */
export type RepositoryOutcome = "inserted" | "updated" | "skipped" | "failed"

/**
 * The result of a single-record repository operation.
 *
 * Supports both single records (write operations) and arrays (read operations).
 * - Write operations: populate `record` with outcome "inserted"/"updated"/"skipped"
 * - Read operations: populate `records` with outcome undefined (no write semantic)
 *
 * @typeParam T - The persisted record type (a Prisma model or array of models).
 */
export interface RepositoryResult<T> {
  /** What happened to the record (for writes). Undefined for reads. */
  outcome?: RepositoryOutcome
  /**
   * The persisted record, when the operation produced or found one. Absent for
   * `failed` and, depending on the call, `skipped`. Used for write operations.
   */
  record?: T
  /**
   * Array of records from read operations. Used by findVerified(), findByGolfCourseApiId(), etc.
   * When present, `outcome` is typically undefined since reads have no write semantics.
   */
  records?: T[]
  /** The failure, when `outcome` is `failed`. */
  error?: RepositoryError
}

/**
 * The aggregate result of a bulk repository operation.
 *
 * Counters always satisfy `processed === inserted + updated + skipped + failed`.
 * `records` holds the successfully written rows (inserted or updated); `errors`
 * holds one entry per failed item. A bulk operation never throws for a single
 * bad item — the failure is captured here so the rest of the batch proceeds.
 *
 * @typeParam T - The persisted record type (a Prisma model).
 */
export interface BulkRepositoryResult<T> {
  /** Total items the operation attempted. */
  processed: number
  /** How many new records were created. */
  inserted: number
  /** How many existing records were updated. */
  updated: number
  /** How many items were intentionally skipped (e.g. no reconciliation key). */
  skipped: number
  /** How many items failed to persist. */
  failed: number
  /** The successfully written records (inserted or updated). */
  records: T[]
  /** One entry per failed item, in input order. */
  errors: BulkItemError[]
}

/** A single failure within a bulk operation, tagged with its input position. */
export interface BulkItemError {
  /** Zero-based index of the offending item in the input batch. */
  index: number
  /** A stable identifier for the item (slug), when known, for correlation. */
  reference?: string
  /** The underlying repository error. */
  error: RepositoryError
}

/** Build a single-record success result (write operation). */
export function ok<T>(
  record: T,
  outcome: Exclude<RepositoryOutcome, "failed">
): RepositoryResult<T> {
  return { outcome, record }
}

/**
 * Build a read-operation success result (array of records).
 * Read operations have no write semantics, so outcome is undefined.
 */
export function okRead<T>(records: T[]): RepositoryResult<T[]> {
  return { records }
}

/** Build a single-record failure result. */
export function fail<T>(error: RepositoryError): RepositoryResult<T> {
  return { outcome: "failed", error }
}

/** Create an empty, mutable bulk accumulator. */
export function emptyBulkResult<T>(): BulkRepositoryResult<T> {
  return {
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    records: [],
    errors: [],
  }
}

/**
 * Fold a single-record result into a bulk accumulator, updating counters and
 * collecting the record or error. Mutates and returns `acc` for convenience.
 */
export function accumulate<T>(
  acc: BulkRepositoryResult<T>,
  result: RepositoryResult<T>,
  index: number,
  reference?: string,
): BulkRepositoryResult<T> {
  acc.processed += 1
  switch (result.outcome) {
    case "inserted":
      acc.inserted += 1
      if (result.record) acc.records.push(result.record)
      break
    case "updated":
      acc.updated += 1
      if (result.record) acc.records.push(result.record)
      break
    case "skipped":
      acc.skipped += 1
      break
    case "failed":
      acc.failed += 1
      if (result.error) acc.errors.push({ index, reference, error: result.error })
      break
  }
  return acc
}
