-- Database Health Report
-- Shows total rows per major table, import status, and data freshness

SELECT '=== DATABASE HEALTH REPORT ===' as report_section;
SELECT 'Timestamp: ' || NOW()::text as current_timestamp;
SELECT '';

-- Total rows per table
SELECT '=== TABLE ROW COUNTS ===' as section;
SELECT 
  'users' as table_name, COUNT(*) as row_count, 'Auth' as category FROM users
UNION ALL SELECT 'profiles', COUNT(*), 'Auth' FROM profiles
UNION ALL SELECT 'subscriptions', COUNT(*), 'Auth' FROM subscriptions
UNION ALL SELECT 'courses', COUNT(*), 'Golf Data' FROM courses
UNION ALL SELECT 'course_characteristics', COUNT(*), 'Golf Data' FROM "courseCharacteristics"
UNION ALL SELECT 'tournaments', COUNT(*), 'Golf Data' FROM tournaments
UNION ALL SELECT 'players', COUNT(*), 'Golf Data' FROM players
UNION ALL SELECT 'rounds', COUNT(*), 'Golf Data' FROM rounds
UNION ALL SELECT 'player_rounds', COUNT(*), 'Golf Data' FROM "playerRounds"
UNION ALL SELECT 'betting_events', COUNT(*), 'Betting' FROM "bettingEvents"
UNION ALL SELECT 'dfs_salaries', COUNT(*), 'DFS' FROM "dfsSalaries"
UNION ALL SELECT 'odds_events', COUNT(*), 'Odds' FROM "oddsEvents"
UNION ALL SELECT 'weather_snapshots', COUNT(*), 'Weather' FROM "weatherSnapshots"
UNION ALL SELECT 'weather_periods', COUNT(*), 'Weather' FROM "weatherPeriods"
UNION ALL SELECT 'import_runs', COUNT(*), 'System' FROM "importRuns"
ORDER BY category, table_name;

-- Import status
SELECT '';
SELECT '=== IMPORT STATUS ===' as section;
SELECT 
  entity, 
  status, 
  COUNT(*) as count,
  MAX("completedAt") as latest_import
FROM "importRuns"
GROUP BY entity, status
ORDER BY entity, MAX("completedAt") DESC;

-- Last import per entity
SELECT '';
SELECT '=== LATEST IMPORTS ===' as section;
SELECT DISTINCT ON (entity)
  entity,
  status,
  "recordsInserted",
  "recordsUpdated",
  "recordsFailed",
  "completedAt"
FROM "importRuns"
ORDER BY entity, "completedAt" DESC;

-- Weather pipeline status
SELECT '';
SELECT '=== WEATHER PIPELINE STATUS ===' as section;
SELECT 
  COUNT(*) as total_snapshots,
  COUNT(DISTINCT "tournamentId") as tournaments_with_weather,
  MAX("capturedAt")::date as latest_snapshot_date
FROM "weatherSnapshots";

SELECT 
  COUNT(*) as total_weather_periods,
  (COUNT(*)::float / (SELECT COUNT(*) FROM "weatherSnapshots") + 1)::int as avg_periods_per_snapshot,
  MAX("periodEnd") as latest_forecast_period
FROM "weatherPeriods";

-- Course intelligence status
SELECT '';
SELECT '=== COURSE INTELLIGENCE STATUS ===' as section;
SELECT 
  COUNT(*) as total_courses,
  COUNT(DISTINCT "courseId") as courses_with_characteristics,
  ROUND(100.0 * COUNT(DISTINCT "courseId") / COUNT(*), 1) as characteristics_coverage_percent
FROM courses c
LEFT JOIN "courseCharacteristics" cc ON c.id = cc."courseId"
WHERE c."deletedAt" IS NULL;

-- Soft-deleted records
SELECT '';
SELECT '=== SOFT-DELETED RECORDS ===' as section;
SELECT 'courses' as table_name, COUNT(*) as deleted_count FROM courses WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'tournaments', COUNT(*) FROM tournaments WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'players', COUNT(*) FROM players WHERE "deletedAt" IS NOT NULL;

-- Data freshness (last updates)
SELECT '';
SELECT '=== DATA FRESHNESS ===' as section;
SELECT 
  'users' as table_name, 
  MAX("updatedAt") as last_updated,
  (NOW() - MAX("updatedAt"))::interval as time_since_update
FROM users
UNION ALL SELECT 'courses', MAX("updatedAt"), NOW() - MAX("updatedAt") FROM courses
UNION ALL SELECT 'tournaments', MAX("updatedAt"), NOW() - MAX("updatedAt") FROM tournaments
UNION ALL SELECT 'players', MAX("updatedAt"), NOW() - MAX("updatedAt") FROM players
UNION ALL SELECT 'weather_snapshots', MAX("capturedAt"), NOW() - MAX("capturedAt") FROM "weatherSnapshots"
ORDER BY last_updated DESC;
