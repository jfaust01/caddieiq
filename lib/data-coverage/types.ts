import type { CoverageRating } from "./ratings"

/**
 * Shared shapes for the Data Coverage Dashboard. These are the contract between
 * the server-only aggregation service and the (server-rendered) feature view,
 * and they are also the exact shape exported by the "copy as JSON" action so
 * future admin tooling can consume the report programmatically.
 */

/** A single labelled measurement inside a section (e.g. "Photos"). */
export interface CoverageMetric {
  /** Stable key for the metric (used as a React key and JSON field). */
  id: string
  label: string
  /** Formatted display value (already humanized, e.g. "1,204" or "72%"). */
  value: string
  /** Optional raw count behind the value, for the JSON export. */
  count?: number
  /** Optional per-metric coverage percent (0–100), when meaningful. */
  percent?: number | null
  /** Optional one-line clarification of what this metric counts. */
  hint?: string
}

/**
 * The verified / pending / missing decomposition every section exposes. This is
 * the heart of the honesty contract: `verified` is only ever genuinely
 * confirmed data, and `verified + pending + missing === total`.
 */
export interface CoverageBreakdown {
  verified: number
  pending: number
  missing: number
  total: number
}

/** A full dashboard section: headline coverage, breakdown, and metric rows. */
export interface CoverageSection {
  id: string
  title: string
  description: string
  /** Coverage percent (0–100) or null when there is nothing to measure. */
  percent: number | null
  rating: CoverageRating
  breakdown: CoverageBreakdown
  metrics: CoverageMetric[]
  /**
   * When set, the section is provider-limited: coverage is intentionally not
   * scored and this explains why (e.g. trial-tier scrambling). The UI shows the
   * message instead of a potentially misleading percentage.
   */
  restrictedReason?: string
  /** Optional caveat rendered as a footnote (e.g. trial-tier rank scrambling). */
  note?: string
  /** ISO timestamp of the most recent relevant write, when known. */
  lastUpdated?: string | null
}

/** A compact per-domain tile for the platform summary grid. */
export interface DomainSummary {
  id: string
  label: string
  percent: number | null
  rating: CoverageRating
  verified: number
  total: number
  /** True when this domain is provider-restricted rather than scored. */
  restricted?: boolean
}

/** Connection / liveness state for an external dependency. */
export type HealthState =
  | "healthy"
  | "connected"
  | "restricted"
  | "not-configured"
  | "unreachable"

export interface HealthCheck {
  id: string
  label: string
  state: HealthState
  /** Short human explanation of the state. */
  detail: string
}

/** A "last successful import" marker for a data domain. */
export interface ImportMarker {
  id: string
  label: string
  /** ISO timestamp of the most recent write, or null if never imported. */
  at: string | null
}

export interface PlatformHealth {
  checks: HealthCheck[]
  imports: ImportMarker[]
}

/** The complete diagnostics report — also the JSON export payload. */
export interface DataCoverageReport {
  /** ISO timestamp the report was generated. */
  generatedAt: string
  summary: DomainSummary[]
  sections: CoverageSection[]
  health: PlatformHealth
}
