/**
 * Course Insights Module
 *
 * Public API for insight generation and retrieval.
 */

export { generateAndPersistInsights, getCourseInsights, refreshCourseInsights } from './service'
export { generateAllInsights, generateInsightByCategory, getAllCategories } from './insight-engine'
export type { InsightCategory, RawInsight, CourseInsightRecord, InsightGenerationInput } from './types'
