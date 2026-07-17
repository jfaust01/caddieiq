/**
 * Admin GolfCourse import service types.
 * Extends the standard import pipeline to provide transparency for QA/debugging.
 */

export interface CourseFieldValue {
  before: string | number | boolean | null
  after: string | number | boolean | null
  changed: boolean
}

export interface GolfCourseImportResult {
  success: boolean
  courseId: string
  courseName: string
  duration: number
  updatedFields: Record<string, CourseFieldValue>
  skippedFields: Record<string, { reason: string }>
  warnings: string[]
  errors: string[]
  before: Record<string, any>
  after: Record<string, any>
  rawResponse: Record<string, any>
  timestamp: string
}

export interface AdminImportRequest {
  courseId: string
  forceRefresh: boolean
}

export interface CourseSearchResult {
  id: string
  name: string
  city: string
  state: string
  country: string
  externalCourseId?: string
  architect?: string
  yearBuilt?: number
  courseStyle?: string
}

export interface DataCoverageItem {
  field: string
  available: boolean
  value?: string | number | boolean | null
}

export interface DataCoverageCategory {
  category: string
  items: DataCoverageItem[]
  coverage: number
}

export interface ImportHistoryRecord {
  id: string
  timestamp: string
  courseId: string
  courseName: string
  userId?: string
  userName?: string
  duration: number
  updatedFieldsCount: number
  skippedFieldsCount: number
  warningsCount: number
  errorsCount: number
  status: 'success' | 'warning' | 'error'
}
