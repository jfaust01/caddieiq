/**
 * Course Insight Types
 *
 * Strongly-typed models for insight generation and storage.
 */

export type InsightCategory = 
  | 'difficulty'
  | 'driving'
  | 'approach'
  | 'shortGame'
  | 'putting'
  | 'birdie'
  | 'wind'
  | 'penalties'

/**
 * Raw insight data before storage.
 */
export interface RawInsight {
  category: InsightCategory
  title: string
  summary: string
  importance: number // 1-5
  icon: string
  displayOrder: number
}

/**
 * Stored insight record.
 */
export interface CourseInsightRecord {
  id: string
  courseIntelligenceId: string
  category: string
  title: string
  summary: string
  importance: number
  icon: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Input for insight generation.
 * Derived from stored CourseIntelligence.
 */
export interface InsightGenerationInput {
  courseIntelligenceId: string
  courseId: string
  overallDifficultyStars: number
  drivingImportanceStars: number
  approachImportanceStars: number
  shortGameImportanceStars: number
  puttingImportanceStars: number
  windSensitivityStars: number
  penaltySeverityStars: number
  birdiePotentialStars: number
  scoringVolatilityStars: number
}

/**
 * Collection of generated insights.
 */
export interface GeneratedInsights {
  insights: RawInsight[]
}
