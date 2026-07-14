/**
 * Structured logging utilities for the analytics framework.
 *
 * The {@link BaseAnalyticsModule} uses an `AnalyticsLogger` to automatically
 * emit Start / Success / Failure events (with durations) around every
 * `calculate()` run, so concrete modules get consistent observability for free.
 */

import type { AnalyticsError } from "./errors"
import type { AnalyticsModuleKey, AnalyticsSubject } from "./types"

export type AnalyticsLogLevel = "debug" | "info" | "warn" | "error"

/** Lifecycle events emitted around analytics work. */
export type AnalyticsLogEvent =
  | "calculate.start"
  | "calculate.success"
  | "calculate.failure"
  | "aggregate"
  | "message"

/** A single structured log record. */
export interface AnalyticsLogEntry {
  module: AnalyticsModuleKey | "engine"
  level: AnalyticsLogLevel
  event: AnalyticsLogEvent
  message: string
  /** ISO timestamp. */
  timestamp: string
  subjectKind?: AnalyticsSubject["kind"]
  subjectId?: string
  durationMs?: number
  meta?: Record<string, unknown>
}

/** Destination for log entries. Swap in a custom sink to ship logs elsewhere. */
export interface AnalyticsLogSink {
  write(entry: AnalyticsLogEntry): void
}

/**
 * Default sink: writes to the console with an `[analytics:<module>]` prefix.
 * Success/info go to `console.log`, warnings to `console.warn`, and failures
 * to `console.error`.
 */
export const consoleLogSink: AnalyticsLogSink = {
  write(entry) {
    const prefix = `[analytics:${entry.module}] ${entry.event}`
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
 * Per-module logger. Instances are cheap; create one per module (or one for the
 * engine).
 */
export class AnalyticsLogger {
  constructor(
    private readonly module: AnalyticsModuleKey | "engine",
    private readonly sink: AnalyticsLogSink = consoleLogSink,
  ) {}

  /** Log the start of a calculation. */
  start(subject: AnalyticsSubject, meta?: Record<string, unknown>): void {
    this.emit("info", "calculate.start", `Calculating for ${subject.kind} "${subject.id}"`, {
      subject,
      meta,
    })
  }

  /** Log a successful calculation with its duration. */
  success(subject: AnalyticsSubject, durationMs: number, meta?: Record<string, unknown>): void {
    this.emit("info", "calculate.success", `Calculated for ${subject.kind} "${subject.id}"`, {
      subject,
      durationMs,
      meta,
    })
  }

  /** Log a failed calculation with its duration and the causing error. */
  failure(
    subject: AnalyticsSubject,
    error: AnalyticsError,
    durationMs: number,
    meta?: Record<string, unknown>,
  ): void {
    this.emit(
      "error",
      "calculate.failure",
      `Failed for ${subject.kind} "${subject.id}": ${error.message}`,
      { subject, durationMs, meta: { ...meta, error: error.toJSON() } },
    )
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
    level: AnalyticsLogLevel,
    event: AnalyticsLogEvent,
    message: string,
    extra: {
      subject?: AnalyticsSubject
      durationMs?: number
      meta?: Record<string, unknown>
    } = {},
  ): void {
    this.sink.write({
      module: this.module,
      level,
      event,
      message,
      timestamp: new Date().toISOString(),
      subjectKind: extra.subject?.kind,
      subjectId: extra.subject?.id,
      durationMs: extra.durationMs,
      meta: extra.meta,
    })
  }
}

/** Convenience factory mirroring the rest of the framework's style. */
export function createAnalyticsLogger(
  module: AnalyticsModuleKey | "engine",
  sink?: AnalyticsLogSink,
): AnalyticsLogger {
  return new AnalyticsLogger(module, sink)
}
