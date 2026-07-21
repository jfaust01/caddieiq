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

/** Outcome of a recorded import run, mirroring the `ImportRunStatus` enum. */
export type ImportRunOutcome = "SUCCESS" | "PARTIAL" | "FAILURE" | "never"

/**
 * The real, recorded health of one import pipeline — read from the append-only
 * `import_runs` audit trail, NOT inferred from a table's `max(updatedAt)`. Every
 * field is a genuine fact about the last time the pipeline actually ran; when a
 * pipeline has never run, `outcome` is `"never"` and the counts are null so the
 * UI can say "Never run" instead of implying a zero-row success.
 */
export interface ImportRunHealth {
  /** Logical entity/pipeline id (e.g. "statistics", "weather"). */
  id: string
  /** Human label for the pipeline. */
  label: string
  /** Upstream provider the last run pulled from, or null when never run. */
  provider: string | null
  /** Recorded outcome of the most recent run. */
  outcome: ImportRunOutcome
  /** ISO timestamp the last run started, or null when never run. */
  at: string | null
  /** Duration of the last run in ms, or null when never run. */
  durationMs: number | null
  /** Rows created by the last run, or null when never run. */
  inserted: number | null
  /** Rows updated by the last run, or null when never run. */
  updated: number | null
  /** Rows intentionally skipped by the last run, or null when never run. */
  skipped: number | null
  /** Rows that errored in the last run, or null when never run. */
  failed: number | null
  /** One-line summary from the last run, or null. */
  summary: string | null
  /** Representative error from the last run when degraded/failed, else null. */
  error: string | null
}

export interface PlatformHealth {
  checks: HealthCheck[]
  /**
   * Real per-pipeline run health from the `import_runs` audit trail. This is the
   * honest replacement for the old `updatedAt`-proxy markers.
   */
  runs: ImportRunHealth[]
}

/**
 * One row of the Tournament Field Intelligence panel: an upcoming or live event
 * with its official-field lifecycle state and the operational facts admins need
 * to spot a field that has not synced. Every count/time is honest — `null`
 * where the underlying data does not exist yet, never a fabricated placeholder.
 */
export interface FieldIntelligenceReportRow {
  tournamentId: string
  name: string
  /** Lifecycle state from the Tournament Context Engine (e.g. "awaiting"). */
  fieldStatus: string
  /** Certainty the presented field is the final, official one. */
  fieldConfidence: string
  /** ISO start date, or null when unknown. */
  startDate: string | null
  /** PGA Tour commitment deadline (ISO), or null when the start date is unknown. */
  releaseTime: string | null
  /** Imported (non-withdrawn) entrant count. */
  playersImported: number
  /** Prior-edition field size baseline, or null when there is no prior edition. */
  expectedPlayers: number | null
  /** Most recent field sync (ISO), or null when never imported. */
  lastSync: string | null
  /**
   * True when the field is expected by now (release deadline passed) but no
   * roster has been imported — the actionable "should have synced" signal.
   */
  overdue: boolean
}

/**
 * The Tournament Field Intelligence panel: upcoming/live events and their field
 * lifecycle, so admins can confirm official fields are landing on time. Honest
 * by construction — surfaces real lifecycle state and flags overdue syncs
 * without ever inventing a field that has not been published.
 */
export interface FieldIntelligenceReport {
  rows: FieldIntelligenceReportRow[]
  /** Count of rows flagged `overdue` — the headline "needs attention" number. */
  overdueCount: number
  /** Count of rows whose official field is confirmed. */
  confirmedCount: number
  /** Count of rows still awaiting their official field. */
  awaitingCount: number
}

/**
 * The live health of one database table, once its designed intent is reconciled
 * with its real row count:
 * - `healthy`          — holds the data it should.
 * - `waiting`          — legitimately empty now; fills through normal app usage,
 *                        an auth flow, or a dependency that is not yet satisfied.
 * - `future`           — schema reserved for an unbuilt sprint; no pipeline
 *                        writes it yet, so emptiness is expected and correct.
 * - `provider-limited` — empty/partial only because the current provider tier
 *                        blocks the values (e.g. SportsDataIO trial scrambling).
 * - `obsolete`         — no longer required; slated to remove/merge/replace.
 * - `broken`           — should have data now but the owning pipeline failed.
 */
export type TableHealth =
  | "healthy"
  | "waiting"
  | "future"
  | "provider-limited"
  | "obsolete"
  | "broken"

/** The classified owner of a table — exactly one per table. */
export type TableOwner =
  | "SportsDataIO"
  | "OpenWeather"
  | "The Odds API"
  | "Manual Enrichment"
  | "System"
  | "Intelligence Engine"
  | "Decision Model"
  | "Analytics"
  | "Application"

/** The data provider source for a table. */
export type DataProvider = "sportsdataio" | "golfcourseapi" | "internal" | "multiple"

/**
 * One row of the Platform Inventory: the complete, unambiguous record of why a
 * table exists, who owns it, what feeds it, and whether its current row count is
 * expected. This is the machine-readable form of docs/PLATFORM_DATA_INVENTORY.md.
 */
export interface PlatformInventoryEntry {
  /** Physical table name (matches the Prisma `@@map`). */
  table: string
  /** Human label. */
  label: string
  /** Why the table exists. */
  purpose: string
  owner: TableOwner
  /** Data provider source for this table. */
  provider: DataProvider
  /** How rows are created (provider import, model output, app write, seed…). */
  populationMethod: string
  /** Upstream tables/pipelines this table depends on, in order. */
  dependencies: string[]
  /** One-line statement of the table's expected lifecycle/row-count intent. */
  expectedState: string
  /** Live row count read from the database at report time. */
  rowCount: number
  /** Reconciled health once intent meets the real row count. */
  health: TableHealth
  /** Plain-language reason for the health verdict (never a guess). */
  reason: string
}

/** Count of tables in each health bucket, for the dashboard summary. */
export interface PlatformInventorySummary {
  healthy: number
  waiting: number
  future: number
  providerLimited: number
  obsolete: number
  broken: number
  total: number
}

/**
 * The full Platform Inventory: every table classified and reconciled against
 * its live row count, plus per-bucket totals. Ordered by owner then table so
 * the dashboard and the JSON export read identically to the doc.
 */
export interface PlatformInventory {
  entries: PlatformInventoryEntry[]
  summary: PlatformInventorySummary
}

/** The complete diagnostics report — also the JSON export payload. */
export interface DataCoverageReport {
  /** ISO timestamp the report was generated. */
  generatedAt: string
  summary: DomainSummary[]
  sections: CoverageSection[]
  fieldIntelligence: FieldIntelligenceReport
  health: PlatformHealth
  /** Full table-by-table platform inventory (the "zero ambiguity" record). */
  inventory: PlatformInventory
}
