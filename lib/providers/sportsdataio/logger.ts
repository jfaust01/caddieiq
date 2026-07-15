/**
 * SportsDataIO request logging.
 *
 * A thin, HTTP-aware layer over the shared {@link ProviderLogger}. It emits
 * structured entries for each request lifecycle event — start, retry, success,
 * failure — with durations, and guarantees secrets are never logged by
 * sanitizing URLs before they leave this module.
 */

import type { ProviderError } from "../shared/errors"
import { createProviderLogger, type ProviderLogger, type ProviderLogSink } from "../shared/logger"

const PROVIDER = "sportsdataio"

/** Query params that must be redacted from any logged URL. */
const SECRET_QUERY_KEYS = new Set(["key", "apikey", "api_key", "subscription-key"])

/**
 * Return a log-safe version of a URL: absolute path is kept, but secret-bearing
 * query params (the SportsDataIO `key`) are replaced with `***`.
 */
export function sanitizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    for (const name of url.searchParams.keys()) {
      if (SECRET_QUERY_KEYS.has(name.toLowerCase())) {
        url.searchParams.set(name, "***")
      }
    }
    return `${url.origin}${url.pathname}${url.search}`
  } catch {
    // Not an absolute URL (e.g. a bare path) — strip any inline key param.
    return rawUrl.replace(/([?&](?:key|api_?key)=)[^&]*/gi, "$1***")
  }
}

/** Fields shared by request log events. */
export interface SdioRequestLogContext {
  method: string
  /** Sanitized path or URL — pass the raw URL and it will be sanitized. */
  url: string
  resource?: string
  attempt?: number
  maxAttempts?: number
}

/** HTTP-aware request logger for SportsDataIO. */
export class SportsDataIoLogger {
  private readonly logger: ProviderLogger

  constructor(sink?: ProviderLogSink) {
    this.logger = createProviderLogger(PROVIDER, sink)
  }

  /** Log the start of an outbound request. */
  request(ctx: SdioRequestLogContext): void {
    this.logger.debug(`${ctx.method} ${sanitizeUrl(ctx.url)}`, {
      resource: ctx.resource,
      attempt: ctx.attempt,
      maxAttempts: ctx.maxAttempts,
    })
  }

  /** Log a retry of a previously-failed request. */
  retry(ctx: SdioRequestLogContext & { delayMs: number; reason: string }): void {
    this.logger.warn(`retrying ${ctx.method} ${sanitizeUrl(ctx.url)}`, {
      resource: ctx.resource,
      attempt: ctx.attempt,
      maxAttempts: ctx.maxAttempts,
      delayMs: ctx.delayMs,
      reason: ctx.reason,
    })
  }

  /** Log a successful request with its duration and status. */
  success(ctx: SdioRequestLogContext & { status: number; durationMs: number }): void {
    this.logger.info(`${ctx.method} ${sanitizeUrl(ctx.url)} → ${ctx.status}`, {
      resource: ctx.resource,
      status: ctx.status,
      durationMs: Math.round(ctx.durationMs),
    })
  }

  /** Log a terminal failure with its duration and the mapped error. */
  failure(
    ctx: SdioRequestLogContext & { durationMs: number; error: ProviderError },
  ): void {
    this.logger.error(`${ctx.method} ${sanitizeUrl(ctx.url)} failed`, {
      resource: ctx.resource,
      attempt: ctx.attempt,
      durationMs: Math.round(ctx.durationMs),
      error: ctx.error.toJSON(),
    })
  }

  /** Log a general informational message. */
  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta)
  }
}

/** Factory mirroring the framework's style. */
export function createSportsDataIoLogger(sink?: ProviderLogSink): SportsDataIoLogger {
  return new SportsDataIoLogger(sink)
}
