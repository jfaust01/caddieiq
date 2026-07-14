/**
 * Structured logging utilities for data providers.
 *
 * The {@link BaseProvider} uses a `ProviderLogger` to automatically emit
 * Start / Success / Failure events (with durations) around every import, so
 * concrete providers get consistent observability for free.
 */

import type { ProviderError } from "./errors"
import type { ImportJob, ProviderName } from "./types"

export type ProviderLogLevel = "debug" | "info" | "warn" | "error"

/** Lifecycle events emitted around provider work. */
export type ProviderLogEvent =
  | "import.start"
  | "import.success"
  | "import.failure"
  | "connect"
  | "disconnect"
  | "health"
  | "message"

/** A single structured log record. */
export interface ProviderLogEntry {
  provider: ProviderName
  level: ProviderLogLevel
  event: ProviderLogEvent
  message: string
  /** ISO timestamp. */
  timestamp: string
  jobId?: string
  resource?: string
  durationMs?: number
  meta?: Record<string, unknown>
}

/** Destination for log entries. Swap in a custom sink to ship logs elsewhere. */
export interface ProviderLogSink {
  write(entry: ProviderLogEntry): void
}

/**
 * Default sink: writes to the console with a `[providers:<name>]` prefix.
 * Success/info go to `console.log`, warnings to `console.warn`, and failures
 * to `console.error`.
 */
export const consoleLogSink: ProviderLogSink = {
  write(entry) {
    const prefix = `[providers:${entry.provider}] ${entry.event}`
    const suffix =
      entry.durationMs !== undefined ? ` (${Math.round(entry.durationMs)}ms)` : ""
    const line = `${prefix} — ${entry.message}${suffix}`

    if (entry.level === "error") {
      console.error(line, entry.meta ?? "")
    } else if (entry.level === "warn") {
      console.warn(line, entry.meta ?? "")
    } else {
      console.log(line, entry.meta ?? "")
    }
  },
}

/**
 * Per-provider logger. Instances are cheap; create one per provider instance.
 */
export class ProviderLogger {
  constructor(
    private readonly provider: ProviderName,
    private readonly sink: ProviderLogSink = consoleLogSink,
  ) {}

  /** Log the start of an import job. */
  start(job: ImportJob, meta?: Record<string, unknown>): void {
    this.emit("info", "import.start", `Importing "${job.resource}"`, {
      jobId: job.id,
      resource: job.resource,
      meta,
    })
  }

  /** Log a successful import with its duration. */
  success(job: ImportJob, durationMs: number, meta?: Record<string, unknown>): void {
    this.emit("info", "import.success", `Imported "${job.resource}"`, {
      jobId: job.id,
      resource: job.resource,
      durationMs,
      meta,
    })
  }

  /** Log a failed import with its duration and the causing error. */
  failure(
    job: ImportJob,
    error: ProviderError,
    durationMs: number,
    meta?: Record<string, unknown>,
  ): void {
    this.emit("error", "import.failure", `Failed "${job.resource}": ${error.message}`, {
      jobId: job.id,
      resource: job.resource,
      durationMs,
      meta: { ...meta, error: error.toJSON() },
    })
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.emit("debug", "message", message, { meta })
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.emit("info", "message", message, { meta })
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.emit("warn", "message", message, { meta })
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.emit("error", "message", message, { meta })
  }

  private emit(
    level: ProviderLogLevel,
    event: ProviderLogEvent,
    message: string,
    extra: {
      jobId?: string
      resource?: string
      durationMs?: number
      meta?: Record<string, unknown>
    } = {},
  ): void {
    this.sink.write({
      provider: this.provider,
      level,
      event,
      message,
      timestamp: new Date().toISOString(),
      jobId: extra.jobId,
      resource: extra.resource,
      durationMs: extra.durationMs,
      meta: extra.meta,
    })
  }
}

/** Convenience factory mirroring the rest of the framework's style. */
export function createProviderLogger(
  provider: ProviderName,
  sink?: ProviderLogSink,
): ProviderLogger {
  return new ProviderLogger(provider, sink)
}
