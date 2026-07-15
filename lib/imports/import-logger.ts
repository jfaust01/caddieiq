/**
 * Structured logging for the import pipeline.
 *
 * Emits Start / Finish / Failure lifecycle events, each carrying the entity,
 * provider, duration, and a compact summary of counters. Logs are routed
 * through a pluggable {@link ImportLogSink} so tests can capture them silently
 * and production can ship them elsewhere. No secrets are ever logged.
 */

import type { EntityKind } from "@/lib/data-quality"
import type { ImportResult } from "./import-result"
import type { ImportStage } from "./import-errors"

export type ImportLogLevel = "info" | "warn" | "error"
export type ImportLogEvent =
  | "import.start"
  | "import.stage"
  | "import.finish"
  | "import.failure"

/** A single structured import-log record. */
export interface ImportLogEntry {
  level: ImportLogLevel
  event: ImportLogEvent
  entity: EntityKind
  provider: string
  message: string
  /** ISO timestamp. */
  timestamp: string
  durationMs?: number
  stage?: ImportStage
  /** Count emitted by a per-stage (`import.stage`) event. */
  count?: number
  /** Compact counter summary, present on finish/failure. */
  summary?: Pick<
    ImportResult,
    | "processed"
    | "mapped"
    | "validated"
    | "inserted"
    | "updated"
    | "skipped"
    | "failed"
    | "warnings"
    | "qualityScoreAverage"
  >
}

/** Destination for import-log entries. */
export interface ImportLogSink {
  write(entry: ImportLogEntry): void
}

/** Default sink: writes to the console with an `[imports:<entity>]` prefix. */
export const consoleImportSink: ImportLogSink = {
  write(entry) {
    const duration = entry.durationMs !== undefined ? ` (${entry.durationMs}ms)` : ""
    const line = `[imports:${entry.entity}] ${entry.event} — ${entry.message}${duration}`
    const detail = entry.summary ?? ""
    if (entry.level === "error") console.error(line, detail)
    else if (entry.level === "warn") console.warn(line, detail)
    else console.log(line, detail)
  },
}

/** Sink that discards everything — the default for unit tests. */
export const silentImportSink: ImportLogSink = { write() {} }

function summaryOf(result: ImportResult): ImportLogEntry["summary"] {
  return {
    processed: result.processed,
    mapped: result.mapped,
    validated: result.validated,
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    failed: result.failed,
    warnings: result.warnings,
    qualityScoreAverage: result.qualityScoreAverage,
  }
}

/** Context identifying which import a log line belongs to. */
interface ImportContext {
  provider: string
  entity: EntityKind
  stage?: ImportStage
}

/** Per-run structured logger. */
export class ImportLogger {
  constructor(private readonly sink: ImportLogSink = consoleImportSink) {}

  /** Log the start of an import run. */
  start(ctx: ImportContext): void {
    this.emit({
      level: "info",
      event: "import.start",
      entity: ctx.entity,
      provider: ctx.provider,
      message: `Starting ${ctx.entity} import from ${ctx.provider}.`,
    })
  }

  /**
   * Log the outcome of a single pipeline stage, carrying the number of records
   * that survived it. Emitting one line per stage makes it possible to see
   * exactly where records stop flowing (e.g. a large `validate` count followed
   * by a `persist` count of zero points straight at persistence).
   */
  stage(ctx: ImportContext & { stage: ImportStage }, count: number, note?: string): void {
    this.emit({
      level: "info",
      event: "import.stage",
      entity: ctx.entity,
      provider: ctx.provider,
      stage: ctx.stage,
      count,
      message: `Stage "${ctx.stage}" → ${count} record(s)${note ? ` (${note})` : ""}.`,
    })
  }

  /** Log a completed run (may still contain per-item failures). */
  finish(ctx: ImportContext, result: ImportResult): void {
    const hadFailures = result.failed > 0 || result.errors.length > 0
    this.emit({
      level: hadFailures ? "warn" : "info",
      event: "import.finish",
      entity: ctx.entity,
      provider: ctx.provider,
      durationMs: result.durationMs,
      message:
        `Finished ${ctx.entity} import: ${result.inserted} inserted, ` +
        `${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed.`,
      summary: summaryOf(result),
    })
  }

  /** Log a run that aborted at a specific stage (e.g. provider fetch). */
  failure(ctx: ImportContext, result: ImportResult): void {
    this.emit({
      level: "error",
      event: "import.failure",
      entity: ctx.entity,
      provider: ctx.provider,
      stage: ctx.stage,
      durationMs: result.durationMs,
      message: `Import failed at stage "${ctx.stage ?? "unknown"}".`,
      summary: summaryOf(result),
    })
  }

  private emit(entry: Omit<ImportLogEntry, "timestamp">): void {
    this.sink.write({ ...entry, timestamp: new Date().toISOString() })
  }
}

/** Convenience factory mirroring the framework's style. */
export function createImportLogger(sink?: ImportLogSink): ImportLogger {
  return new ImportLogger(sink)
}
