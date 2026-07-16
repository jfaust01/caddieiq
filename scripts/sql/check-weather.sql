-- Weather Pipeline Diagnostic
-- Inspect weather snapshots, periods, and import logs

SELECT '=== WEATHER PIPELINE DIAGNOSTIC ===' as diagnostic;
SELECT '';

-- Weather snapshots summary
SELECT '=== WEATHER SNAPSHOTS ===' as section;
SELECT 
  COUNT(*) as total_snapshots,
  COUNT(DISTINCT "tournamentId") as unique_tournaments,
  MIN("capturedAt") as oldest_snapshot,
  MAX("capturedAt") as newest_snapshot
FROM "weatherSnapshots";

-- Recent weather snapshots
SELECT '';
SELECT '=== RECENT SNAPSHOTS (LAST 10) ===' as section;
SELECT 
  ws.id,
  ws."tournamentId",
  t.name as tournament_name,
  ws.latitude,
  ws.longitude,
  ws."capturedAt",
  COUNT(wp.id) as period_count
FROM "weatherSnapshots" ws
LEFT JOIN tournaments t ON ws."tournamentId" = t.id
LEFT JOIN "weatherPeriods" wp ON ws.id = wp."snapshotId"
GROUP BY ws.id, ws."tournamentId", t.name, ws.latitude, ws.longitude, ws."capturedAt"
ORDER BY ws."capturedAt" DESC
LIMIT 10;

-- Weather periods overview
SELECT '';
SELECT '=== WEATHER PERIODS OVERVIEW ===' as section;
SELECT 
  COUNT(*) as total_periods,
  COUNT(DISTINCT "snapshotId") as snapshots_with_periods,
  AVG(temperature) as avg_temperature,
  MIN(temperature) as min_temperature,
  MAX(temperature) as max_temperature,
  AVG(humidity) as avg_humidity,
  AVG("windSpeed") as avg_wind_speed
FROM "weatherPeriods";

-- Weather condition distribution
SELECT '';
SELECT '=== WEATHER CONDITIONS ===' as section;
SELECT 
  condition,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM "weatherPeriods"), 1) as percent
FROM "weatherPeriods"
GROUP BY condition
ORDER BY count DESC;

-- Weather import log status
SELECT '';
SELECT '=== IMPORT LOG STATUS ===' as section;
SELECT 
  result,
  COUNT(*) as count,
  ROUND(AVG("durationMs"), 2) as avg_duration_ms,
  MIN("createdAt") as oldest_log,
  MAX("createdAt") as newest_log
FROM "weatherImportLogs"
GROUP BY result;

-- Tournaments with weather vs without
SELECT '';
SELECT '=== TOURNAMENT WEATHER COVERAGE ===' as section;
SELECT 
  'With weather snapshot' as category,
  COUNT(DISTINCT ws."tournamentId") as count
FROM tournaments t
LEFT JOIN "weatherSnapshots" ws ON t.id = ws."tournamentId"
WHERE ws.id IS NOT NULL AND t."deletedAt" IS NULL
UNION ALL
SELECT 
  'Without weather snapshot' as category,
  COUNT(*) as count
FROM tournaments t
LEFT JOIN "weatherSnapshots" ws ON t.id = ws."tournamentId"
WHERE ws.id IS NULL AND t."deletedAt" IS NULL;

-- Weather import log details
SELECT '';
SELECT '=== RECENT IMPORT LOGS (LAST 20) ===' as section;
SELECT 
  wil.id,
  t.name as tournament_name,
  wil.result,
  wil."forecastEligible",
  wil."durationMs",
  wil."createdAt"
FROM "weatherImportLogs" wil
LEFT JOIN tournaments t ON wil."tournamentId" = t.id
ORDER BY wil."createdAt" DESC
LIMIT 20;
