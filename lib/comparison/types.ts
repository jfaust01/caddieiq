/**
 * Comparison domain types for the Player Comparison Engine.
 */

import type { PlayerAnalytics } from "@/lib/analytics/types"

/**
 * Filter options for the comparison view.
 */
export interface ComparisonFilters {
  metricCategory: "all" | "dfs" | "betting" | "skill" | "courseFit" | "stats"
  showDifference: boolean
  sortBy: "value" | "difference" | "alphabetical"
}

/**
 * Metadata about a comparison session.
 */
export interface ComparisonSession {
  playerIds: string[]
  playerNames: string[]
  createdAt: Date
  filters: ComparisonFilters
}

/**
 * Categorized metric groups for filtering.
 */
export const METRIC_CATEGORIES = {
  all: ["seasonPerformance", "recentForm", "consistency", "activity", "fantasyProduction"],
  dfs: ["fantasyProduction", "activity", "seasonPerformance"],
  betting: ["recentForm", "consistency", "seasonPerformance"],
  skill: ["seasonPerformance", "recentForm"],
  courseFit: ["recentForm", "consistency"],
  stats: ["activity", "fantasyProduction"],
} as const
