/**
 * Strongly typed summary object returned by all course import operations.
 * Suitable for displaying in the Admin UI and audit logging.
 */
export interface CourseImportSummary {
  startedAt: Date
  completedAt: Date
  durationMs: number

  coursesConsidered: number
  coursesMatched: number
  coursesImported: number
  coursesUpdated: number

  holesImported: number
  holesUpdated: number

  teeBoxesImported: number
  teeBoxesUpdated: number

  warnings: string[]
  failures: string[]
}
