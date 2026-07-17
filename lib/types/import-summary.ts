/**
 * Base interface for all import operations.
 * All importers should extend this interface with domain-specific metrics.
 */
export interface ImportSummary {
  /** Unique job ID for tracking and audit trail */
  jobId: string

  /** When the import started */
  startedAt: Date

  /** When the import completed */
  completedAt: Date

  /** Duration in milliseconds */
  durationMs: number

  /** Warnings encountered during import (non-fatal issues) */
  warnings: string[]

  /** Failures that prevented import of specific records */
  failures: string[]
}

/**
 * Utility function to generate a unique import job ID.
 * Format: ENTITY-YYYY-MM-DD-NNNN
 * Example: COURSE-2026-07-17-0001
 */
export function generateImportJobId(entity: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const sequence = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")

  return `${entity.toUpperCase()}-${year}-${month}-${day}-${sequence}`
}
