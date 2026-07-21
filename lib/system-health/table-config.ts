import type { DataProvider, SyncState } from "./database-health"

/**
 * Configuration for database tables: provider and sync state.
 * Single source of truth for table metadata.
 */
export const TABLE_CONFIG: Record<
  string,
  {
    provider: DataProvider
    syncState: SyncState
  }
> = {
  // SportsDataIO tables
  tours: { provider: "sportsdataio", syncState: "synced" },
  tournaments: { provider: "sportsdataio", syncState: "synced" },
  tournament_courses: { provider: "sportsdataio", syncState: "synced" },
  tournament_fields: { provider: "sportsdataio", syncState: "synced" },
  tournament_rounds: { provider: "sportsdataio", syncState: "synced" },
  tournament_results: { provider: "sportsdataio", syncState: "synced" },
  tournament_player_fields: { provider: "sportsdataio", syncState: "synced" },
  players: { provider: "sportsdataio", syncState: "synced" },
  player_tour_histories: { provider: "sportsdataio", syncState: "synced" },
  player_season_statistics: { provider: "sportsdataio", syncState: "synced" },
  player_rounds: { provider: "sportsdataio", syncState: "synced" },
  player_rankings: { provider: "sportsdataio", syncState: "synced" },
  player_statistics: { provider: "sportsdataio", syncState: "synced" },
  player_fantasy_projections: { provider: "sportsdataio", syncState: "synced" },
  news_articles: { provider: "sportsdataio", syncState: "synced" },
  betting_events: { provider: "sportsdataio", syncState: "synced" },
  betting_markets: { provider: "sportsdataio", syncState: "synced" },
  betting_outcomes: { provider: "sportsdataio", syncState: "synced" },
  fantasy_projections: { provider: "sportsdataio", syncState: "synced" },
  dfs_salaries: { provider: "sportsdataio", syncState: "synced" },

  // GolfCourseAPI tables
  courses: { provider: "golfcourseapi", syncState: "awaiting-import" },
  course_details: { provider: "golfcourseapi", syncState: "awaiting-import" },
  course_holes: { provider: "golfcourseapi", syncState: "awaiting-import" },
  course_tees: { provider: "golfcourseapi", syncState: "awaiting-import" },
  tee_hole_yardages: { provider: "golfcourseapi", syncState: "awaiting-import" },
  course_addresses: { provider: "golfcourseapi", syncState: "awaiting-import" },
  course_coordinates: { provider: "golfcourseapi", syncState: "awaiting-import" },
  course_specifications: { provider: "golfcourseapi", syncState: "awaiting-import" },
  course_metadata: { provider: "golfcourseapi", syncState: "awaiting-import" },
  course_characteristics: { provider: "golfcourseapi", syncState: "awaiting-import" },
  playing_conditions: { provider: "golfcourseapi", syncState: "awaiting-import" },

  // Multiple providers
  tournament_course_mappings: { provider: "multiple", syncState: "pending-verification" },

  // The Odds API
  odds_events: { provider: "multiple", syncState: "synced" },
  odds_quotes: { provider: "multiple", syncState: "synced" },

  // Reference/System tables
  seasons: { provider: "internal", syncState: "not-generated" },
  nationalities: { provider: "internal", syncState: "not-generated" },
  rounds: { provider: "internal", syncState: "not-generated" },
  round_statistics: { provider: "internal", syncState: "not-generated" },

  // Internal/Generated tables
  course_intelligence: { provider: "internal", syncState: "not-generated" },
  player_intelligence: { provider: "internal", syncState: "not-generated" },
  tournament_intelligence: { provider: "internal", syncState: "not-generated" },
  golfer_ratings: { provider: "internal", syncState: "not-generated" },
  ai_insights: { provider: "internal", syncState: "not-generated" },
  simulations: { provider: "internal", syncState: "not-generated" },
  optimizer_results: { provider: "internal", syncState: "not-generated" },

  // Auth/Application tables
  users: { provider: "internal", syncState: "not-generated" },
  profiles: { provider: "internal", syncState: "not-generated" },
  subscriptions: { provider: "internal", syncState: "not-generated" },
  sessions: { provider: "internal", syncState: "not-generated" },
  accounts: { provider: "internal", syncState: "not-generated" },
  verifications: { provider: "internal", syncState: "not-generated" },

  // User-generated content
  user_favorites: { provider: "internal", syncState: "not-generated" },
  saved_lineups: { provider: "internal", syncState: "not-generated" },

  // Operations
  import_runs: { provider: "internal", syncState: "not-generated" },
  audit_logs: { provider: "internal", syncState: "not-generated" },
  weather_snapshots: { provider: "multiple", syncState: "synced" },
  weather_periods: { provider: "multiple", syncState: "synced" },
}

/**
 * Get provider and sync state for a table.
 * Falls back to "internal" and "not-generated" if table not configured.
 */
export function getTableConfig(tableName: string) {
  return (
    TABLE_CONFIG[tableName] || {
      provider: "internal" as const,
      syncState: "not-generated" as const,
    }
  )
}
