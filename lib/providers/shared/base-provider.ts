/**
 * Abstract base class implemented by every concrete provider.
 *
 * It supplies cross-cutting behavior so concrete providers only implement the
 * upstream-specific parts:
 *   - `import()` is a template method that logs Start/Success/Failure, measures
 *     duration, and funnels every thrown value through `toProviderError`.
 *   - connection state tracking via `connected` + `ensureConnected()`.
 *   - a batch `normalizeMany()` built on the single-record `normalize()`.
 *
 * Concrete providers implement `connect`, `health`, `disconnect`, `normalize`,
 * `validate`, and the protected `execute()` (the actual import work).
 */

import { ProviderError, toProviderError } from "./errors"
import { createProviderLogger, type ProviderLogger, type ProviderLogSink } from "./logger"
import type {
  ImportJob,
  ImportResult,
  Normalizer,
  Provider,
  ProviderConfig,
  ProviderName,
  ProviderStatus,
  ValidationResult,
} from "./types"

export abstract class BaseProvider<TRaw = unknown, TNormalized = unknown>
  implements Provider<TRaw, TNormalized>
{
  readonly name: ProviderName
  protected readonly config: ProviderConfig
  protected readonly logger: ProviderLogger
  /** Set to `true` by concrete `connect()` implementations via `markConnected`. */
  protected connected = false

  constructor(config: ProviderConfig, logSink?: ProviderLogSink) {
    this.name = config.name
    this.config = config
    this.logger = createProviderLogger(config.name, logSink)
  }

  // --- Lifecycle & upstream-specific behavior (implemented by subclasses) ---

  abstract connect(): Promise<void>
  abstract health(): Promise<ProviderStatus>
  abstract disconnect(): Promise<void>
  abstract normalize(raw: TRaw): TNormalized
  abstract validate(data: TNormalized): ValidationResult

  /**
   * The actual import work for a job. Runs *inside* the logging/timing wrapper
   * provided by {@link import}, so implementations should not log lifecycle
   * events themselves.
   */
  protected abstract execute(job: ImportJob): Promise<ImportResult<TNormalized>>

  // --- Template method: automatic logging, timing, and error handling ------

  async import(job: ImportJob): Promise<ImportResult<TNormalized>> {
    const start = Date.now()
    this.logger.start(job)

    try {
      const result = await this.execute(job)
      const durationMs = Date.now() - start
      this.logger.success(job, durationMs)
      // Ensure the reported duration reflects the full wrapped run.
      return { ...result, durationMs }
    } catch (error) {
      const durationMs = Date.now() - start
      const providerError = toProviderError(error, this.name)
      this.logger.failure(job, providerError, durationMs)
      throw providerError
    }
  }

  // --- Shared helpers -------------------------------------------------------

  /** Default batch normalization; override for provider-specific batching. */
  normalizeMany(raw: TRaw[]): TNormalized[] {
    return raw.map((item) => this.normalize(item))
  }

  /** Mark the provider connected (call from a subclass `connect()`). */
  protected markConnected(): void {
    this.connected = true
  }

  /** Mark the provider disconnected (call from a subclass `disconnect()`). */
  protected markDisconnected(): void {
    this.connected = false
  }

  /** Guard used by import work that requires an active connection. */
  protected ensureConnected(): void {
    if (!this.connected) {
      throw new ProviderError(`Provider "${this.name}" is not connected`, {
        provider: this.name,
        code: "CONNECTION_ERROR",
      })
    }
  }

  /**
   * Build a typed skeleton `ImportResult` for a job. Handy for concrete
   * `execute()` implementations that accumulate records/errors as they go.
   */
  protected createResult(job: ImportJob, startedAt: Date): ImportResult<TNormalized> {
    return {
      job,
      success: true,
      data: [],
      recordsProcessed: 0,
      recordsFailed: 0,
      durationMs: 0,
      startedAt,
      finishedAt: startedAt,
      errors: [],
    }
  }
}

/** Re-export for convenience when authoring provider-local normalizers. */
export type { Normalizer }
