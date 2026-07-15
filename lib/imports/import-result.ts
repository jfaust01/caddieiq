/**
 * Import pipeline result types.
 *
 * `ImportResult` is the single, uniform report every import returns — the "↓
 * Import Report" terminal of the pipeline. It records timing, provenance, and
 * the aggregated outcome of the fetch → map → validate → persist stages, plus
 * the data-quality score for the batch. It is JSON-serializable so the (future)
 * Operations Center can render it directly.
 */

import type { EntityKind } from "@/lib/data-quality"
import type { ImportError, SerializedImportError } from "./import-errors"

/** The entity kind an import targets (mirrors the data-quality `EntityKind`). */
export type ImportEntity = EntityKind

/**
 * The uniform outcome of one import run.
 *
 * Counter invariant: `processed === inserted + updated + skipped + failed`.
 * `skipped` includes both validation rejections (invalid quality reports) and
 * repository skips (e.g. no reconciliation key). `failed` includes mapping and
 * persistence failures. `errors` holds one serialized entry per failure or
 * rejection; `warnings` is the total count of advisory quality issues.
 */
export interface ImportResult {
  /** When the run started. */
  startedAt: Date
  /** When the run finished. */
  finishedAt: Date
  /** Wall-clock duration of the run in milliseconds. */
  durationMs: number
  /** The upstream provider the data came from (e.g. "sportsdataio"). */
  provider: string
  /** The entity kind imported. */
  entity: ImportEntity
  /** Total records the run attempted (as fetched from the provider). */
  processed: number
  /** Records successfully translated by the domain mapper. */
  mapped: number
  /** Records that passed the data-quality gate (were handed to the repository). */
  validated: number
  /** New records created. */
  inserted: number
  /** Existing records updated. */
  updated: number
  /** Records intentionally not persisted (validation rejection or repo skip). */
  skipped: number
  /** Records that errored during mapping or persistence. */
  failed: number
  /** Total advisory (warning-severity) quality issues across the batch. */
  warnings: number
  /** One serialized entry per failure/rejection, for the report. */
  errors: SerializedImportError[]
  /** Mean data-quality score (0–100) across evaluated records. */
  qualityScoreAverage: number
}

/**
 * A mutable accumulator used while a run is in flight. `ImportManager` folds
 * per-stage outcomes into this and then calls {@link finalizeImportResult}.
 */
export interface ImportRunAccumulator {
  provider: string
  entity: ImportEntity
  startedAt: Date
  processed: number
  mapped: number
  validated: number
  inserted: number
  updated: number
  skipped: number
  failed: number
  warnings: number
  errors: ImportError[]
  /** Individual quality scores, averaged at the end. */
  scores: number[]
}

/** Create an empty accumulator for a run. */
export function startImportRun(provider: string, entity: ImportEntity): ImportRunAccumulator {
  return {
    provider,
    entity,
    startedAt: new Date(),
    processed: 0,
    mapped: 0,
    validated: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    warnings: 0,
    errors: [],
    scores: [],
  }
}

/** Mean of the collected scores, rounded to an integer (0 when empty). */
function meanScore(scores: number[]): number {
  if (scores.length === 0) return 0
  const total = scores.reduce((sum, value) => sum + value, 0)
  return Math.round(total / scores.length)
}

/** Freeze an accumulator into the immutable {@link ImportResult} report. */
export function finalizeImportResult(acc: ImportRunAccumulator): ImportResult {
  const finishedAt = new Date()
  return {
    startedAt: acc.startedAt,
    finishedAt,
    durationMs: finishedAt.getTime() - acc.startedAt.getTime(),
    provider: acc.provider,
    entity: acc.entity,
    processed: acc.processed,
    mapped: acc.mapped,
    validated: acc.validated,
    inserted: acc.inserted,
    updated: acc.updated,
    skipped: acc.skipped,
    failed: acc.failed,
    warnings: acc.warnings,
    errors: acc.errors.map((error) => error.toJSON()),
    qualityScoreAverage: meanScore(acc.scores),
  }
}
