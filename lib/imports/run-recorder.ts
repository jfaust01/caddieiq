/**
 * Import run recorder — the single seam that turns any import execution into a
 * durable {@link ImportRun} row.
 *
 * The import surface has two families of return shapes:
 *
 *   1. Manager-driven pipelines (players, courses, tournaments) return a uniform
 *      {@link ImportResult}.
 *   2. Relation/enrichment pipelines (fields, statistics, news, betting,
 *      fantasy, geolocation, weather, odds, course-linking) each return a
 *      bespoke summary with its own field names.
 *
 * Rather than teach the dashboard about nine different shapes, every top-level
 * `runXImport()` wraps its work in {@link recordImportRun}, passing a small
 * `normalize` function that projects its native result onto the common
 * {@link RunOutcome} counters. The recorder times the run, classifies its
 * status, and writes exactly one row — INCLUDING when the underlying work
 * throws, so a hard failure is recorded rather than lost.
 *
 * Recording is best-effort: if writing the audit row itself fails we log and
 * still return the real result, because import history must never take down an
 * import.
 */

import type { ImportRunStatus } from "@/lib/generated/prisma/client"
import { getImportRunRepository, type ImportRunInput } from "@/lib/repositories/import-run-repository"

/** The common counters every import can be projected onto. */
export interface RunOutcome {
  processed?: number
  inserted?: number
  updated?: number
  skipped?: number
  failed?: number
  warnings?: number
  /** Short human summary (counts / notes). Never fabricated. */
  summary?: string | null
  /** Representative error message, when the run failed or partially failed. */
  error?: string | null
  /**
   * Force a status. Most callers omit this and let the recorder derive it from
   * `failed`; supply it only when a pipeline is knowingly degraded for a reason
   * that is not a per-row failure (e.g. a trial-tier feed whose values scramble).
   */
  status?: ImportRunStatus
}

/** Everything needed to record one run around a unit of import work. */
export interface RecordRunOptions<T> {
  provider: string
  entity: string
  run: () => Promise<T>
  /** Project the native result onto the common counters. */
  normalize: (result: T) => RunOutcome
}

/**
 * Derive the run status from its counters unless the caller forced one:
 * FAILURE when nothing succeeded and something failed, PARTIAL when there were
 * failures alongside successes, otherwise SUCCESS.
 */
function deriveStatus(outcome: RunOutcome): ImportRunStatus {
  if (outcome.status) return outcome.status
  const failed = outcome.failed ?? 0
  const succeeded = (outcome.inserted ?? 0) + (outcome.updated ?? 0)
  if (failed > 0) return succeeded > 0 ? "PARTIAL" : "FAILURE"
  return "SUCCESS"
}

/** Persist one run row; never throws (history must not break imports). */
async function persist(input: ImportRunInput): Promise<void> {
  try {
    await getImportRunRepository().record(input)
  } catch (error) {
    console.error(
      `[v0] Failed to record import run for ${input.entity} (${input.provider}):`,
      error instanceof Error ? error.message : error,
    )
  }
}

/** Coerce any thrown value into a bounded, readable message. */
function messageOf(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error)
  return raw.length > 1000 ? `${raw.slice(0, 1000)}…` : raw
}

/**
 * Run one import, record exactly one {@link ImportRun}, and return the original
 * result. On success the row reflects the normalized counters; on a thrown
 * error a FAILURE row is written and the error is re-thrown so callers/routes
 * keep their existing error semantics.
 */
export async function recordImportRun<T>(options: RecordRunOptions<T>): Promise<T> {
  const startedAt = new Date()
  try {
    const result = await options.run()
    const outcome = options.normalize(result)
    const finishedAt = new Date()
    await persist({
      provider: options.provider,
      entity: options.entity,
      status: deriveStatus(outcome),
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      processed: outcome.processed ?? 0,
      inserted: outcome.inserted ?? 0,
      updated: outcome.updated ?? 0,
      skipped: outcome.skipped ?? 0,
      failed: outcome.failed ?? 0,
      warnings: outcome.warnings ?? 0,
      summary: outcome.summary ?? null,
      error: outcome.error ?? null,
    })
    return result
  } catch (error) {
    const finishedAt = new Date()
    await persist({
      provider: options.provider,
      entity: options.entity,
      status: "FAILURE",
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      warnings: 0,
      summary: "Run threw before completing.",
      error: messageOf(error),
    })
    throw error
  }
}
