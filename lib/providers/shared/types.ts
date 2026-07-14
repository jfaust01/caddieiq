/**
 * Common contracts implemented by every data provider (SportsDataIO, DataGolf,
 * OpenWeather, the Odds API, and anything added later). This file defines
 * *shape* only — there is no runtime behavior here.
 */

import type { ProviderError, ValidationIssue } from "./errors"

/** Identifier for a provider implementation. */
export type ProviderName = "sportsdataio" | "datagolf" | "weather" | "odds" | (string & {})

/**
 * Static configuration handed to a provider at construction time.
 *
 * Credentials are intentionally optional here and are never committed. They are
 * expected to arrive from the environment when a concrete provider is wired up
 * in a future sprint.
 */
export interface ProviderConfig {
  /** Stable provider identifier, e.g. "datagolf". */
  name: ProviderName
  /** Human-friendly label for logs and dashboards. */
  label?: string
  /** Base URL of the upstream API. */
  baseUrl?: string
  /** API key/token. Injected from env at runtime; never hard-coded. */
  apiKey?: string
  /** Request timeout in milliseconds. */
  timeoutMs?: number
  /** Whether this provider is currently enabled. */
  enabled?: boolean
  /** Escape hatch for provider-specific options. */
  options?: Record<string, unknown>
}

/** Health states a provider can report. */
export type ProviderHealthState = "healthy" | "degraded" | "unavailable" | "unknown"

/** Snapshot of a provider's connectivity/health at a point in time. */
export interface ProviderStatus {
  provider: ProviderName
  state: ProviderHealthState
  /** Whether `connect()` has been completed successfully. */
  connected: boolean
  checkedAt: Date
  /** Round-trip latency of the health probe, if measured. */
  latencyMs?: number
  /** Optional human-readable detail (e.g. "quota 90% used"). */
  message?: string
}

/** Lifecycle status of an import job. */
export type ImportJobStatus = "pending" | "running" | "succeeded" | "failed" | "canceled"

/**
 * A unit of work describing what a provider should pull. Providers do not
 * decide *what* to import on their own — a scheduler/caller hands them a job.
 */
export interface ImportJob<TParams = Record<string, unknown>> {
  /** Unique job id (caller-assigned). */
  id: string
  /** Which provider should run this job. */
  provider: ProviderName
  /** Logical resource to import, e.g. "players", "rankings", "odds". */
  resource: string
  /** Arbitrary query parameters (season, tournamentId, date range, …). */
  params?: TParams
  status: ImportJobStatus
  createdAt: Date
  startedAt?: Date
  finishedAt?: Date
}

/**
 * The outcome of running an {@link ImportJob}. Providers return normalized
 * records; persistence happens in a later layer, not here.
 */
export interface ImportResult<TNormalized = unknown> {
  job: ImportJob
  success: boolean
  /** Normalized records produced by the run. */
  data: TNormalized[]
  recordsProcessed: number
  recordsFailed: number
  durationMs: number
  startedAt: Date
  finishedAt: Date
  /** Non-fatal errors collected during the run. */
  errors: ProviderError[]
}

/** Result of validating a normalized record. */
export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
}

/**
 * Transforms a provider's raw payload into a CaddieIQ domain shape. Concrete
 * normalizers are provider- and resource-specific; this generic contract lets
 * the framework treat them uniformly.
 */
export interface Normalizer<TRaw = unknown, TNormalized = unknown> {
  /** The resource this normalizer handles, e.g. "players". */
  readonly resource: string
  /** Normalize a single raw record. */
  normalize(raw: TRaw): TNormalized
  /** Normalize a batch of raw records. */
  normalizeMany(raw: TRaw[]): TNormalized[]
}

/**
 * The interface every provider implements. See {@link BaseProvider} for the
 * abstract class that supplies logging, timing, and error handling on top of
 * this contract.
 */
export interface Provider<TRaw = unknown, TNormalized = unknown> {
  /** Stable provider identifier. */
  readonly name: ProviderName

  /** Establish and verify a connection (validate credentials, warm clients). */
  connect(): Promise<void>

  /** Report current connectivity/health without mutating state. */
  health(): Promise<ProviderStatus>

  /** Execute an import job and return normalized records. */
  import(job: ImportJob): Promise<ImportResult<TNormalized>>

  /** Convert a single raw payload into a normalized domain record. */
  normalize(raw: TRaw): TNormalized

  /** Validate a normalized record before it is persisted downstream. */
  validate(data: TNormalized): ValidationResult

  /** Tear down connections/clients and release resources. */
  disconnect(): Promise<void>
}
