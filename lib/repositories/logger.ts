/**
 * Repository logging.
 *
 * A tiny structured logger for persistence events (insert / update / skip /
 * failure). It follows the project's logging strategy: structured context keyed
 * by entity + reference, `[v0]`-prefixed in development, and **never logs
 * secrets or raw record payloads** — only non-sensitive identifiers.
 *
 * The sink is pluggable so tests can capture entries and production can later
 * forward them to an aggregator, mirroring the provider logger's design.
 */

import type { RepositoryOutcome } from "./repository-result"

/** Severity of a repository log entry. */
export type RepositoryLogLevel = "debug" | "info" | "warn" | "error"

/** A single structured repository log entry. */
export interface RepositoryLogEntry {
  level: RepositoryLogLevel
  /** Entity kind, e.g. "player". */
  entity: string
  /** What happened, e.g. "insert" | "update" | "skip" | "failure". */
  event: string
  /** Non-sensitive natural key (slug/id) for correlation. */
  reference?: string
  /** Human-readable message. */
  message: string
  /** Additional non-sensitive context. */
  context?: Record<string, unknown>
}

/** A destination for repository log entries. */
export interface RepositoryLogSink {
  log(entry: RepositoryLogEntry): void
}

/** Default sink: routes to the matching `console` method with a `[v0]` prefix. */
export const consoleRepositorySink: RepositoryLogSink = {
  log(entry) {
    const prefix = `[v0] [repo:${entry.entity}] ${entry.event}`
    const payload = { reference: entry.reference, ...entry.context }
    switch (entry.level) {
      case "error":
        console.error(prefix, entry.message, payload)
        break
      case "warn":
        console.warn(prefix, entry.message, payload)
        break
      default:
        console.log(prefix, entry.message, payload)
    }
  },
}

/** A sink that discards everything — the default in tests. */
export const silentRepositorySink: RepositoryLogSink = { log() {} }

/**
 * Structured logger bound to a single entity kind. Repositories create one of
 * these and emit `insert`/`update`/`skip`/`failure` events through it.
 */
export class RepositoryLogger {
  constructor(
    private readonly entity: string,
    private readonly sink: RepositoryLogSink = consoleRepositorySink,
  ) {}

  /** Map an outcome to its canonical event verb + level and emit it. */
  outcome(outcome: RepositoryOutcome, reference?: string, context?: Record<string, unknown>): void {
    switch (outcome) {
      case "inserted":
        this.insert(reference, context)
        break
      case "updated":
        this.update(reference, context)
        break
      case "skipped":
        this.skip(reference, context)
        break
      case "failed":
        this.failure(reference, "operation failed", context)
        break
    }
  }

  insert(reference?: string, context?: Record<string, unknown>): void {
    this.sink.log({ level: "info", entity: this.entity, event: "insert", reference, message: "record inserted", context })
  }

  update(reference?: string, context?: Record<string, unknown>): void {
    this.sink.log({ level: "info", entity: this.entity, event: "update", reference, message: "record updated", context })
  }

  skip(reference?: string, context?: Record<string, unknown>): void {
    this.sink.log({ level: "warn", entity: this.entity, event: "skip", reference, message: "record skipped", context })
  }

  failure(reference: string | undefined, message: string, context?: Record<string, unknown>): void {
    this.sink.log({ level: "error", entity: this.entity, event: "failure", reference, message, context })
  }
}
