/**
 * Course Intelligence Metric System
 * Provides deterministic, data-driven scoring for golf courses
 */

export interface MetricResult {
  score: number // 0-100
  stars: number // 1-5
  confidence: number // 0-100
  explanation: string
  dataPoints: string[]
}

export interface CourseHoleStats {
  holeNumber: number
  par: number
  yardage: number
  handicap: number
}

export interface CourseTeeStats {
  teeName: string
  yardage: number
  rating: number
  slope: number
  holeCount: number
}

export interface CourseData {
  id: string
  name: string
  holes: CourseHoleStats[]
  tees: CourseTeeStats[]
  address?: {
    country: string
    state?: string
    city?: string
    elevation?: number
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
  hazardCounts?: {
    water: number
    sand: number
    trees: number
    outOfBounds: number
  }
}

export interface CourseInsightTag {
  tag: string
  description: string
  confidence: number // 0-100
}
