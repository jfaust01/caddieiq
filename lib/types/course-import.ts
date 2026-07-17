import type { ImportSummary } from "./import-summary"

/**
 * Course-specific import summary.
 * Extends base ImportSummary with course data metrics.
 */
export interface CourseImportSummary extends ImportSummary {
  // Course metrics
  coursesConsidered: number
  coursesMatched: number
  coursesImported: number
  coursesUpdated: number
  coursesSkipped: number

  // Hole metrics
  holesImported: number
  holesUpdated: number
  holesSkipped: number

  // Tee box metrics
  teeBoxesImported: number
  teeBoxesUpdated: number
  teeBoxesSkipped: number

  // Course Intelligence metrics
  intelligenceAnalyzed?: number
  intelligenceGenerated?: number

  // Course Insights metrics
  insightsGenerated?: number

  // Performance metric (courses per second, rounded to 1 decimal)
  throughputPerSecond: number
}
